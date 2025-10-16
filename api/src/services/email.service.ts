import sgMail from '@sendgrid/mail';
import { config } from '../config/env';
import { ReservationEmailData } from '../types';

sgMail.setApiKey(config.SENDGRID_API_KEY);

class EmailService {
  private from = config.SENDGRID_FROM_EMAIL;

  /**
   * Send reservation confirmation email
   */
  async sendReservationConfirmation(
    to: string,
    data: ReservationEmailData
  ): Promise<void> {
    const { userName, carMake, carModel, startDate, endDate, totalPrice, reservationId } = data;

    const msg = {
      to,
      from: {
        email: this.from,
        name: 'Fleetly Car Rental'
      },
      replyTo: this.from,
      subject: '✅ Your Car Reservation is Confirmed - Fleetly',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reservation Confirmed</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Fleetly</h1>
              <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Car Rental Platform</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #059669; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">
                🎉 Reservation Confirmed!
              </h2>
              
              <p style="font-size: 16px; margin: 0 0 25px 0;">
                Dear <strong>${userName}</strong>,
              </p>
              
              <p style="font-size: 16px; margin: 0 0 25px 0;">
                Great news! Your car reservation has been successfully confirmed. Here are your booking details:
              </p>
              
              <!-- Reservation Details Card -->
              <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #1e293b; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">
                  📋 Booking Details
                </h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #475569;">Vehicle:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${carMake} ${carModel}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #475569;">Pickup Date:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${startDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #475569;">Return Date:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${endDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #475569;">Total Amount:</td>
                    <td style="padding: 8px 0; color: #059669; font-weight: 700; font-size: 18px;">₦${totalPrice.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #475569;">Reference:</td>
                    <td style="padding: 8px 0; font-family: monospace; color: #1e293b;">${reservationId}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Call to Action -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${config.FRONTEND_URL}/reservations" 
                   style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View My Reservations
                </a>
              </div>
              
              <!-- Important Notes -->
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">📌 Important Reminders:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                  <li>Please bring a valid driver's license</li>
                  <li>Arrive on time for pickup</li>
                  <li>Keep this confirmation email for reference</li>
                </ul>
              </div>
              
              <p style="font-size: 16px; margin: 25px 0 0 0;">
                If you have any questions or need assistance, please don't hesitate to contact our support team.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">
                Thank you for choosing Fleetly Car Rental
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                © 2025 Fleetly. All rights reserved.<br>
                This email was sent to ${to} regarding your reservation.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Reservation Confirmed!
        
        Dear ${userName},
        
        Your car reservation has been confirmed.
        
        Details:
        - Car: ${carMake} ${carModel}
        - Pickup Date: ${startDate}
        - Return Date: ${endDate}
        - Total Price: ₦${totalPrice.toLocaleString()}
        - Reservation ID: ${reservationId}
        
        Please keep this confirmation for your records.
        
        Best regards,
        Fleetly Team
      `,
      categories: ['reservation-confirmation'],
      customArgs: {
        'reservation_id': reservationId,
        'email_type': 'confirmation'
      }
    };

    try {
      await sgMail.send(msg);
      console.log(`Confirmation email sent to ${to}`);
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      throw error;
    }
  }

  /**
   * Send reservation cancellation email
   */
  async sendReservationCancellation(
    to: string,
    data: ReservationEmailData
  ): Promise<void> {
    const { userName, carMake, carModel, startDate, endDate, totalPrice, reservationId } = data;

    const msg = {
      to,
      from: {
        email: this.from,
        name: 'Fleetly Car Rental'
      },
      replyTo: this.from,
      subject: '❌ Reservation Cancelled - Fleetly',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reservation Cancelled</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Fleetly</h1>
              <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Car Rental Platform</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #dc2626; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">
                ❌ Reservation Cancelled
              </h2>
              
              <p style="font-size: 16px; margin: 0 0 25px 0;">
                Dear <strong>${userName}</strong>,
              </p>
              
              <p style="font-size: 16px; margin: 0 0 25px 0;">
                Your car reservation has been cancelled. Here are the details of the cancelled booking:
              </p>
              
              <!-- Cancelled Reservation Details -->
              <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #991b1b; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">
                  📋 Cancelled Booking
                </h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #7f1d1d;">Vehicle:</td>
                    <td style="padding: 8px 0; color: #991b1b;">${carMake} ${carModel}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #7f1d1d;">Pickup Date:</td>
                    <td style="padding: 8px 0; color: #991b1b;">${startDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #7f1d1d;">Return Date:</td>
                    <td style="padding: 8px 0; color: #991b1b;">${endDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #7f1d1d;">Amount:</td>
                    <td style="padding: 8px 0; color: #991b1b; font-weight: 700;">₦${totalPrice.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #7f1d1d;">Reference:</td>
                    <td style="padding: 8px 0; font-family: monospace; color: #991b1b;">${reservationId}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Important Notice -->
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">⚠️ Important:</h4>
                <p style="margin: 0; color: #92400e;">
                  If you did not request this cancellation, please contact our support team immediately at support@fleetly.com
                </p>
              </div>
              
              <!-- Support Info -->
              <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <h4 style="color: #0c4a6e; margin: 0 0 10px 0; font-size: 16px;">📞 Need Help?</h4>
                <p style="margin: 0; color: #0c4a6e;">
                  If you have questions about this cancellation or need assistance with a new booking, 
                  our support team is here to help.
                </p>
              </div>
              
              <!-- Call to Action -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${config.FRONTEND_URL}/cars" 
                   style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Browse Available Cars
                </a>
              </div>
              
              <p style="font-size: 16px; margin: 25px 0 0 0;">
                We hope to serve you again soon!
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">
                Thank you for choosing Fleetly Car Rental
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                © 2025 Fleetly. All rights reserved.<br>
                This email was sent to ${to} regarding reservation ${reservationId}
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Reservation Cancelled
        
        Dear ${userName},
        
        Your car reservation has been cancelled.
        
        Cancelled Booking Details:
        - Car: ${carMake} ${carModel}
        - Pickup Date: ${startDate}
        - Return Date: ${endDate}
        - Total Price: ₦${totalPrice.toLocaleString()}
        - Reservation ID: ${reservationId}
        
        If you did not request this cancellation, please contact support@fleetly.com immediately.
        
        Best regards,
        Fleetly Team
      `,
      categories: ['reservation-cancellation'],
      customArgs: {
        'reservation_id': reservationId,
        'email_type': 'cancellation'
      }
    };

    try {
      await sgMail.send(msg);
      console.log(`Cancellation email sent to ${to}`);
    } catch (error) {
      console.error('Error sending cancellation email:', error);
      throw error;
    }
  }

  /**
   * Send soft-reserve reminder email
   */
  async sendSoftReserveReminder(
    to: string,
    data: ReservationEmailData & { expiryTime: string }
  ): Promise<void> {
    const { userName, carMake, carModel, expiryTime, reservationId, totalPrice, startDate, endDate } = data;

    const msg = {
      to,
      from: {
        email: this.from,
        name: 'Fleetly Car Rental'
      },
      replyTo: this.from,
      subject: '⏰ Your Reservation is About to Expire - Fleetly',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Complete Your Reservation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header with Urgency -->
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Fleetly</h1>
              <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Car Rental Platform</p>
            </div>
            
            <!-- Urgency Banner -->
            <div style="background: #fef3c7; padding: 15px; text-align: center; border-bottom: 3px solid #f59e0b;">
              <p style="margin: 0; font-size: 18px; font-weight: 700; color: #92400e;">
                ⏰ TIME IS RUNNING OUT!
              </p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #92400e;">
                Your reservation expires at <strong>${expiryTime}</strong>
              </p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #f59e0b; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">
                Complete Your Reservation Now!
              </h2>
              
              <p style="font-size: 16px; margin: 0 0 25px 0;">
                Dear <strong>${userName || 'Valued Guest'}</strong>,
              </p>
              
              <p style="font-size: 16px; margin: 0 0 25px 0;">
                Your soft reservation is about to expire! Don't miss out on this great car:
              </p>
              
              <!-- Reservation Details with Urgency Styling -->
              <div style="background: #fff7ed; border: 2px solid #fed7aa; border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #c2410c; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">
                  🚗 Reserved Vehicle
                </h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #7c2d12;">Vehicle:</td>
                    <td style="padding: 8px 0; color: #c2410c; font-weight: 700;">${carMake} ${carModel}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #7c2d12;">Pickup Date:</td>
                    <td style="padding: 8px 0; color: #7c2d12;">${startDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #7c2d12;">Return Date:</td>
                    <td style="padding: 8px 0; color: #7c2d12;">${endDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #7c2d12;">Total Price:</td>
                    <td style="padding: 8px 0; color: #c2410c; font-weight: 700; font-size: 18px;">₦${totalPrice.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #7c2d12;">Reference:</td>
                    <td style="padding: 8px 0; font-family: monospace; color: #7c2d12;">${reservationId}</td>
                  </tr>
                </table>
              </div>
              
              <!-- What Happens Next -->
              <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <h4 style="color: #991b1b; margin: 0 0 10px 0; font-size: 16px;">⚠️ What happens if you don't complete your reservation?</h4>
                <ul style="margin: 0; padding-left: 20px; color: #991b1b;">
                  <li>Your reservation will be automatically cancelled</li>
                  <li>The car will become available to other customers</li>
                  <li>You'll need to start the booking process again</li>
                </ul>
              </div>
              
              <!-- Benefits of Completing -->
              <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <h4 style="color: #14532d; margin: 0 0 10px 0; font-size: 16px;">✅ Complete your reservation now to:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #14532d;">
                  <li>Secure your car for the dates you need</li>
                  <li>Lock in the current price</li>
                  <li>Avoid disappointment</li>
                </ul>
              </div>
              
              <!-- Call to Action - Large and Prominent -->
              <div style="text-align: center; margin: 35px 0; padding: 25px; background: #fff7ed; border-radius: 12px;">
                <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #92400e;">
                  Don't lose your reservation!
                </p>
                <a href="${config.FRONTEND_URL}/register" 
                   style="display: inline-block; background: #f59e0b; color: white; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  Complete Reservation Now
                </a>
                <p style="margin: 15px 0 0 0; font-size: 14px; color: #7c2d12;">
                  It only takes 2 minutes to create an account
                </p>
              </div>
              
              <p style="font-size: 16px; margin: 25px 0 0 0; text-align: center; font-style: italic; color: #6b7280;">
                "Act fast - great cars don't wait!"
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">
                Thank you for choosing Fleetly Car Rental
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                © 2025 Fleetly. All rights reserved.<br>
                This reminder was sent to ${to} for reservation ${reservationId}
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        TIME IS RUNNING OUT!
        
        Dear ${userName || 'Valued Guest'},
        
        Your soft reservation is about to expire at ${expiryTime}!
        
        Reserved Vehicle:
        - Car: ${carMake} ${carModel}
        - Pickup Date: ${startDate}
        - Return Date: ${endDate}
        - Total Price: ₦${totalPrice.toLocaleString()}
        - Reservation ID: ${reservationId}
        
        Don't lose your reservation! Complete it now at ${config.FRONTEND_URL}/register
        
        If you don't complete your reservation:
        - It will be automatically cancelled
        - The car will become available to others
        - You'll need to start booking again
        
        Act fast - great cars don't wait!
        
        Best regards,
        Fleetly Team
      `,
      categories: ['reservation-reminder'],
      customArgs: {
        'reservation_id': reservationId,
        'email_type': 'soft-reserve-reminder'
      }
    };

    try {
      await sgMail.send(msg);
      console.log(`Reminder email sent to ${to}`);
    } catch (error) {
      console.error('Error sending reminder email:', error);
      throw error;
    }
  }

  /**
   * Send guest override notification
   */
  async sendGuestOverrideNotification(
    to: string,
    data: ReservationEmailData
  ): Promise<void> {
    const { carMake, carModel, startDate, endDate, reservationId, totalPrice } = data;

    const msg = {
      to,
      from: {
        email: this.from,
        name: 'Fleetly Car Rental'
      },
      replyTo: this.from,
      subject: '🔄 Important Update About Your Reservation - Fleetly',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reservation Update</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Fleetly</h1>
              <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Car Rental Platform</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #4b5563; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">
                🔄 Reservation Update
              </h2>
              
              <p style="font-size: 16px; margin: 0 0 25px 0;">
                Dear Valued Guest,
              </p>
              
              <p style="font-size: 16px; margin: 0 0 25px 0;">
                We sincerely apologize, but we need to inform you about an important change to your reservation.
              </p>
              
              <!-- Apology Box -->
              <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
                <h3 style="color: #991b1b; font-size: 20px; margin: 0 0 10px 0;">
                  We're Sorry 😔
                </h3>
                <p style="margin: 0; color: #7f1d1d; font-size: 16px;">
                  Your soft reservation has been claimed by a registered member.
                  We understand this is disappointing and apologize for the inconvenience.
                </p>
              </div>
              
              <!-- Original Reservation Details -->
              <div style="background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #374151; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">
                  📋 Your Original Reservation
                </h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Vehicle:</td>
                    <td style="padding: 8px 0; color: #374151;">${carMake} ${carModel}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Dates:</td>
                    <td style="padding: 8px 0; color: #374151;">${startDate} - ${endDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Price:</td>
                    <td style="padding: 8px 0; color: #374151;">₦${totalPrice.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Reference:</td>
                    <td style="padding: 8px 0; font-family: monospace; color: #374151;">${reservationId}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Make It Right Section -->
              <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <h4 style="color: #0c4a6e; margin: 0 0 10px 0; font-size: 16px;">💙 How We Can Help</h4>
                <p style="margin: 0 0 10px 0; color: #0c4a6e;">
                  We don't want you to miss out on your trip! Here's what we can do:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #0c4a6e;">
                  <li>Help you find a similar or better vehicle</li>
                  <li>Offer priority booking on your next reservation</li>
                  <li>Provide dedicated support to ensure you get the car you need</li>
                </ul>
              </div>
              
              <!-- Special Offer -->
              <div style="background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
                <h3 style="color: #14532d; font-size: 18px; margin: 0 0 10px 0;">
                  🎁 As Our Apology
                </h3>
                <p style="margin: 0 0 15px 0; color: #166534; font-size: 16px;">
                  Create an account today and enjoy:
                </p>
                <ul style="margin: 0 0 20px 0; padding-left: 0; list-style: none; color: #166534;">
                  <li style="padding: 5px 0;">✅ Priority booking status</li>
                  <li style="padding: 5px 0;">✅ Member-only rates</li>
                  <li style="padding: 5px 0;">✅ Guaranteed reservations</li>
                </ul>
              </div>
              
              <!-- Call to Action -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="${config.FRONTEND_URL}/cars" 
                   style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 10px 10px 0;">
                  Find Another Car
                </a>
                <a href="${config.FRONTEND_URL}/register" 
                   style="display: inline-block; background: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 10px 10px 0;">
                  Create Account
                </a>
              </div>
              
              <!-- Support Contact -->
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">📞 Need Immediate Help?</h4>
                <p style="margin: 0; color: #92400e;">
                  Our customer service team is ready to assist you in finding the perfect alternative.
                  Contact us at <strong>support@fleetly.com</strong> or call our priority hotline.
                </p>
              </div>
              
              <p style="font-size: 16px; margin: 25px 0 0 0; text-align: center; color: #6b7280;">
                We truly value your interest in Fleetly and hope to serve you soon.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">
                We apologize for the inconvenience
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                © 2025 Fleetly. All rights reserved.<br>
                This notification was sent to ${to} regarding reservation ${reservationId}
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Reservation Update
        
        Dear Valued Guest,
        
        We sincerely apologize, but your soft reservation has been claimed by a registered member.
        
        Your Original Reservation:
        - Car: ${carMake} ${carModel}
        - Dates: ${startDate} - ${endDate}
        - Price: ₦${totalPrice.toLocaleString()}
        - Reference: ${reservationId}
        
        We understand this is disappointing and want to help:
        - Find you a similar or better vehicle
        - Offer priority booking on your next reservation
        - Provide dedicated support
        
        Create an account today for:
        - Priority booking status
        - Member-only rates
        - Guaranteed reservations
        
        Browse available cars at: ${config.FRONTEND_URL}/cars
        Or create an account at: ${config.FRONTEND_URL}/register
        
        Need immediate help? Contact support@fleetly.com
        
        We apologize for the inconvenience and hope to serve you soon.
        
        Best regards,
        Fleetly Team
      `,
      categories: ['reservation-override'],
      customArgs: {
        'reservation_id': reservationId,
        'email_type': 'guest-override'
      }
    };

    try {
      await sgMail.send(msg);
      console.log(`Override notification sent to ${to}`);
    } catch (error) {
      console.error('Error sending override notification:', error);
      throw error;
    }
  }

  /**
   * Send reservation modification email
   */
  async sendReservationModification(
    to: string,
    data: ReservationEmailData
  ): Promise<void> {
    const { userName, carMake, carModel, startDate, endDate, totalPrice, reservationId } = data;

    const msg = {
      to,
      from: {
        email: this.from,
        name: 'Fleetly Car Rental'
      },
      replyTo: this.from,
      subject: '📝 Your Reservation Has Been Updated - Fleetly',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reservation Modified</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Fleetly</h1>
              <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Car Rental Platform</p>
            </div>
            
            <!-- Notification Banner -->
            <div style="background: #dbeafe; padding: 15px; text-align: center; border-bottom: 2px solid #3b82f6;">
              <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1e40af;">
                ✨ Your reservation has been successfully updated
              </p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #3b82f6; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">
                📝 Reservation Modified
              </h2>
              
              <p style="font-size: 16px; margin: 0 0 25px 0;">
                Dear <strong>${userName}</strong>,
              </p>
              
              <p style="font-size: 16px; margin: 0 0 25px 0;">
                We've successfully updated your reservation. Please review the updated details below:
              </p>
              
              <!-- Updated Reservation Details -->
              <div style="background: #f0f9ff; border: 2px solid #bae6fd; border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #0369a1; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">
                  📋 Updated Booking Details
                </h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; font-weight: 600; color: #0c4a6e;">Vehicle:</td>
                    <td style="padding: 10px 0; color: #0369a1; font-weight: 600;">${carMake} ${carModel}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; font-weight: 600; color: #0c4a6e;">Pickup Date:</td>
                    <td style="padding: 10px 0; color: #0c4a6e;">
                      <span style="background: #fef3c7; padding: 3px 8px; border-radius: 4px; font-weight: 600;">
                        ${startDate}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; font-weight: 600; color: #0c4a6e;">Return Date:</td>
                    <td style="padding: 10px 0; color: #0c4a6e;">
                      <span style="background: #fef3c7; padding: 3px 8px; border-radius: 4px; font-weight: 600;">
                        ${endDate}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; font-weight: 600; color: #0c4a6e;">Total Price:</td>
                    <td style="padding: 10px 0; color: #0369a1; font-weight: 700; font-size: 20px;">
                      <span style="background: #dcfce7; padding: 5px 12px; border-radius: 6px;">
                        ₦${totalPrice.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; font-weight: 600; color: #0c4a6e;">Reference:</td>
                    <td style="padding: 10px 0; font-family: monospace; color: #0c4a6e;">${reservationId}</td>
                  </tr>
                </table>
              </div>
              
              <!-- What's Changed Notice -->
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">📌 Important Notes:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                  <li>Please review all details carefully</li>
                  <li>Save this email for your records</li>
                  <li>Contact us if any information is incorrect</li>
                </ul>
              </div>
              
              <!-- Next Steps -->
              <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <h4 style="color: #14532d; margin: 0 0 10px 0; font-size: 16px;">✅ What's Next?</h4>
                <ul style="margin: 0; padding-left: 20px; color: #14532d;">
                  <li>Your reservation is confirmed with the new details</li>
                  <li>No further action is required from you</li>
                  <li>You'll receive a reminder closer to your pickup date</li>
                </ul>
              </div>
              
              <!-- Call to Action -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${config.FRONTEND_URL}/reservations" 
                   style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View Reservation Details
                </a>
              </div>
              
              <!-- Support Section -->
              <div style="background: #f3f4f6; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
                <h4 style="color: #374151; margin: 0 0 10px 0; font-size: 16px;">
                  Have Questions About These Changes?
                </h4>
                <p style="margin: 0 0 15px 0; color: #6b7280;">
                  Our support team is ready to help you understand any modifications.
                </p>
                <p style="margin: 0; color: #374151;">
                  📧 Email: <strong>support@fleetly.com</strong><br>
                  📱 WhatsApp: <strong>+234 XXX XXXX XXX</strong>
                </p>
              </div>
              
              <p style="font-size: 16px; margin: 25px 0 0 0; text-align: center; color: #6b7280;">
                Thank you for your continued trust in Fleetly!
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">
                Your journey, our priority
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                © 2025 Fleetly. All rights reserved.<br>
                This update was sent to ${to} for reservation ${reservationId}
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Reservation Modified
        
        Dear ${userName},
        
        Your reservation has been successfully updated.
        
        Updated Booking Details:
        - Car: ${carMake} ${carModel}
        - Pickup Date: ${startDate}
        - Return Date: ${endDate}
        - Total Price: ₦${totalPrice.toLocaleString()}
        - Reservation ID: ${reservationId}
        
        Important Notes:
        - Please review all details carefully
        - Save this email for your records
        - Contact us if any information is incorrect
        
        What's Next?
        - Your reservation is confirmed with the new details
        - No further action is required
        - You'll receive a reminder before pickup
        
        View your reservation: ${config.FRONTEND_URL}/reservations
        
        Questions? Contact support@fleetly.com
        
        Best regards,
        Fleetly Team
      `,
      categories: ['reservation-modification'],
      customArgs: {
        'reservation_id': reservationId,
        'email_type': 'modification'
      }
    };

    try {
      await sgMail.send(msg);
      console.log(`Modification email sent to ${to}`);
    } catch (error) {
      console.error('Error sending modification email:', error);
      throw error;
    }
  }

  /**
   * Send return reminder email (due soon)
   */
  async sendReturnReminder(
    to: string,
    data: ReservationEmailData & { hoursRemaining: number }
  ): Promise<void> {
    const { userName, carMake, carModel, endDate, reservationId, hoursRemaining } = data;

    const msg = {
      to,
      from: {
        email: this.from,
        name: 'Fleetly Car Rental'
      },
      replyTo: this.from,
      subject: '⏰ Car Return Reminder - Due Soon',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Return Reminder</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Fleetly</h1>
              <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Car Rental Platform</p>
            </div>
            
            <!-- Reminder Banner -->
            <div style="background: #fef3c7; padding: 15px; text-align: center; border-bottom: 3px solid #f59e0b;">
              <p style="margin: 0; font-size: 18px; font-weight: 700; color: #92400e;">
                ⏰ RETURN REMINDER
              </p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #92400e;">
                ${hoursRemaining} hours remaining
              </p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #f59e0b; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">
                Time to Return Your Car!
              </h2>
              
              <p style="font-size: 16px; margin: 0 0 25px 0;">
                Dear <strong>${userName}</strong>,
              </p>
              
              <p style="font-size: 16px; margin: 0 0 25px 0;">
                This is a friendly reminder that your rental of the <strong>${carMake} ${carModel}</strong> is due to end soon.
              </p>
              
              <!-- Return Details -->
              <div style="background: #fff7ed; border: 2px solid #f59e0b; border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #92400e; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">
                  📅 Return Information
                </h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #78350f;">Vehicle:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${carMake} ${carModel}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #78350f;">Return Due:</td>
                    <td style="padding: 8px 0; color: #92400e; font-weight: 700; font-size: 16px;">${endDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #78350f;">Time Remaining:</td>
                    <td style="padding: 8px 0; color: #ea580c; font-weight: 700;">${hoursRemaining} hours</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #78350f;">Reservation ID:</td>
                    <td style="padding: 8px 0; font-family: monospace; color: #1e293b;">${reservationId}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Call to Action -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${config.FRONTEND_URL}/reservations" 
                   style="display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Mark as Returned
                </a>
              </div>
              
              <!-- Important Notes -->
              <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <h4 style="color: #991b1b; margin: 0 0 10px 0; font-size: 16px;">⚠️ Important:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #991b1b;">
                  <li>Late returns may incur additional charges</li>
                  <li>Please inspect the car before returning</li>
                  <li>Return the car with the same fuel level</li>
                  <li>Mark as returned in the app when done</li>
                </ul>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">
                Questions? Contact us at <a href="mailto:support@fleetly.com" style="color: #2563eb; text-decoration: none;">support@fleetly.com</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                © ${new Date().getFullYear()} Fleetly. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await sgMail.send(msg);
      console.log(`Return reminder email sent to ${to}`);
    } catch (error) {
      console.error('Error sending return reminder email:', error);
      // Don't throw - reminder emails are non-critical
    }
  }

  /**
   * Send overdue return notification
   */
  async sendOverdueReturnNotification(
    to: string,
    data: ReservationEmailData & { hoursOverdue: number }
  ): Promise<void> {
    const { userName, carMake, carModel, endDate, reservationId, hoursOverdue } = data;

    const msg = {
      to,
      from: {
        email: this.from,
        name: 'Fleetly Car Rental'
      },
      replyTo: this.from,
      subject: '🚨 URGENT: Car Return is OVERDUE - Fleetly',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Overdue Return</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Fleetly</h1>
              <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Car Rental Platform</p>
            </div>
            
            <!-- Urgent Banner -->
            <div style="background: #fee2e2; padding: 20px; text-align: center; border-bottom: 4px solid #dc2626;">
              <p style="margin: 0; font-size: 22px; font-weight: 700; color: #991b1b;">
                🚨 URGENT: OVERDUE RETURN
              </p>
              <p style="margin: 8px 0 0 0; font-size: 16px; color: #991b1b; font-weight: 600;">
                Your car was due ${hoursOverdue} hours ago
              </p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #dc2626; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">
                Immediate Action Required
              </h2>
              
              <p style="font-size: 16px; margin: 0 0 25px 0;">
                Dear <strong>${userName}</strong>,
              </p>
              
              <p style="font-size: 16px; margin: 0 0 25px 0; color: #991b1b; font-weight: 600;">
                Your rental of the <strong>${carMake} ${carModel}</strong> is now <strong>OVERDUE</strong>. 
                Please return the car immediately to avoid additional charges.
              </p>
              
              <!-- Overdue Details -->
              <div style="background: #fef2f2; border: 3px solid #dc2626; border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #991b1b; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">
                  ⚠️ Overdue Information
                </h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #7f1d1d;">Vehicle:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${carMake} ${carModel}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #7f1d1d;">Was Due:</td>
                    <td style="padding: 8px 0; color: #991b1b; font-weight: 700;">${endDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #7f1d1d;">Overdue By:</td>
                    <td style="padding: 8px 0; color: #dc2626; font-weight: 700; font-size: 18px;">${hoursOverdue} hours</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #7f1d1d;">Reservation ID:</td>
                    <td style="padding: 8px 0; font-family: monospace; color: #1e293b;">${reservationId}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Urgent CTA -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${config.FRONTEND_URL}/reservations" 
                   style="display: inline-block; background: #dc2626; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
                  Return Car Now
                </a>
              </div>
              
              <!-- Consequences Notice -->
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">⚠️ Late Return Policy:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                  <li>Additional daily charges apply for overdue returns</li>
                  <li>Extended delays may affect your future bookings</li>
                  <li>Please contact us if you need an extension</li>
                </ul>
              </div>
              
              <p style="font-size: 16px; margin: 25px 0 0 0;">
                If you've already returned the car, please mark it as returned in your dashboard.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">
                Need help? Contact us at <a href="mailto:support@fleetly.com" style="color: #2563eb; text-decoration: none;">support@fleetly.com</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                © ${new Date().getFullYear()} Fleetly. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await sgMail.send(msg);
      console.log(`Return reminder email sent to ${to}`);
    } catch (error) {
      console.error('Error sending return reminder email:', error);
      // Don't throw - reminder emails are non-critical
    }
  }

  /**
   * Send OTP verification email
   */
  async sendOTPEmail(
    to: string,
    code: string,
    type: 'registration' | 'forgot-password'
  ): Promise<void> {
    const subject = type === 'registration' 
      ? '🔐 Verify Your Email - Fleetly'
      : '🔑 Reset Your Password - Fleetly';

    const title = type === 'registration'
      ? 'Verify Your Email Address'
      : 'Reset Your Password';

    const description = type === 'registration'
      ? 'Welcome to Fleetly! Please verify your email address to complete your registration.'
      : 'You requested to reset your password. Use the code below to create a new password.';

    const msg = {
      to,
      from: {
        email: this.from,
        name: 'Fleetly Car Rental'
      },
      replyTo: this.from,
      subject,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 700;">🚗 Fleetly</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Your Trusted Car Rental Partner</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 50px 40px;">
              <h2 style="color: #1e293b; font-size: 26px; margin: 0 0 15px 0; font-weight: 600;">
                ${title}
              </h2>
              
              <p style="font-size: 16px; margin: 0 0 30px 0; color: #64748b;">
                ${description}
              </p>
              
              <!-- OTP Code Box -->
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #2563eb; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #475569; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">
                  Your Verification Code
                </p>
                <div style="font-size: 48px; font-weight: 700; color: #2563eb; letter-spacing: 8px; font-family: 'Courier New', monospace; margin: 10px 0;">
                  ${code}
                </div>
                <p style="margin: 15px 0 0 0; font-size: 13px; color: #64748b;">
                  Valid for 10 minutes
                </p>
              </div>
              
              <!-- Security Notice -->
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <h4 style="color: #991b1b; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
                  🔒 Security Notice
                </h4>
                <ul style="margin: 0; padding-left: 20px; color: #7f1d1d; font-size: 14px;">
                  <li>Never share this code with anyone</li>
                  <li>Fleetly staff will never ask for this code</li>
                  <li>If you didn't request this code, please ignore this email</li>
                </ul>
              </div>
              
              <p style="font-size: 15px; margin: 30px 0 0 0; color: #64748b;">
                ${type === 'registration' 
                  ? 'After verification, you\'ll be able to browse and rent cars immediately.' 
                  : 'After resetting your password, you can log in with your new credentials.'}
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">
                Need help? Contact us at 
                <a href="mailto:support@fleetly.com" style="color: #2563eb; text-decoration: none; font-weight: 600;">support@fleetly.com</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                © ${new Date().getFullYear()} Fleetly. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ OTP email sent to ${to} for ${type}`);
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw new Error('Failed to send verification email. Please try again.');
    }
  }
}

export default new EmailService();

