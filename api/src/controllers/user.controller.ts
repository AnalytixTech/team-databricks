import { Response, NextFunction } from 'express';
import User from '../models/User';
import { AuthRequest, UserRole, IPaymentMethod } from "../types";
import { NotFoundError, BadRequestError } from "../utils/errors";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "../utils/constants";
import { successResponse } from "../utils/helpers";
import paymentService from "../services/payment.service";

/**
 * Setup payout account (create Paystack subaccount)
 */
export const setupPayoutAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new BadRequestError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { bankCode, accountNumber } = req.body;

    // Find user
    const user = await User.findById((req.user as any).id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Verify account number
    const accountDetails = await paymentService.verifyAccountNumber(
      accountNumber,
      bankCode
    );

    // Create Paystack subaccount with 6% commission
    const subaccount = await paymentService.createSubaccount({
      businessName: user.profile.businessName || user.email,
      bankCode,
      accountNumber,
      percentageCharge: 6, // Platform takes 6%
    });

    // Update user profile
    user.profile.paystackSubaccountCode = subaccount.subaccount_code;
    user.profile.bankDetails = {
      bankCode,
      accountNumber,
      accountName: accountDetails.account_name,
    };

    await user.save();

    res.status(HTTP_STATUS.OK).json(
      successResponse(
        {
          subaccount_code: subaccount.subaccount_code,
          account_name: accountDetails.account_name,
        },
        "Payout account setup successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get list of banks
 */
export const getBanks = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const banks = await paymentService.listBanks();
    res.status(HTTP_STATUS.OK).json(successResponse(banks));
  } catch (error) {
    next(error);
  }
};

/**
 * Get user profile
 */
export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new BadRequestError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const user = await User.findById((req.user as any).id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    res.status(HTTP_STATUS.OK).json(successResponse(user));
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new BadRequestError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { phone, businessName, driverLicense } = req.body;

    const user = await User.findById((req.user as any).id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (phone) user.phone = phone;
    if (businessName && user.role === UserRole.BUSINESS_OWNER) {
      user.profile.businessName = businessName;
    }

    // Update driver's license
    if (driverLicense) {
      // Validate expiry date
      const licenseExpiry = new Date(driverLicense.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (licenseExpiry < today) {
        throw new BadRequestError(
          "Driver license has expired. Please provide a valid license."
        );
      }

      user.profile.driverLicense = {
        number: driverLicense.number,
        expiryDate: driverLicense.expiryDate,
        state: driverLicense.state || "",
      };
    }

    await user.save();

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(user, "Profile updated successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 */
export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new BadRequestError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById((req.user as any).id).select("+password");
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new BadRequestError("Current password is incorrect");
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(null, "Password changed successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * Add payment method
 */
export const addPaymentMethod = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new BadRequestError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { type, authorization_code, last4, expiryMonth, expiryYear } =
      req.body;

    const user = await User.findById((req.user as any).id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Add payment method to user's saved payment methods
    const paymentMethod: IPaymentMethod = {
      type: type || "card",
      authorization_code,
      last4,
      expiryMonth,
      expiryYear,
    };

    user.profile.savedPaymentMethods.push(paymentMethod);
    await user.save();

    res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse(user, SUCCESS_MESSAGES.PAYMENT_METHOD_ADDED));
  } catch (error) {
    next(error);
  }
};

/**
 * Remove payment method
 */
export const removePaymentMethod = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new BadRequestError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { id } = req.params;

    const user = await User.findById((req.user as any).id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Remove payment method
    user.profile.savedPaymentMethods = user.profile.savedPaymentMethods.filter(
      (method) => method._id?.toString() !== id
    );

    await user.save();

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse(null, SUCCESS_MESSAGES.PAYMENT_METHOD_REMOVED));
  } catch (error) {
    next(error);
  }
};
