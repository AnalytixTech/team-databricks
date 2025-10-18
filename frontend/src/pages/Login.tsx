import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to onboarding with login modal
    navigate({ to: '/', search: { modal: 'login' }, replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600"></div>
        <p className="mt-4 text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
}
