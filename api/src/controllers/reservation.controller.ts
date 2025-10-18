import { Response, NextFunction } from 'express';
import Reservation from '../models/Reservation';
import Car from '../models/Car';
import { AuthRequest, ReservationType, ReservationStatus, PaymentStatus } from '../types';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS } from '../utils/constants';
import { successResponse, calculateDays, formatDate } from '../utils/helpers';
import emailService from '../services/email.service';
import { config } from '../config/env';

/**
 * Create soft reservation (guest)
 */
export const createSoftReservation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { carId, startDate, endDate, startTime, endTime, guestInfo, driverLicense } = req.body;

    // Validate driver's license expiry
    const licenseExpiry = new Date(driverLicense.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (licenseExpiry < today) {
      throw new BadRequestError('Driver license has expired. Please provide a valid license.');
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      throw new BadRequestError(ERROR_MESSAGES.INVALID_DATES);
    }

    // Find car
    const car = await Car.findById(carId);
    if (!car) {
      throw new NotFoundError(ERROR_MESSAGES.CAR_NOT_FOUND);
    }

    // Check car availability
    if (car.availability?.status !== 'available') {
      throw new BadRequestError(ERROR_MESSAGES.CAR_UNAVAILABLE);
    }

    // Check for firm reservations (soft reserves can overlap, will be overridden)
    const conflictingFirmReservations = await Reservation.find({
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

    if (conflictingFirmReservations.length > 0) {
      throw new ConflictError(ERROR_MESSAGES.CAR_UNAVAILABLE);
    }

    // Calculate total price (with time support)
    const days = calculateDays(start, end, startTime, endTime);
    const totalPrice = days * car.rentalPricePerDay;

    // Set soft reserve expiry
    const softReserveExpiry = new Date(
      Date.now() + config.SOFT_RESERVE_WINDOW_HOURS * 60 * 60 * 1000
    );

    // Create reservation
    const reservation = await Reservation.create({
      carId,
      guestInfo,
      driverLicense: {
        number: driverLicense.number,
        expiryDate: driverLicense.expiryDate,
      },
      reservationType: ReservationType.SOFT_RESERVE,
      startDate: start,
      endDate: end,
      startTime,
      endTime,
      totalPrice,
      depositPaid: 0,
      paymentStatus: PaymentStatus.PENDING,
      status: ReservationStatus.PENDING,
      softReserveExpiry,
    });

    // Send confirmation email
    await emailService.sendReservationConfirmation(guestInfo.email, {
      userName: 'Guest',
      carMake: car.make,
      carModel: car.model,
      startDate: formatDate(start),
      endDate: formatDate(end),
      totalPrice,
      reservationId: (reservation._id as any).toString(),
    });

    res.status(HTTP_STATUS.CREATED).json(
      successResponse(
        {
          reservation,
          expiresAt: softReserveExpiry,
        },
        SUCCESS_MESSAGES.RESERVATION_CREATED
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Create firm reservation (account holder)
 */
export const createFirmReservation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new BadRequestError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { carId, startDate, endDate, startTime, endTime } = req.body;

    // Get user's driver license from profile
    const User = (await import('../models/User')).default;
    const user = await User.findById((req.user as any).id);
    
    if (!user?.profile?.driverLicense?.number || !user?.profile?.driverLicense?.expiryDate) {
      throw new BadRequestError('Please add your driver license information in your profile before booking.');
    }

    // Validate driver's license expiry from profile
    const licenseExpiry = new Date(user.profile.driverLicense.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (licenseExpiry < today) {
      throw new BadRequestError('Your driver license has expired. Please update it in your profile.');
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      throw new BadRequestError(ERROR_MESSAGES.INVALID_DATES);
    }

    // Find car
    const car = await Car.findById(carId);
    if (!car) {
      throw new NotFoundError(ERROR_MESSAGES.CAR_NOT_FOUND);
    }

    // Check car availability
    if (car.availability?.status !== 'available') {
      throw new BadRequestError(ERROR_MESSAGES.CAR_UNAVAILABLE);
    }

    // Check for firm reservations
    const conflictingFirmReservations = await Reservation.find({
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

    if (conflictingFirmReservations.length > 0) {
      throw new ConflictError(ERROR_MESSAGES.DATE_OVERLAP);
    }

    // Check for soft reservations and override them
    const conflictingSoftReservations = await Reservation.find({
      carId,
      reservationType: ReservationType.SOFT_RESERVE,
      status: { $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start },
        },
      ],
    });

    // Override soft reservations
    for (const softReserve of conflictingSoftReservations) {
      softReserve.status = ReservationStatus.CANCELLED;
      softReserve.cancelledAt = new Date();
      await softReserve.save();

      // Notify guest
      if (softReserve.guestInfo?.email) {
        await emailService.sendGuestOverrideNotification(softReserve.guestInfo.email, {
          userName: 'Guest',
          carMake: car.make,
          carModel: car.model,
          startDate: formatDate(softReserve.startDate),
          endDate: formatDate(softReserve.endDate),
          totalPrice: softReserve.totalPrice,
          reservationId: (softReserve._id as any).toString(),
        });
      }
    }

    // Calculate total price (with time support)
    const days = calculateDays(start, end, startTime, endTime);
    const totalPrice = days * car.rentalPricePerDay;

    // Create reservation using driver license from user profile
    const reservation = await Reservation.create({
      carId,
      userId: (req.user as any).id,
      driverLicense: {
        number: user.profile.driverLicense.number,
        expiryDate: user.profile.driverLicense.expiryDate,
      },
      reservationType: ReservationType.FIRM_RESERVE,
      startDate: start,
      endDate: end,
      startTime,
      endTime,
      totalPrice,
      depositPaid: 0,
      paymentStatus: PaymentStatus.PENDING,
      status: ReservationStatus.CONFIRMED,
    });

    // Send confirmation email
    await emailService.sendReservationConfirmation((req.user as any).email, {
      userName: (req.user as any).email,
      carMake: car.make,
      carModel: car.model,
      startDate: formatDate(start),
      endDate: formatDate(end),
      totalPrice,
      reservationId: (reservation._id as any).toString(),
    });

    res.status(HTTP_STATUS.CREATED).json(
      successResponse(reservation, SUCCESS_MESSAGES.RESERVATION_CREATED)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Convert soft reservation to firm reservation
 */
export const convertSoftReservation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new BadRequestError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { reservationId } = req.body;

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      throw new NotFoundError(ERROR_MESSAGES.RESERVATION_NOT_FOUND);
    }

    // Validate it's a soft reservation
    if (reservation.reservationType !== ReservationType.SOFT_RESERVE) {
      throw new BadRequestError('Only soft reservations can be converted');
    }

    // Check if expired
    if (reservation.softReserveExpiry && reservation.softReserveExpiry < new Date()) {
      throw new BadRequestError(ERROR_MESSAGES.SOFT_RESERVE_EXPIRED);
    }

    // Check if already cancelled
    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new BadRequestError('Reservation has been cancelled');
    }

    // Update reservation
    reservation.reservationType = ReservationType.FIRM_RESERVE;
    reservation.userId = (req.user as any).id;
    reservation.status = ReservationStatus.CONFIRMED;
    reservation.softReserveExpiry = undefined;
    await reservation.save();

    // Get car details for email
    const car = await Car.findById(reservation.carId);

    if (car) {
      await emailService.sendReservationConfirmation((req.user as any).email, {
        userName: (req.user as any).email,
        carMake: car.make,
        carModel: car.model,
        startDate: formatDate(reservation.startDate),
        endDate: formatDate(reservation.endDate),
        totalPrice: reservation.totalPrice,
        reservationId: (reservation._id as any).toString(),
      });
    }

    res.status(HTTP_STATUS.OK).json(
      successResponse(reservation, SUCCESS_MESSAGES.SOFT_RESERVE_CONVERTED)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's reservations
 */
export const getMyReservations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new BadRequestError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const reservations = await Reservation.find({ userId: (req.user as any).id })
      .populate('carId')
      .sort({ createdAt: -1 });

    res.status(HTTP_STATUS.OK).json(successResponse(reservations));
  } catch (error) {
    next(error);
  }
};

/**
 * Update reservation
 */
export const updateReservation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new BadRequestError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { id } = req.params;
    const { startDate, endDate, startTime, endTime } = req.body;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      throw new NotFoundError(ERROR_MESSAGES.RESERVATION_NOT_FOUND);
    }

    // Check ownership
    if (reservation.userId !== (req.user as any).id) {
      throw new BadRequestError(ERROR_MESSAGES.CANNOT_MODIFY_RESERVATION);
    }

    // Check if can be modified
    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new BadRequestError(ERROR_MESSAGES.CANNOT_MODIFY_RESERVATION);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      throw new BadRequestError(ERROR_MESSAGES.INVALID_DATES);
    }

    // Check for conflicts (excluding current reservation)
    const conflictingReservations = await Reservation.find({
      _id: { $ne: id },
      carId: reservation.carId,
      status: { $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start },
        },
      ],
    });

    if (conflictingReservations.length > 0) {
      throw new ConflictError(ERROR_MESSAGES.DATE_OVERLAP);
    }

    // Recalculate price
    const car = await Car.findById(reservation.carId);
    if (!car) {
      throw new NotFoundError(ERROR_MESSAGES.CAR_NOT_FOUND);
    }

    const days = calculateDays(start, end, startTime, endTime);
    const totalPrice = days * car.rentalPricePerDay;

    reservation.startDate = start;
    reservation.endDate = end;
    reservation.startTime = startTime;
    reservation.endTime = endTime;
    reservation.totalPrice = totalPrice;
    await reservation.save();

    // Send modification email
    await emailService.sendReservationModification((req.user as any).email, {
      userName: (req.user as any).email,
      carMake: car.make,
      carModel: car.model,
      startDate: formatDate(start),
      endDate: formatDate(end),
      totalPrice,
      reservationId: (reservation._id as any).toString(),
    });

    res.status(HTTP_STATUS.OK).json(
      successResponse(reservation, SUCCESS_MESSAGES.RESERVATION_UPDATED)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel reservation
 */
export const cancelReservation = async (
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

    // Check ownership
    if (reservation.userId !== (req.user as any).id) {
      throw new BadRequestError(ERROR_MESSAGES.CANNOT_MODIFY_RESERVATION);
    }

    reservation.status = ReservationStatus.CANCELLED;
    reservation.cancelledAt = new Date();
    await reservation.save();

    // Get car details
    const car = await Car.findById(reservation.carId);

    if (car) {
      await emailService.sendReservationCancellation((req.user as any).email, {
        userName: (req.user as any).email,
        carMake: car.make,
        carModel: car.model,
        startDate: formatDate(reservation.startDate),
        endDate: formatDate(reservation.endDate),
        totalPrice: reservation.totalPrice,
        reservationId: (reservation._id as any).toString(),
      });
    }

    res.status(HTTP_STATUS.OK).json(
      successResponse(reservation, SUCCESS_MESSAGES.RESERVATION_CANCELLED)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Rate a completed reservation
 */
export const rateReservation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new BadRequestError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { id } = req.params;
    const { stars, review } = req.body;

    // Find reservation
    const reservation = await Reservation.findById(id);
    if (!reservation) {
      throw new NotFoundError(ERROR_MESSAGES.RESERVATION_NOT_FOUND);
    }

    // Verify ownership
    if (reservation.userId !== (req.user as any).id) {
      throw new BadRequestError('Not authorized to rate this reservation');
    }

    // Check if reservation is completed
    if (reservation.status !== ReservationStatus.COMPLETED) {
      throw new BadRequestError('Can only rate completed reservations');
    }

    // Check if already rated
    if (reservation.rating?.ratedAt) {
      throw new BadRequestError('Reservation has already been rated');
    }

    // Save rating
    reservation.rating = {
      stars,
      review,
      ratedAt: new Date(),
    };

    await reservation.save();

    res.status(HTTP_STATUS.OK).json(
      successResponse(reservation, 'Rating submitted successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Mark reservation as picked up
 */
export const markAsPickedUp = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new BadRequestError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { id } = req.params;
    const { latitude, longitude, address } = req.body;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      throw new NotFoundError(ERROR_MESSAGES.RESERVATION_NOT_FOUND);
    }

    // Verify ownership
    if (reservation.userId !== (req.user as any).id) {
      throw new BadRequestError('Not authorized to update this reservation');
    }

    // Check if already picked up
    if (reservation.pickedUpAt) {
      throw new BadRequestError('Car has already been picked up');
    }

    // Check if reservation is confirmed and paid
    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new BadRequestError('Reservation must be confirmed to pick up');
    }

    // Update pickup information
    reservation.pickedUpAt = new Date();
    if (latitude && longitude) {
      reservation.pickupLocation = {
        latitude,
        longitude,
        address,
      };
    }

    await reservation.save();

    res.status(HTTP_STATUS.OK).json(
      successResponse(reservation, 'Car marked as picked up successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Mark reservation as returned
 */
export const markAsReturned = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new BadRequestError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { id } = req.params;
    const { latitude, longitude, address } = req.body;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      throw new NotFoundError(ERROR_MESSAGES.RESERVATION_NOT_FOUND);
    }

    // Verify ownership
    if (reservation.userId !== (req.user as any).id) {
      throw new BadRequestError('Not authorized to update this reservation');
    }

    // Check if picked up
    if (!reservation.pickedUpAt) {
      throw new BadRequestError('Car must be picked up before returning');
    }

    // Check if already returned
    if (reservation.returnedAt) {
      throw new BadRequestError('Car has already been returned');
    }

    // Update return information
    reservation.returnedAt = new Date();
    reservation.status = ReservationStatus.COMPLETED;
    if (latitude && longitude) {
      reservation.returnLocation = {
        latitude,
        longitude,
        address,
      };
    }

    await reservation.save();

    res.status(HTTP_STATUS.OK).json(
      successResponse(reservation, 'Car marked as returned successfully')
    );
  } catch (error) {
    next(error);
  }
};

