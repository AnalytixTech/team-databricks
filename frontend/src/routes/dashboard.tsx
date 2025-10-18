import { createFileRoute, redirect } from '@tanstack/react-router';
import Dashboard from '@/pages/Dashboard';
import { UserRole } from '@/types';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ context }) => {
    const { isAuthenticated, user } = context as any;
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
    if (user?.role !== UserRole.BUSINESS_OWNER) {
      throw redirect({ to: '/' });
    }
  },
  component: Dashboard,
});

