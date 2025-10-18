import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import OTPVerificationModal from './OTPVerificationModal';
import { authService } from '@/services/auth.service';

interface ForgotPasswordForm {
  email: string;
}

interface ResetPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  onBackToLogin,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<'email' | 'otp' | 'newPassword'>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOTPCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    reset: resetEmail,
    formState: { errors: emailErrors },
  } = useForm<ForgotPasswordForm>();

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    watch,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<ResetPasswordForm>();

  const newPassword = watch('newPassword');

  const handleSendOTP = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setEmail(data.email);
      setStep('otp');
      toast.success('Password reset code sent to your email!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (code: string) => {
    setOTPCode(code);
    setStep('newPassword');
  };

  const handleResendOTP = async () => {
    await authService.resendOTP(email, 'forgot-password');
  };

  const handleResetPassword = async (data: ResetPasswordForm) => {
    setIsLoading(true);
    try {
      await authService.resetPassword(email, otpCode, data.newPassword);
      toast.success('Password reset successfully! You can now log in.');
      handleMainClose();
      onBackToLogin();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMainClose = () => {
    setStep('email');
    setEmail('');
    setOTPCode('');
    resetEmail();
    resetPassword();
    onClose();
  };

  return (
    <>
      {/* Email Input Step */}
      <Modal
        isOpen={isOpen && step === 'email'}
        onClose={handleMainClose}
        title=""
      >
        <div className="mb-6 flex justify-center">
          <img src="/Frame 2147226802.svg" alt="Fleetly" className="h-10" />
        </div>
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">Reset Your Password</h2>
        <form onSubmit={handleSubmitEmail(handleSendOTP)} className="space-y-4">
          <p className="text-sm text-gray-600">
            Enter your email address and we'll send you a verification code to reset your password.
          </p>

          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="your@email.com"
            error={emailErrors.email?.message}
            {...registerEmail('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onBackToLogin}
              className="flex-1"
            >
              Back to Login
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Sending...' : 'Send Code'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* OTP Verification Step */}
      {step === 'otp' && (
        <OTPVerificationModal
          isOpen={isOpen}
          onClose={handleMainClose}
          email={email}
          type="forgot-password"
          onVerify={handleVerifyOTP}
          onResend={handleResendOTP}
        />
      )}

      {/* New Password Step */}
      <Modal
        isOpen={isOpen && step === 'newPassword'}
        onClose={handleMainClose}
        title=""
      >
        <div className="mb-6 flex justify-center">
          <img src="/Frame 2147226802.svg" alt="Fleetly" className="h-10" />
        </div>
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">Create New Password</h2>
        <form onSubmit={handleSubmitPassword(handleResetPassword)} className="space-y-4">
          <p className="text-sm text-gray-600">
            Enter your new password. Make sure it's at least 6 characters long.
          </p>

          <Input
            label="New Password"
            type="password"
            autoComplete="new-password"
            error={passwordErrors.newPassword?.message}
            {...registerPassword('newPassword', {
              required: 'New password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
          />

          <Input
            label="Confirm New Password"
            type="password"
            autoComplete="new-password"
            error={passwordErrors.confirmPassword?.message}
            {...registerPassword('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) =>
                value === newPassword || 'Passwords do not match',
            })}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleMainClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

