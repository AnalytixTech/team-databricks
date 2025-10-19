import { UserRole } from './index';
import { Types } from 'mongoose';

declare global {
  namespace Express {
    interface User {
      _id: Types.ObjectId;
      id: string;
      email: string;
      role: UserRole;
      isNewBusinessOwner?: boolean;
    }
  }
}

export {};

