import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import OTPVerificationModal from './OTPVerificationModal';
import { UserRole } from '@/types';
import { authService } from '@/services/auth.service';

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  role: UserRole;
  businessName?: string;
}

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  defaultRole?: UserRole;
}

export default function RegisterModal({
  isOpen,
  onClose,
  onSwitchToLogin,
  defaultRole = UserRole.USER,
}: RegisterModalProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegisterForm | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    defaultValues: {
      role: defaultRole,
    },
  });

  // Update role when defaultRole changes
  useEffect(() => {
    setValue('role', defaultRole);
  }, [defaultRole, setValue]);

  const selectedRole = watch('role');
  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      // Send OTP
      await authService.sendOTP(data.email, 'registration');
      
      // Store registration data for later
      setRegistrationData(data);
      
      // Show OTP modal
      setShowOTPModal(true);
      
      toast.success('Verification code sent to your email!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerify = async (code: string) => {
    if (!registrationData) return;

    const { confirmPassword, ...regData } = registrationData;
    
    await authService.verifyOTPAndRegister(
      regData.email,
      code,
      regData.password,
      regData.role,
      regData.phone,
      regData.businessName
    );

    toast.success('Registration successful! Welcome to Fleetly! 🎉');
    
    setShowOTPModal(false);
    onClose();
    reset();
    
    // Navigate based on role
    const redirectPath = regData.role === UserRole.BUSINESS_OWNER ? '/dashboard' : '/cars';
    navigate({ to: redirectPath });
  };

  const handleOTPResend = async () => {
    if (!registrationData) return;
    await authService.resendOTP(registrationData.email, 'registration');
  };

  const handleCloseOTPModal = () => {
    setShowOTPModal(false);
    // Don't close main modal - user can edit their info
  };

  const handleMainClose = () => {
    setShowOTPModal(false);
    setRegistrationData(null);
    reset();
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen && !showOTPModal} onClose={handleMainClose} title="">
        <div className="mb-6 flex justify-center">
          <img src="/Frame 2147226802.svg" alt="Fleetly" className="h-10" />
        </div>
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">Create Your Account</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
          />

          {/* Password */}
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
          />

          {/* Confirm Password */}
          <Input
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) =>
                value === password || 'Passwords do not match',
            })}
          />

          {/* Phone */}
          <Input
            label="Phone Number"
            type="tel"
            autoComplete="tel"
            error={errors.phone?.message}
            {...register('phone', {
              required: 'Phone number is required',
              pattern: {
                value: /^\+?[1-9]\d{1,14}$/, // E.164 format
                message: 'Invalid phone number format',
              },
            })}
          />

          {/* Role Selection */}
          <Select
            label="I want to..."
            error={errors.role?.message}
            {...register('role', { required: 'Please select your role' })}
          >
            <option value={UserRole.USER}>Rent cars</option>
            <option value={UserRole.BUSINESS_OWNER}>List my cars for rental</option>
          </Select>

          {/* Business Name (if business owner) */}
          {selectedRole === UserRole.BUSINESS_OWNER && (
            <Input
              label="Business Name"
              error={errors.businessName?.message}
              {...register('businessName', {
                required: 'Business name is required for business owners',
              })}
            />
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Sending Code...' : 'Continue'}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google OAuth */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              const role = selectedRole === UserRole.BUSINESS_OWNER ? 'business_owner' : 'regular_user';
              window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google?role=${role}`;
            }}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign up with Google as {selectedRole === UserRole.BUSINESS_OWNER ? 'Business Owner' : 'User'}
          </Button>

          {/* Continue as Guest */}
          <div className="border-t border-gray-200 pt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                handleMainClose();
                navigate({ to: '/cars' });
              }}
            >
              Continue as Guest
            </Button>
            <p className="mt-2 text-center text-xs text-gray-500">
              Browse cars without signing up. You'll need an account to reserve your bookings.
            </p>
          </div>

          {/* Switch to Login */}
          <div className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in
            </button>
          </div>
        </form>
      </Modal>

      {/* OTP Verification Modal */}
      {registrationData && (
        <OTPVerificationModal
          isOpen={showOTPModal}
          onClose={handleCloseOTPModal}
          email={registrationData.email}
          type="registration"
          onVerify={handleOTPVerify}
          onResend={handleOTPResend}
        />
      )}
    </>
  );
}

