import { createFileRoute, redirect } from '@tanstack/react-router';
import Profile from '@/pages/Profile';

export const Route = createFileRoute('/profile')({
  beforeLoad: ({ context }) => {
    if (!(context as any).isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: Profile,
});

