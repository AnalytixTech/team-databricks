import { createFileRoute } from '@tanstack/react-router';
import Privacy from '@/pages/Privacy.tsx';

export const Route = createFileRoute('/privacy')({
  component: Privacy,
});
