import cron from 'node-cron';
import Reservation from '../models/Reservation';
import Car from '../models/Car';
import { ReservationType, ReservationStatus } from '../types';
import emailService from '../services/email.service';
import { formatDate } from './helpers';

/**
 * Check and cancel expired soft reservations
 * Runs every 15 minutes
 */
export const cancelExpiredSoftReservations = cron.schedule('*/15 * * * *', async () => {
  try {
    console.log('Running cron job: Cancel expired soft reservations');

    const expiredReservations = await Reservation.find({
      reservationType: ReservationType.SOFT_RESERVE,
      status: { $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
      softReserveExpiry: { $lt: new Date() },
    });

    for (const reservation of expiredReservations) {
      // Cancel reservation
      reservation.status = ReservationStatus.CANCELLED;
      reservation.cancelledAt = new Date();
      await reservation.save();

      // Send cancellation email
      if (reservation.guestInfo?.email) {
        const car = await Car.findById(reservation.carId);
        if (car) {
          await emailService.sendReservationCancellation(
            reservation.guestInfo.email,
            {
              userName: 'Guest',
              carMake: car.make,
              carModel: car.model,
              startDate: formatDate(reservation.startDate),
              endDate: formatDate(reservation.endDate),
              totalPrice: reservation.totalPrice,
              reservationId: (reservation._id as any).toString(),
            }
          );
        }
      }
    }

    console.log(`Cancelled ${expiredReservations.length} expired soft reservations`);
  } catch (error) {
    console.error('Error in cancelExpiredSoftReservations cron job:', error);
  }
});

/**
 * Send reminder emails for soft reservations expiring soon
 * Runs every hour
 */
export const sendSoftReserveReminders = cron.schedule('0 * * * *', async () => {
  try {
    console.log('Running cron job: Send soft reservation reminders');

    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const oneHourFromNow = new Date(Date.now() + 1 * 60 * 60 * 1000);

    const expiringReservations = await Reservation.find({
      reservationType: ReservationType.SOFT_RESERVE,
      status: { $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
      softReserveExpiry: {
        $gte: oneHourFromNow,
        $lte: twoHoursFromNow,
      },
    });

    for (const reservation of expiringReservations) {
      if (reservation.guestInfo?.email && reservation.softReserveExpiry) {
        const car = await Car.findById(reservation.carId);
        if (car) {
          await emailService.sendSoftReserveReminder(
            reservation.guestInfo.email,
            {
              userName: 'Guest',
              carMake: car.make,
              carModel: car.model,
              startDate: formatDate(reservation.startDate),
              endDate: formatDate(reservation.endDate),
              totalPrice: reservation.totalPrice,
              reservationId: (reservation._id as any).toString(),
              expiryTime: reservation.softReserveExpiry.toLocaleString(),
            }
          );
        }
      }
    }

    console.log(`Sent ${expiringReservations.length} soft reservation reminders`);
  } catch (error) {
    console.error('Error in sendSoftReserveReminders cron job:', error);
  }
});

/**
 * Send return reminder emails for rentals due within 24 hours
 * Runs every 6 hours
 */
export const sendReturnReminders = cron.schedule('0 */6 * * *', async () => {
  try {
    console.log('Running cron job: Send return reminders');

    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find active rentals that are picked up but not returned, due within 24 hours
    const upcomingReturns = await Reservation.find({
      pickedUpAt: { $exists: true, $ne: null },
      returnedAt: { $exists: false },
      endDate: {
        $gte: now,
        $lte: twentyFourHoursFromNow,
      },
      status: ReservationStatus.CONFIRMED,
    }).populate('carId').populate('userId');

    for (const reservation of upcomingReturns) {
      const car = reservation.carId as any;
      const user = reservation.userId as any;
      
      if (car && user?.email) {
        const hoursRemaining = Math.ceil(
          (new Date(reservation.endDate).getTime() - now.getTime()) / (1000 * 60 * 60)
        );

        await emailService.sendReturnReminder(user.email, {
          userName: user.email,
          carMake: car.make,
          carModel: car.model,
          startDate: formatDate(reservation.startDate),
          endDate: formatDate(reservation.endDate),
          totalPrice: reservation.totalPrice,
          reservationId: (reservation._id as any).toString(),
          hoursRemaining,
        });
      }
    }

    console.log(`Sent ${upcomingReturns.length} return reminder emails`);
  } catch (error) {
    console.error('Error in sendReturnReminders cron job:', error);
  }
});

/**
 * Send overdue notification for cars not returned on time
 * Runs every 2 hours
 */
export const sendOverdueNotifications = cron.schedule('0 */2 * * *', async () => {
  try {
    console.log('Running cron job: Send overdue notifications');

    const now = new Date();

    // Find active rentals that are overdue (past end date, picked up but not returned)
    const overdueReturns = await Reservation.find({
      pickedUpAt: { $exists: true, $ne: null },
      returnedAt: { $exists: false },
      endDate: { $lt: now },
      status: ReservationStatus.CONFIRMED,
    }).populate('carId').populate('userId');

    for (const reservation of overdueReturns) {
      const car = reservation.carId as any;
      const user = reservation.userId as any;
      
      if (car && user?.email) {
        const hoursOverdue = Math.ceil(
          (now.getTime() - new Date(reservation.endDate).getTime()) / (1000 * 60 * 60)
        );

        await emailService.sendOverdueReturnNotification(user.email, {
          userName: user.email,
          carMake: car.make,
          carModel: car.model,
          startDate: formatDate(reservation.startDate),
          endDate: formatDate(reservation.endDate),
          totalPrice: reservation.totalPrice,
          reservationId: (reservation._id as any).toString(),
          hoursOverdue,
        });
      }
    }

    console.log(`Sent ${overdueReturns.length} overdue notification emails`);
  } catch (error) {
    console.error('Error in sendOverdueNotifications cron job:', error);
  }
});

/**
 * Start all cron jobs
 */
export const startCronJobs = (): void => {
  console.log('Starting cron jobs...');
  cancelExpiredSoftReservations.start();
  sendSoftReserveReminders.start();
  sendReturnReminders.start();
  sendOverdueNotifications.start();
  console.log('Cron jobs started');
};

/**
 * Stop all cron jobs
 */
export const stopCronJobs = (): void => {
  console.log('Stopping cron jobs...');
  cancelExpiredSoftReservations.stop();
  sendSoftReserveReminders.stop();
  sendReturnReminders.stop();
  sendOverdueNotifications.stop();
  console.log('Cron jobs stopped');
};

