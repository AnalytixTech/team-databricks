import { createFileRoute, redirect } from '@tanstack/react-router';
import UserDashboard from '@/pages/UserDashboard';
import { UserRole } from '@/types';

export const Route = createFileRoute('/user-dashboard')({
  beforeLoad: ({ context }) => {
    const { isAuthenticated, user } = context as any;
    
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
    
    // Redirect business owners to their dashboard
    if (user?.role === UserRole.BUSINESS_OWNER) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: UserDashboard,
});
