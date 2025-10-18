import { createFileRoute } from '@tanstack/react-router';
import Terms from '@/pages/Terms.tsx';

export const Route = createFileRoute('/terms')({
  component: Terms,
});
