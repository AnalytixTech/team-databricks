import { Response, NextFunction } from 'express';
import Car from '../models/Car';
import Reservation from '../models/Reservation';
import { AuthRequest, ReservationStatus } from '../types';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS, PAGINATION } from '../utils/constants';
import { successResponse, datesOverlap } from '../utils/helpers';
import cloudinaryService from '../services/cloudinary.service';
import geocodingService from '../services/geocoding.service';

/**
 * Get all cars with filters
 */
export const getCars = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      make,
      model,
      type,
      startDate,
      endDate,
      minPrice,
      maxPrice,
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
    } = req.query as any;

    const query: any = { 'availability.status': 'available' };

    // Apply filters
    if (make) query.make = new RegExp(make, 'i');
    if (model) query.model = new RegExp(model, 'i');
    if (type) query.type = type;

    if (minPrice || maxPrice) {
      query.rentalPricePerDay = {};
      if (minPrice) query.rentalPricePerDay.$gte = Number(minPrice);
      if (maxPrice) query.rentalPricePerDay.$lte = Number(maxPrice);
    }

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(PAGINATION.MAX_LIMIT, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    // Get cars
    let cars = await Car.find(query)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    // Add average ratings to each car
    const carsWithRatings = await Promise.all(
      cars.map(async (car) => {
        const ratings = await Reservation.find({
          carId: car._id,
          'rating.stars': { $exists: true },
        });

        const averageRating = ratings.length > 0
          ? ratings.reduce((sum, r) => sum + (r.rating?.stars || 0), 0) / ratings.length
          : 0;

        return {
          ...car.toObject(),
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
          ratingCount: ratings.length,
        };
      })
    );

    cars = carsWithRatings as any;

    // Filter by availability dates if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const availableCars = await Promise.all(
        cars.map(async (car) => {
          // Check blocked dates
          const hasBlockedDate = car.availability?.blockedDates?.some(
            (blockedDate) =>
              datesOverlap(start, end, new Date(blockedDate as any), new Date(blockedDate as any))
          );

          if (hasBlockedDate) return null;

          // Check existing reservations
          const conflictingReservations = await Reservation.find({
            carId: car._id,
            status: { $in: ['pending', 'confirmed'] },
            $or: [
              {
                startDate: { $lte: end },
                endDate: { $gte: start },
              },
            ],
          });

          return conflictingReservations.length === 0 ? car : null;
        })
      );

      cars = availableCars.filter((car) => car !== null) as any[];
    }

    const total = await Car.countDocuments(query);

    res.status(HTTP_STATUS.OK).json(
      successResponse({
        cars,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get car by ID
 */
/**
 * Get recommended/popular cars
 */
export const getRecommendedCars = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get user ID if authenticated
    const userId = req.user ? (req.user as any).id : null;

    // Get user's past reservation preferences if logged in
    let preferredTypes: string[] = [];
    if (userId) {
      const userReservations = await Reservation.find({ userId })
        .populate('carId')
        .limit(10);
      
      const typeCounts = new Map<string, number>();
      userReservations.forEach((res) => {
        const car = res.carId as any;
        if (car?.type) {
          typeCounts.set(car.type, (typeCounts.get(car.type) || 0) + 1);
        }
      });

      preferredTypes = Array.from(typeCounts.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2)
        .map(([type]) => type);
    }

    // Get popular cars (most booked)
    const popularCarIds = await Reservation.aggregate([
      { $match: { status: { $in: [ReservationStatus.CONFIRMED, ReservationStatus.COMPLETED] } } },
      { $group: { _id: '$carId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    const popularCars = await Promise.all(
      popularCarIds.map(async (item) => {
        const car = await Car.findById(item._id);
        if (!car) return null;

        const ratings = await Reservation.find({
          carId: item._id,
          'rating.stars': { $exists: true },
        });

        const averageRating = ratings.length > 0
          ? ratings.reduce((sum, r) => sum + (r.rating?.stars || 0), 0) / ratings.length
          : 0;

        return {
          ...car.toObject(),
          bookingCount: item.count,
          averageRating: Math.round(averageRating * 10) / 10,
          ratingCount: ratings.length,
        };
      })
    );

    // Get recommended cars based on user preferences
    let recommendedCars: any[] = [];
    if (preferredTypes.length > 0) {
      recommendedCars = await Car.find({
        type: { $in: preferredTypes },
        'availability.status': 'available',
      }).limit(6);

      // Add ratings
      recommendedCars = await Promise.all(
        recommendedCars.map(async (car) => {
          const ratings = await Reservation.find({
            carId: car._id,
            'rating.stars': { $exists: true },
          });

          const averageRating = ratings.length > 0
            ? ratings.reduce((sum, r) => sum + (r.rating?.stars || 0), 0) / ratings.length
            : 0;

          return {
            ...car.toObject(),
            averageRating: Math.round(averageRating * 10) / 10,
            ratingCount: ratings.length,
          };
        })
      );
    }

    res.status(HTTP_STATUS.OK).json(
      successResponse({
        popular: popularCars.filter((c) => c !== null),
        recommended: recommendedCars,
        preferredTypes,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get car by ID
 */
export const getCarById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const car = await Car.findById(id);
    if (!car) {
      throw new NotFoundError(ERROR_MESSAGES.CAR_NOT_FOUND);
    }

    res.status(HTTP_STATUS.OK).json(successResponse(car));
  } catch (error) {
    next(error);
  }
};

/**
 * Create new car
 */
export const createCar = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ForbiddenError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const carData: any = {
      ...req.body,
      ownerId: (req.user as any).id,
    };

    // Auto-geocode address if location details are provided
    if (carData.location?.address) {
      console.log('🗺️ Geocoding car location...');
      const geocodeResult = await geocodingService.getCoordinatesFromAddress(
        carData.location.address,
        carData.location.city,
        carData.location.state
      );

      carData.location.coordinates = {
        lat: geocodeResult.lat,
        lng: geocodeResult.lng,
      };
    }

    const car = await Car.create(carData);

    res.status(HTTP_STATUS.CREATED).json(
      successResponse(car, SUCCESS_MESSAGES.CAR_CREATED)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update car
 */
export const updateCar = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      throw new ForbiddenError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const car = await Car.findById(id);
    if (!car) {
      throw new NotFoundError(ERROR_MESSAGES.CAR_NOT_FOUND);
    }

    // Check ownership
    if (car.ownerId !== (req.user as any).id) {
      throw new ForbiddenError(ERROR_MESSAGES.FORBIDDEN);
    }

    const updateData: any = { ...req.body };

    // Auto-geocode address if location details are provided
    if (updateData.location?.address) {
      console.log('🗺️ Geocoding updated car location...');
      const geocodeResult = await geocodingService.getCoordinatesFromAddress(
        updateData.location.address,
        updateData.location.city,
        updateData.location.state
      );

      updateData.location.coordinates = {
        lat: geocodeResult.lat,
        lng: geocodeResult.lng,
      };
    }

    const updatedCar = await Car.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(HTTP_STATUS.OK).json(
      successResponse(updatedCar, SUCCESS_MESSAGES.CAR_UPDATED)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete car
 */
export const deleteCar = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      throw new ForbiddenError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const car = await Car.findById(id);
    if (!car) {
      throw new NotFoundError(ERROR_MESSAGES.CAR_NOT_FOUND);
    }

    // Check ownership
    if (car.ownerId !== (req.user as any).id) {
      throw new ForbiddenError(ERROR_MESSAGES.FORBIDDEN);
    }

    // Delete images from Cloudinary
    if (car.images.length > 0) {
      await cloudinaryService.deleteMultipleCarImages(car.images);
    }

    await Car.findByIdAndDelete(id);

    res.status(HTTP_STATUS.OK).json(
      successResponse(null, SUCCESS_MESSAGES.CAR_DELETED)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Upload car images
 */
export const uploadCarImages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      throw new ForbiddenError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const car = await Car.findById(id);
    if (!car) {
      throw new NotFoundError(ERROR_MESSAGES.CAR_NOT_FOUND);
    }

    // Check ownership
    if (car.ownerId !== (req.user as any).id) {
      throw new ForbiddenError(ERROR_MESSAGES.FORBIDDEN);
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      throw new NotFoundError('No files uploaded');
    }

    // Upload images to Cloudinary
    const imageUrls = await cloudinaryService.uploadMultipleCarImages(files, id);

    // Add images to car
    car.images.push(...imageUrls);
    await car.save();

    res.status(HTTP_STATUS.OK).json(
      successResponse({ images: car.images }, 'Images uploaded successfully')
    );
  } catch (error) {
    next(error);
  }
};

