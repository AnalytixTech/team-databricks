import { Response, NextFunction } from 'express';
import Reservation from '../models/Reservation';
import Car from '../models/Car';
import { AuthRequest, ReservationStatus, ReservationType, PaymentStatus } from '../types';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS } from '../utils/constants';
import { successResponse, calculateDays, formatDate } from '../utils/helpers';
import emailService from '../services/email.service';

/**
 * Get cars owned by the current business owner
 */
export const getOwnerCars = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new BadRequestError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const ownerId = (req.user as any).id;

    // Get only cars owned by the current user
    const cars = await Car.find({ ownerId })
      .sort({ createdAt: -1 });

    res.status(HTTP_STATUS.OK).json(successResponse(cars));
  } catch (error) {
    next(error);
  }
};

/**
 * Get all reservations for cars owned by the current business owner
 */
export const getAllReservations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new BadRequestError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const ownerId = (req.user as any).id;
    const { status, type, carId } = req.query;

    // First, get all cars owned by this user
    const ownedCarIds = await Car.find({ ownerId }).distinct('_id');

    // Build query to only include reservations for owned cars
    const query: any = { carId: { $in: ownedCarIds } };

    if (status) query.status = status;
    if (type) query.reservationType = type;
    if (carId) {
      // Verify the specified carId belongs to the owner
      if (!ownedCarIds.some(id => id.toString() === carId)) {
        throw new ForbiddenError('You can only view reservations for your own cars');
      }
      query.carId = carId;
    }

    const reservations = await Reservation.find(query)
      .populate('carId')
      .populate('userId')
      .sort({ createdAt: -1 });

    res.status(HTTP_STATUS.OK).json(successResponse(reservations));
  } catch (error) {
    next(error);
  }
};

/**
 * Create reservation by business owner (bypass user frontend)
 */
