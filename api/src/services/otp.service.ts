import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import OTP, { OTPType } from '../models/OTP';
import emailService from './email.service';
import { BadRequestError, UnauthorizedError } from '../utils/errors';

class OTPService {
  /**
   * Generate random 6-digit OTP code
   */
  private generateOTPCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Hash OTP code for storage
   */
  private async hashCode(code: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(code, salt);
  }

  /**
   * Compare OTP code
   */
  private async compareCode(code: string, hashedCode: string): Promise<boolean> {
    return await bcrypt.compare(code, hashedCode);
  }

  /**
   * Send OTP to user's email
   */
  async sendOTP(email: string, type: OTPType): Promise<void> {
    try {
      // Check for recent OTP requests (rate limiting)
      const recentOTP = await OTP.findOne({
        email: email.toLowerCase(),
        type,
        createdAt: { $gte: new Date(Date.now() - 60 * 1000) }, // Last 60 seconds
      });

      if (recentOTP) {
        throw new BadRequestError('Please wait 60 seconds before requesting a new OTP');
      }

      // Delete any existing OTPs for this email and type
      await OTP.deleteMany({
        email: email.toLowerCase(),
        type,
      });

      // Generate OTP code
      const code = this.generateOTPCode();
      const hashedCode = await this.hashCode(code);

      // Create OTP record
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await OTP.create({
        email: email.toLowerCase(),
        code: hashedCode,
        type,
        expiresAt,
        attempts: 0,
      });

      // Send OTP email
      await emailService.sendOTPEmail(email, code, type);

      console.log(`📧 OTP sent to ${email} for ${type}`);
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(email: string, code: string, type: OTPType): Promise<boolean> {
    try {
      // Find OTP record with code field
      const otpRecord = await OTP.findOne({
        email: email.toLowerCase(),
        type,
      }).select('+code');

      if (!otpRecord) {
        throw new BadRequestError('Invalid or expired OTP');
      }

      // Check if expired
      if (new Date() > otpRecord.expiresAt) {
        await OTP.deleteOne({ _id: otpRecord._id });
        throw new BadRequestError('OTP has expired. Please request a new one.');
      }

      // Check attempts
      if (otpRecord.attempts >= 3) {
        await OTP.deleteOne({ _id: otpRecord._id });
        throw new BadRequestError('Maximum verification attempts exceeded. Please request a new OTP.');
      }

      // Verify code
      const isValid = await this.compareCode(code, otpRecord.code);

      if (!isValid) {
        // Increment attempts
        otpRecord.attempts += 1;
        await otpRecord.save();

        const attemptsLeft = 3 - otpRecord.attempts;
        throw new UnauthorizedError(
          `Invalid OTP code. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`
        );
      }

      // OTP verified successfully - delete it
      await OTP.deleteOne({ _id: otpRecord._id });

      console.log(`✅ OTP verified successfully for ${email}`);
      return true;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  /**
   * Resend OTP with cooldown
   */
  async resendOTP(email: string, type: OTPType): Promise<void> {
    try {
      // Check for existing OTP
      const existingOTP = await OTP.findOne({
        email: email.toLowerCase(),
        type,
      });

      if (existingOTP && existingOTP.lastResendAt) {
        const timeSinceLastResend = Date.now() - existingOTP.lastResendAt.getTime();
        if (timeSinceLastResend < 60 * 1000) {
          const waitTime = Math.ceil((60 * 1000 - timeSinceLastResend) / 1000);
          throw new BadRequestError(`Please wait ${waitTime} seconds before requesting a new OTP`);
        }
      }

      // Send new OTP
      await this.sendOTP(email, type);

      // Update lastResendAt
      await OTP.updateOne(
        { email: email.toLowerCase(), type },
        { $set: { lastResendAt: new Date() } }
      );
    } catch (error) {
      console.error('Error resending OTP:', error);
      throw error;
    }
  }

  /**
   * Check if OTP exists and is valid
   */
  async hasValidOTP(email: string, type: OTPType): Promise<boolean> {
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      type,
      expiresAt: { $gt: new Date() },
    });

    return !!otpRecord;
  }
}

export default new OTPService();

