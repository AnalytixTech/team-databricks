import { useEffect, useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Loader, ArrowRight, Receipt } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { paymentService } from '@/services/payment.service';

export default function PaymentVerify() {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const reference = params.reference;
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    if (reference) {
      verifyPayment(reference as string);
    } else {
      setStatus('error');
      setMessage('No payment reference found');
    }
  }, [reference]);

  // Auto-redirect countdown after successful payment
  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (status === 'success' && countdown === 0) {
      toast.success('Taking you to your reservations...');
      navigate({ to: '/reservations' });
    }
  }, [status, countdown, navigate]);

  const verifyPayment = async (reference: string) => {
    try {
      console.log('🔍 Verifying payment:', reference);
      const response = await paymentService.verifyPayment(reference);
      console.log('✅ Payment verified:', response);
      setPaymentDetails(response);
      setStatus('success');
      setMessage('Payment verified successfully! Your reservation is confirmed.');
      toast.success('Payment successful! 🎉');
    } catch (error: any) {
      console.error('❌ Payment verification failed:', error);
      console.error('Error details:', error.response?.data);
      setStatus('error');
      setMessage(error.response?.data?.message || 'Payment verification failed');
      toast.error('Payment verification failed');
    }
  };

  return (
    <Layout>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            {status === 'loading' && (
              <>
                <Loader className="mx-auto h-16 w-16 animate-spin text-primary-600" />
                <h2 className="mt-4 text-2xl font-bold text-gray-900">
                  Verifying Payment
                </h2>
                <p className="mt-2 text-gray-600">
                  Please wait while we verify your payment...
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="relative">
                  <CheckCircle className="mx-auto h-20 w-20 text-green-600 animate-bounce" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-24 w-24 rounded-full bg-green-100 opacity-50 animate-ping"></div>
                  </div>
                </div>
                <h2 className="mt-6 text-2xl font-bold text-gray-900">
                  Payment Successful! 🎉
                </h2>
                <p className="mt-2 text-gray-600">{message}</p>
                
                <div className="mt-4 rounded-lg bg-green-50 border-2 border-green-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Receipt className="h-5 w-5 text-green-700" />
                    <h3 className="font-semibold text-green-900">Payment Details</h3>
                  </div>
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-sm text-green-800">Reference:</span>
                      <span className="text-sm font-mono font-semibold text-green-900">{reference}</span>
                    </div>
                    {paymentDetails?.amount && (
                      <div className="flex justify-between">
                        <span className="text-sm text-green-800">Amount Paid:</span>
                        <span className="text-sm font-semibold text-green-900">
                          ₦{(paymentDetails.amount / 100).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {paymentDetails?.status && (
                      <div className="flex justify-between">
                        <span className="text-sm text-green-800">Status:</span>
                        <span className="text-sm font-semibold text-green-900 uppercase">
                          {paymentDetails.status}
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-green-200">
                      <p className="text-xs text-green-700">
                        ✓ Your reservation has been updated
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-900">
                      Returning to your reservations...
                    </p>
                    <span className="text-2xl font-bold text-blue-600">{countdown}s</span>
                  </div>
                  <div className="relative h-3 w-full bg-blue-200 rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000 ease-linear"
                      style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                    >
                      <div className="absolute inset-0 bg-blue-400 animate-pulse opacity-50"></div>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-center text-blue-700">
                    You'll be automatically redirected in {countdown} second{countdown !== 1 ? 's' : ''}
                  </p>
                </div>

                <Button
                  className="mt-6 w-full"
                  onClick={() => navigate({ to: '/reservations' })}
                >
                  View My Reservations Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="mx-auto h-16 w-16 text-red-600" />
                <h2 className="mt-4 text-2xl font-bold text-gray-900">
                  Payment Failed
                </h2>
                <p className="mt-2 text-gray-600">{message}</p>
                <div className="mt-6 flex gap-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate({ to: '/reservations' })}
                  >
                    View Reservations
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => navigate({ to: '/cars' })}
                  >
                    Browse Cars
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