export const createReservation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new BadRequestError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { carId, startDate, endDate, startTime, endTime, customerEmail, customerPhone, driverLicense } = req.body;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      throw new BadRequestError('End date must be after start date');
    }

    // Validate driver's license expiry
    const licenseExpiry = new Date(driverLicense.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (licenseExpiry < today) {
      throw new BadRequestError('Driver license has expired. Please provide a valid license.');
    }

    // Find car and verify ownership
    const car = await Car.findById(carId);
    if (!car) {
      throw new NotFoundError(ERROR_MESSAGES.CAR_NOT_FOUND);
    }

    if (car.ownerId !== (req.user as any).id) {
      throw new BadRequestError('Not authorized to create reservations for this car');
    }

    // Check for date conflicts
    const conflictingReservations = await Reservation.find({
      carId,
      reservationType: ReservationType.FIRM_RESERVE,
      status: { $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start },
        },
      ],
    });

    if (conflictingReservations.length > 0) {
      throw new BadRequestError('Car is not available for these dates');
    }

    // Find existing user or create guest reservation
    const User = (await import('../models/User')).default;
    const user = await User.findOne({ email: customerEmail.toLowerCase() });
    
    // Calculate total price (with time support)
    const days = calculateDays(start, end, startTime, endTime);
    const totalPrice = days * car.rentalPricePerDay;

    // Determine reservation type based on whether user exists
    const isUserReservation = !!user;
    const { config } = await import('../config/env');

    // Create reservation
    const reservation = await Reservation.create({
      carId,
      userId: user ? (user._id as any).toString() : undefined,
      guestInfo: !user ? { email: customerEmail, phone: customerPhone } : undefined,
      driverLicense: {
        number: driverLicense.number,
        expiryDate: driverLicense.expiryDate,
      },
      reservationType: isUserReservation ? ReservationType.FIRM_RESERVE : ReservationType.SOFT_RESERVE,
      startDate: start,
      endDate: end,
      startTime,
      endTime,
      totalPrice,
      depositPaid: 0,
      paymentStatus: PaymentStatus.PENDING,
      status: isUserReservation ? ReservationStatus.CONFIRMED : ReservationStatus.PENDING,
      softReserveExpiry: !isUserReservation 
        ? new Date(Date.now() + config.SOFT_RESERVE_WINDOW_HOURS * 60 * 60 * 1000) 
        : undefined,
    });

    // Send confirmation email
    await emailService.sendReservationConfirmation(customerEmail, {
      userName: user?.email || 'Guest',
      carMake: car.make,
      carModel: car.model,
      startDate: formatDate(start),
      endDate: formatDate(end),
      totalPrice,
      reservationId: (reservation._id as any).toString(),
    });

    res.status(HTTP_STATUS.CREATED).json(
      successResponse(
        reservation, 
        isUserReservation 
          ? 'Firm reservation created successfully'
          : 'Soft reservation created. Customer must register to confirm.'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel reservation
 */
export const cancelReservationByOwner = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new BadRequestError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { id } = req.params;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      throw new NotFoundError(ERROR_MESSAGES.RESERVATION_NOT_FOUND);
    }

    // Check if reservation has been paid and hasn't expired
    const isPaid = reservation.paymentStatus === PaymentStatus.DEPOSIT_PAID || 
                   reservation.paymentStatus === PaymentStatus.FULLY_PAID;
    const hasExpired = new Date(reservation.endDate) < new Date();

    if (isPaid && !hasExpired) {
      console.warn(`⚠️ Attempted to cancel paid reservation ${id} that hasn't expired`);
      throw new BadRequestError(
        'Cannot cancel a paid reservation before it expires. Please wait until after the end date or contact the customer for refund authorization.'
      );
    }

    console.log(`🔄 Cancelling reservation ${id}:`, {
      isPaid,
      hasExpired,
      paymentStatus: reservation.paymentStatus,
      endDate: reservation.endDate,
    });

    reservation.status = ReservationStatus.CANCELLED;
    reservation.cancelledAt = new Date();
    await reservation.save();

    // Send cancellation email
    const car = await Car.findById(reservation.carId);
    
    if (car && reservation.userId) {
      const user = await require('../models/User').default.findById(reservation.userId);
      if (user) {
        await emailService.sendReservationCancellation(user.email, {
          userName: user.email,
          carMake: car.make,
          carModel: car.model,
          startDate: formatDate(reservation.startDate),
          endDate: formatDate(reservation.endDate),
          totalPrice: reservation.totalPrice,
          reservationId: (reservation._id as any).toString(),
        });
      }
    }

    res.status(HTTP_STATUS.OK).json(
      successResponse(reservation, SUCCESS_MESSAGES.RESERVATION_CANCELLED)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Reassign reservation to a different car
 */
export const reassignReservation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new BadRequestError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { id } = req.params;
    const { newCarId } = req.body;

    // Find reservation
    const reservation = await Reservation.findById(id);
    if (!reservation) {
      throw new NotFoundError(ERROR_MESSAGES.RESERVATION_NOT_FOUND);
    }

    // Find new car
    const newCar = await Car.findById(newCarId);
    if (!newCar) {
      throw new NotFoundError(ERROR_MESSAGES.CAR_NOT_FOUND);
    }

    // Verify ownership of new car
    if (newCar.ownerId !== (req.user as any).id) {
      throw new BadRequestError('Not authorized to assign to this car');
    }

    // Check if reservation has been paid for - CRITICAL BUSINESS RULE
    const isPaid = reservation.paymentStatus === PaymentStatus.DEPOSIT_PAID || 
                   reservation.paymentStatus === PaymentStatus.FULLY_PAID;
    
    if (isPaid) {
      throw new BadRequestError('Cannot reassign a paid reservation. Customer must be refunded first.');
    }

    // Check if new car is available for the dates
    const conflictingReservations = await Reservation.find({
      carId: newCarId,
      _id: { $ne: id },
      status: { $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
      $or: [
        {
          startDate: { $lte: reservation.endDate },
          endDate: { $gte: reservation.startDate },
        },
      ],
    });

    if (conflictingReservations.length > 0) {
      throw new BadRequestError('New car is not available for these dates');
    }

    // Recalculate price based on new car
    const days = calculateDays(reservation.startDate, reservation.endDate);
    reservation.carId = newCarId;
    reservation.totalPrice = days * newCar.rentalPricePerDay;
    
    await reservation.save();

    // Send notification to customer if registered user
    if (reservation.userId) {
      const User = (await import('../models/User')).default;
      const user = await User.findById(reservation.userId);
      
      if (user) {
        try {
          await emailService.sendReservationModification(user.email, {
            userName: user.email,
            carMake: newCar.make,
            carModel: newCar.model,
            startDate: formatDate(reservation.startDate),
            endDate: formatDate(reservation.endDate),
            totalPrice: reservation.totalPrice,
            reservationId: (reservation._id as any).toString(),
          });
        } catch (emailError) {
          console.error('Failed to send reassignment email:', emailError);
          // Don't fail the reassignment if email fails
        }
      }
    }

    res.status(HTTP_STATUS.OK).json(
      successResponse(reservation, 'Reservation reassigned successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get revenue and booking reports
 */
/**
 * Get maintenance alerts
 */
export const getMaintenanceAlerts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new BadRequestError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const cars = await Car.find({ ownerId: (req.user as any).id });

    const alerts = cars.filter((car) => {
      if (!car.mileage || !car.maintenance?.nextServiceDue) {
        return false;
      }
      return car.mileage >= car.maintenance.nextServiceDue;
    }).map((car) => ({
      carId: car._id,
      make: car.make,
      model: car.model,
      currentMileage: car.mileage,
      serviceRequested: car.maintenance?.nextServiceDue,
      message: `Service required: ${car.make} ${car.model} has reached ${car.mileage?.toLocaleString()} km`,
    }));

    res.status(HTTP_STATUS.OK).json(successResponse(alerts));
  } catch (error) {
    next(error);
  }
};

/**
 * Get revenue and booking reports
 */
export const getReports = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new BadRequestError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const ownerId = (req.user as any).id;
    const { startDate, endDate } = req.query;

    // First, get all cars owned by this user
    const ownedCarIds = await Car.find({ ownerId }).distinct('_id');

    // Include CONFIRMED, COMPLETED, and PENDING reservations that have been paid (deposit or full)
    // BUT ONLY for cars owned by this business owner
    const query: any = {
      carId: { $in: ownedCarIds }, // 🔒 SECURITY FIX: Only include owned cars
      $or: [
        { status: { $in: [ReservationStatus.CONFIRMED, ReservationStatus.COMPLETED] } },
        { 
          status: ReservationStatus.PENDING,
          paymentStatus: { $in: [PaymentStatus.DEPOSIT_PAID, PaymentStatus.FULLY_PAID] }
        }
      ]
    };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    console.log('📊 Generating reports for owner:', ownerId, 'with query:', JSON.stringify(query, null, 2));

    // Get reservations (only for owned cars)
    const reservations = await Reservation.find(query);

    console.log(`📈 Found ${reservations.length} reservations for reports`);

    // Calculate metrics - only count revenue from paid reservations
    const paidReservations = reservations.filter(
      res => res.paymentStatus === PaymentStatus.DEPOSIT_PAID || 
             res.paymentStatus === PaymentStatus.FULLY_PAID
    );
    
    const totalRevenue = paidReservations.reduce((sum, res) => {
      // For deposit-paid, count the deposit amount; for fully-paid, count total
      if (res.paymentStatus === PaymentStatus.FULLY_PAID) {
        return sum + res.totalPrice;
      } else if (res.paymentStatus === PaymentStatus.DEPOSIT_PAID) {
        return sum + res.depositPaid;
      }
      return sum;
    }, 0);
    
    const totalBookings = reservations.length;
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    console.log(`💰 Revenue calculated: ${totalRevenue} from ${paidReservations.length} paid reservations`);

    // Get revenue by car - only count paid amounts
    const revenueByCarMap = new Map<string, number>();
    for (const reservation of paidReservations) {
      const carId = reservation.carId.toString();
      const current = revenueByCarMap.get(carId) || 0;
      
      // Add the actual paid amount
      let paidAmount = 0;
      if (reservation.paymentStatus === PaymentStatus.FULLY_PAID) {
        paidAmount = reservation.totalPrice;
      } else if (reservation.paymentStatus === PaymentStatus.DEPOSIT_PAID) {
        paidAmount = reservation.depositPaid;
      }
      
      revenueByCarMap.set(carId, current + paidAmount);
    }

    console.log(`🚗 Revenue by car calculated for ${revenueByCarMap.size} cars`);

    // Get car details for top cars
    const topCars = await Promise.all(
      Array.from(revenueByCarMap.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(async ([carId, revenue]) => {
          const car = await Car.findById(carId);
          return {
            carId,
            make: car?.make,
            model: car?.model,
            revenue,
          };
        })
    );

    // Get reservation statistics
    const reservationsByStatus = await Reservation.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const reservationsByType = await Reservation.aggregate([
      { $match: query },
      { $group: { _id: '$reservationType', count: { $sum: 1 } } },
    ]);

    res.status(HTTP_STATUS.OK).json(
      successResponse({
        overview: {
          totalRevenue,
          totalBookings,
          averageBookingValue,
        },
        topCars,
        reservationsByStatus,
        reservationsByType,
      })
    );
  } catch (error) {
    next(error);
  }
};

