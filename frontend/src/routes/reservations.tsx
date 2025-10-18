import { createFileRoute, redirect } from '@tanstack/react-router';
import MyReservations from '@/pages/MyReservations.tsx';

export const Route = createFileRoute('/reservations')({
  beforeLoad: ({ context }) => {
    if (!(context as any).isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: MyReservations,
});

