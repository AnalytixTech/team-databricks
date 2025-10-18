import { useState, useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { Loader } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { UserRole } from '@/types';
import BusinessNameModal from '@/components/auth/BusinessNameModal';

export default function AuthCallback() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { 
    token?: string; 
    refreshToken?: string;
    needsBusinessName?: string;
  };
  const { setUser, setToken } = useAuthStore();
  const [showBusinessNameModal, setShowBusinessNameModal] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      if (search.token && search.refreshToken) {
        try {
          // Store tokens
          localStorage.setItem('token', search.token);
          localStorage.setItem('refreshToken', search.refreshToken);
          setToken(search.token);

          // Fetch user data
          const user = await authService.getCurrentUser();
          setUser(user);
          setUserRole(user.role);

          // Check if business owner needs to provide business name
          if (search.needsBusinessName === 'true' && user.role === UserRole.BUSINESS_OWNER) {
            setShowBusinessNameModal(true);
          } else {
            toast.success('Successfully logged in with Google! 🎉');
            
            // Route based on user role
            const redirectPath = user.role === UserRole.BUSINESS_OWNER ? '/dashboard' : '/cars';
            
            // Small delay then navigate
            setTimeout(() => {
              navigate({ to: redirectPath });
            }, 1000);
          }
        } catch (error) {
          console.error('Auth callback error:', error);
          toast.error('Authentication failed');
          navigate({ to: '/login' });
        }
      } else {
        toast.error('Invalid authentication response');
        navigate({ to: '/login' });
      }
    };

    handleCallback();
  }, [search.token, search.refreshToken, search.needsBusinessName, navigate, setUser, setToken]);

  const handleBusinessNameComplete = async () => {
    setShowBusinessNameModal(false);
    
    // Refresh user data to get updated business name
    try {
      const user = await authService.getCurrentUser();
      setUser(user);
      
      toast.success('Welcome to Fleetly! Your account is now complete. 🎉');
      
      // Navigate to dashboard
      setTimeout(() => {
        navigate({ to: '/dashboard' });
      }, 1000);
    } catch (error) {
      console.error('Error refreshing user data:', error);
      navigate({ to: '/dashboard' });
    }
  };

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="mx-auto h-12 w-12 animate-spin text-primary-600" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            {showBusinessNameModal ? 'Setting up your account...' : 'Completing Google Sign In...'}
          </h2>
          <p className="mt-2 text-gray-600">Please wait</p>
        </div>
      </div>

      <BusinessNameModal
        isOpen={showBusinessNameModal}
        onComplete={handleBusinessNameComplete}
      />
    </>
  );
}
