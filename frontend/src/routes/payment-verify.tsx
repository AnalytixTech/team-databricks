import { createFileRoute, redirect } from '@tanstack/react-router';
import PaymentVerify from '@/pages/PaymentVerify.tsx';

export const Route = createFileRoute('/payment-verify')({
  beforeLoad: ({ context }) => {
    if (!(context as any).isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: PaymentVerify,
});

