import { createFileRoute } from '@tanstack/react-router';
import Cars from '@/pages/Cars.tsx';

export const Route = createFileRoute('/cars')({
  component: Cars,
});

