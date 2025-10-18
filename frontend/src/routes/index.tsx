import { createFileRoute } from '@tanstack/react-router';
import Onboarding from '@/pages/Onboarding.tsx';

export const Route = createFileRoute('/')({
  component: Onboarding,
});

