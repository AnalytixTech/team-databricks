import { useState, useEffect } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import Modal from '@/components/ui/Modal.tsx';
import Button from '@/components/ui/Button.tsx';
import OTPInput from './OTPInput.tsx';

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  type: 'registration' | 'forgot-password';
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
}

export default function OTPVerificationModal({
  isOpen,
  onClose,
  email,
  type,
  onVerify,
  onResend,
}: OTPVerificationModalProps) {
  const [otp, setOTP] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setOTP('');
      setError('');
      setResendCooldown(60); // Start with 60 second cooldown
    }
  }, [isOpen]);

  // Auto-verify when OTP is complete
  useEffect(() => {
    if (otp.length === 6 && !isVerifying) {
      handleVerify();
    }
  }, [otp]);

  const handleVerify = async () => {
    try {
      setError('');
      setIsVerifying(true);
      await onVerify(otp);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Invalid verification code');
      setOTP(''); // Clear OTP on error
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      setError('');
      setIsResending(true);
      await onResend();
      setResendCooldown(60); // Reset cooldown
      setOTP(''); // Clear current OTP
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  const title = type === 'registration' 
    ? 'Verify Your Email' 
    : 'Reset Password Verification';

  const description = type === 'registration'
    ? `We've sent a 6-digit code to ${email}. Enter it below to verify your account.`
    : `We've sent a 6-digit code to ${email}. Enter it below to reset your password.`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="mb-6 flex justify-center">
        <img src="/Frame 2147226802.svg" alt="Fleetly" className="h-10" />
      </div>
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">{title}</h2>
      <div className="space-y-6">
        {/* Email confirmation */}
        <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">Code sent to:</p>
            <p className="truncate text-sm text-gray-600">{email}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-center text-sm text-gray-600">{description}</p>

        {/* OTP Input */}
        <div className="py-4">
          <OTPInput
            value={otp}
            onChange={setOTP}
            disabled={isVerifying}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-center">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isVerifying && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600"></div>
              Verifying code...
            </div>
          </div>
        )}

        {/* Resend Section */}
        <div className="border-t border-gray-200 pt-6 text-center">
          <p className="text-sm text-gray-600">
            Didn't receive the code?{' '}
            {resendCooldown > 0 ? (
              <span className="font-medium text-gray-400">
                Resend in {resendCooldown}s
              </span>
            ) : (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="font-medium text-primary-600 hover:text-primary-500 disabled:opacity-50"
              >
                {isResending ? (
                  <span className="inline-flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Sending...
                  </span>
                ) : (
                  'Resend Code'
                )}
              </button>
            )}
          </p>
        </div>

        {/* Manual Verify Button (backup) */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            disabled={otp.length !== 6 || isVerifying}
            className="flex-1"
          >
            {isVerifying ? 'Verifying...' : 'Verify Code'}
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-center text-xs text-gray-500">
          Code expires in 10 minutes. Check your spam folder if you don't see it.
        </p>
      </div>
    </Modal>
  );
}

