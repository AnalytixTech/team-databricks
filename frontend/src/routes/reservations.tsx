import { createFileRoute, redirect } from '@tanstack/react-router';
import MyReservations from '@/pages/MyReservations';

export const Route = createFileRoute('/reservations')({
  beforeLoad: ({ context }) => {
    if (!(context as any).isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: MyReservations,
});

