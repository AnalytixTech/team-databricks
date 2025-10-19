import { createFileRoute, redirect } from '@tanstack/react-router';
import Onboarding from '@/pages/Onboarding';
import { UserRole } from '@/types';

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    const { isAuthenticated, user } = context as any;
    
    // Redirect authenticated users to their appropriate dashboard
    if (isAuthenticated && user) {
      if (user.role === UserRole.BUSINESS_OWNER) {
        throw redirect({ to: '/dashboard' });
      } else {
        throw redirect({ to: '/user-dashboard' });
      }
    }
  },
  component: Onboarding,
});

