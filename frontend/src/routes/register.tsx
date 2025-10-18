import { createFileRoute, redirect } from '@tanstack/react-router';
import Register from '@/pages/Register.tsx';
import { UserRole } from '@/types';

export const Route = createFileRoute('/register')({
  beforeLoad: ({ context }) => {
    const { isAuthenticated, user } = context as any;
    
    if (isAuthenticated) {
      // Business owners go to business dashboard
      if (user?.role === UserRole.BUSINESS_OWNER) {
        throw redirect({ to: '/dashboard' });
      }
      // Regular users go to user dashboard
      throw redirect({ to: '/user-dashboard' });
    }
  },
  component: Register,
});

