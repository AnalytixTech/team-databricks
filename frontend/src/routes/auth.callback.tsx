import { createFileRoute } from '@tanstack/react-router';
import AuthCallback from '@/pages/AuthCallback';

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: search.token as string,
      refreshToken: search.refreshToken as string,
    };
  },
});
