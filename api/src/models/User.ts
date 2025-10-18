import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, UserRole } from '../types';

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    profile: {
      businessName: {
        type: String,
        required: function(this: any) {
          return this.role === UserRole.BUSINESS_OWNER;
        },
      },
      paystackSubaccountCode: {
        type: String,
      },
      bankDetails: {
        bankCode: String,
        accountNumber: String,
        accountName: String,
      },
      driverLicense: {
        number: String,
        expiryDate: Date,
        state: String,
      },
      savedPaymentMethods: [
        {
          type: {
            type: String,
            default: 'card',
          },
          last4: String,
          expiryMonth: Number,
          expiryYear: Number,
          authorization_code: String,
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON response
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model<IUser>('User', UserSchema);

