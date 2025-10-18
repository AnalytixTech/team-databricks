import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Calendar, Clock, DollarSign, X, CheckCircle, Star, MessageCircle, MapPin, Package, PackageCheck } from 'lucide-react';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import Rating from '@/components/ui/Rating';
import ChatWindow from '@/components/ui/ChatWindow';
import Map from '@/components/ui/Map';
import LocationTracker from '@/components/ui/LocationTracker';
import CountdownTimer from '@/components/ui/CountdownTimer';
import { reservationService } from '@/services/reservation.service';
import { paymentService } from '@/services/payment.service';
import { IReservation, ICar, ReservationStatus, PaymentType, PaymentStatus } from '@/types';
import { formatCurrency, calculateDays } from '@/lib/utils';

export default function MyReservations() {
  const [reservations, setReservations] = useState<IReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<IReservation | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingReview, setRatingReview] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState<string | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatReservationId, setChatReservationId] = useState<string | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedReservationForDeposit, setSelectedReservationForDeposit] = useState<IReservation | null>(null);
  const [depositPercentage, setDepositPercentage] = useState(30);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showCarLocationModal, setShowCarLocationModal] = useState(false);
  const [selectedReservationForPickup, setSelectedReservationForPickup] = useState<IReservation | null>(null);
  const [selectedReservationForReturn, setSelectedReservationForReturn] = useState<IReservation | null>(null);
  const [selectedCarForLocation, setSelectedCarForLocation] = useState<ICar | null>(null);

  useEffect(() => {
    loadReservations();
    
    // Auto-refresh when returning from payment
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadReservations();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadReservations = async () => {
    try {
      setIsLoading(true);
      const data = await reservationService.getMyReservations();
      setReservations(data);
    } catch (error) {
      toast.error('Failed to load reservations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelReservation = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    try {
      await reservationService.cancelReservation(id);
      toast.success('Reservation cancelled successfully');
      loadReservations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel reservation');
    }
  };

  const handleOpenRatingModal = (reservation: IReservation) => {
    setSelectedReservation(reservation);
    setRatingStars(5);
    setRatingReview('');
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (!selectedReservation) return;

    try {
      await reservationService.rateReservation(selectedReservation._id, {
        stars: ratingStars,
        review: ratingReview || undefined,
      });
      toast.success('Rating submitted successfully!');
      setShowRatingModal(false);
      setSelectedReservation(null);
      loadReservations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    }
  };

  const handlePickup = async (location?: { latitude: number; longitude: number; address?: string }) => {
    if (!selectedReservationForPickup) return;

    try {
      await reservationService.markAsPickedUp(selectedReservationForPickup._id, location);
      toast.success('Car marked as picked up successfully!');
      setShowPickupModal(false);
      setSelectedReservationForPickup(null);
      loadReservations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to mark as picked up');
    }
  };

  const handleReturn = async (location?: { latitude: number; longitude: number; address?: string }) => {
    if (!selectedReservationForReturn) return;

    try {
      await reservationService.markAsReturned(selectedReservationForReturn._id, location);
      toast.success('Car marked as returned successfully!');
      setShowReturnModal(false);
      setSelectedReservationForReturn(null);
      loadReservations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to mark as returned');
    }
  };

  const handleViewCarLocation = (car: ICar) => {
    setSelectedCarForLocation(car);
    setShowCarLocationModal(true);
  };

  const handleOpenDepositModal = (reservation: IReservation) => {
    setSelectedReservationForDeposit(reservation);
    setDepositPercentage(30); // Reset to minimum
    setShowDepositModal(true);
  };

  const handlePayment = async (reservation: IReservation, type: PaymentType, customPercentage?: number) => {
    try {
      setIsProcessing(true);
      
      // Calculate the correct amount based on payment type and current status
      let amount: number;
      if (type === PaymentType.DEPOSIT) {
        // For deposit: use custom percentage (minimum 30%)
        const percentage = Math.max(customPercentage || 30, 30);
        amount = Math.round(reservation.totalPrice * (percentage / 100));
      } else {
        // For full payment: always the remaining balance after any deposit
        amount = reservation.totalPrice - (reservation.depositPaid || 0);
      }
      
      console.log('🔄 Initializing payment:', { 
        reservationId: reservation._id, 
        amount, 
        type,
        totalPrice: reservation.totalPrice,
        depositPaid: reservation.depositPaid || 0,
        customPercentage: customPercentage,
        remainingBalance: amount
      });
      toast.loading('Initializing payment...', { id: 'payment-init' });
      
      const response = await paymentService.initializePayment({
        reservationId: reservation._id,
        amount,
        type,
      });

      console.log('✅ Payment initialized:', response);
      toast.success('Redirecting to payment gateway...', { id: 'payment-init' });
      
      // Close deposit modal if open
      setShowDepositModal(false);
      
      // Small delay to show the success message before redirect
      setTimeout(() => {
        console.log('➡️ Redirecting to:', response.authorization_url);
        window.location.href = response.authorization_url;
      }, 500);
    } catch (error: any) {
      console.error('❌ Payment initialization failed:', error);
      toast.error(error.response?.data?.message || 'Failed to initialize payment', { id: 'payment-init' });
      setIsProcessing(false);
    }
  };

  const handleVerifyPayment = async (reservationId: string) => {
    try {
      setVerifyingPayment(reservationId);
      toast.loading('Checking payment status...', { id: 'verify-payment' });
      
      // Find the payment reference from the reservation
      // This assumes you have a payment reference stored somewhere
      // You might need to add an API endpoint to get the payment reference for a reservation
      
      await loadReservations();
      
      toast.success('Payment status updated!', { id: 'verify-payment' });
    } catch (error: any) {
      toast.error('Failed to verify payment', { id: 'verify-payment' });
    } finally {
      setVerifyingPayment(null);
    }
  };

  const getStatusBadgeVariant = (status: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.CONFIRMED:
        return 'success';
      case ReservationStatus.PENDING:
        return 'warning';
      case ReservationStatus.CANCELLED:
        return 'danger';
      case ReservationStatus.COMPLETED:
        return 'info';
      default:
        return 'default';
    }
  };

  const getPaymentStatusBadgeVariant = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.FULLY_PAID:
        return 'success';
      case PaymentStatus.DEPOSIT_PAID:
        return 'info';
      case PaymentStatus.PENDING:
        return 'warning';
      case PaymentStatus.REFUNDED:
        return 'default';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Reservations</h1>
            <p className="mt-2 text-gray-600">Manage your car rental bookings</p>
          </div>

          {reservations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  No reservations yet
                </h3>
                <p className="mt-2 text-gray-600">
                  Start exploring our collection of cars
                </p>
                <Button className="mt-6" onClick={() => window.location.href = '/cars'}>
                  Browse Cars
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {reservations.map((reservation) => {
                const car = reservation.carId as ICar;
                const days = calculateDays(reservation.startDate, reservation.endDate);

                return (
                  <Card key={reservation._id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>
                            {car.make} {car.model}
                          </CardTitle>
                          <p className="mt-1 text-sm text-gray-600">
                            {car.year} · {car.type}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={getStatusBadgeVariant(reservation.status)}>
                            {reservation.status}
                          </Badge>
                          <Badge variant={getPaymentStatusBadgeVariant(reservation.paymentStatus)}>
                            {reservation.paymentStatus}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Start Date</p>
                            <p className="font-medium">
                              {format(new Date(reservation.startDate), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">End Date</p>
                            <p className="font-medium">
                              {format(new Date(reservation.endDate), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Duration</p>
                            <p className="font-medium">{days} days</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <DollarSign className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Total Price</p>
                            <p className="font-medium text-primary-600">
                              {formatCurrency(reservation.totalPrice)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {reservation.paymentStatus === PaymentStatus.PENDING && (
                        <div className="mt-4 rounded-lg bg-yellow-50 p-4">
                          <p className="text-sm text-yellow-800">
                            Payment pending. Please complete your payment to confirm the booking.
                          </p>
                        </div>
                      )}

                      {reservation.paymentStatus === PaymentStatus.DEPOSIT_PAID && (
                        <div className="mt-4 rounded-lg bg-blue-50 p-4">
                          <p className="text-sm text-blue-800">
                            Deposit paid: {formatCurrency(reservation.depositPaid)}. 
                            Remaining balance: {formatCurrency(reservation.totalPrice - reservation.depositPaid)}
                          </p>
                        </div>
                      )}

                      {/* Countdown Timer for picked up cars */}
                      {reservation.pickedUpAt && !reservation.returnedAt && (
                        <div className="mt-4">
                          <CountdownTimer 
                            targetDate={reservation.endDate}
                            label="Return Due In"
                          />
                        </div>
                      )}

                      {/* Pickup Status Badge */}
                      {reservation.pickedUpAt && !reservation.returnedAt && (
                        <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-3">
                          <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-green-900">
                                Car Picked Up
                              </p>
                              <p className="text-xs text-green-700 mt-0.5">
                                Picked up on {format(new Date(reservation.pickedUpAt), 'MMM dd, yyyy h:mm a')}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Return Status Badge */}
                      {reservation.returnedAt && (
                        <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3">
                          <div className="flex items-center gap-2">
                            <PackageCheck className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium text-blue-900">
                                Car Returned
                              </p>
                              <p className="text-xs text-blue-700 mt-0.5">
                                Returned on {format(new Date(reservation.returnedAt), 'MMM dd, yyyy h:mm a')}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-6 flex flex-wrap gap-3">
                        {/* View Car Location Button - show for confirmed reservations that haven't been picked up */}
                        {reservation.status === ReservationStatus.CONFIRMED && !reservation.pickedUpAt && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewCarLocation(car)}
                          >
                            <MapPin className="mr-2 h-4 w-4" />
                            View Car Location
                          </Button>
                        )}

                        {/* Show payment buttons if payment is not fully paid and reservation is not cancelled/completed */}
                        {reservation.status !== ReservationStatus.CANCELLED &&
                          reservation.status !== ReservationStatus.COMPLETED && (
                          <>
                            {reservation.paymentStatus === PaymentStatus.PENDING && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenDepositModal(reservation)}
                                  isLoading={isProcessing}
                                  disabled={isProcessing}
                                >
                                  Pay Deposit (Min 30%)
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePayment(reservation, PaymentType.FULL_PAYMENT)}
                                  isLoading={isProcessing}
                                  disabled={isProcessing}
                                >
                                  Pay Full Amount ({formatCurrency(reservation.totalPrice)})
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleVerifyPayment(reservation._id)}
                                  isLoading={verifyingPayment === reservation._id}
                                  disabled={verifyingPayment === reservation._id}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Verify Payment
                                </Button>
                              </>
                            )}
                            {reservation.paymentStatus === PaymentStatus.DEPOSIT_PAID && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handlePayment(reservation, PaymentType.FULL_PAYMENT)}
                                  isLoading={isProcessing}
                                  disabled={isProcessing}
                                >
                                  Pay Remaining Balance ({formatCurrency(reservation.totalPrice - (reservation.depositPaid || 0))})
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleVerifyPayment(reservation._id)}
                                  isLoading={verifyingPayment === reservation._id}
                                  disabled={verifyingPayment === reservation._id}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Verify Payment
                                </Button>
                              </>
                            )}
                          </>
                        )}

                        {/* Pickup Button - show for fully paid confirmed reservations that haven't been picked up */}
                        {reservation.status === ReservationStatus.CONFIRMED && 
                         reservation.paymentStatus === PaymentStatus.FULLY_PAID && 
                         !reservation.pickedUpAt && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReservationForPickup(reservation);
                              setShowPickupModal(true);
                            }}
                          >
                            <Package className="mr-2 h-4 w-4" />
                            Mark as Picked Up
                          </Button>
                        )}

                        {/* Return Button - show for picked up reservations that haven't been returned */}
                        {reservation.pickedUpAt && !reservation.returnedAt && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReservationForReturn(reservation);
                              setShowReturnModal(true);
                            }}
                          >
                            <PackageCheck className="mr-2 h-4 w-4" />
                            Mark as Returned
                          </Button>
                        )}

                        {/* Show rating button for completed reservations */}
                        {reservation.status === ReservationStatus.COMPLETED && !reservation.rating?.ratedAt && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenRatingModal(reservation)}
                          >
                            <Star className="mr-2 h-4 w-4" />
                            Rate Experience
                          </Button>
                        )}

                        {/* Show rating if already rated */}
                        {reservation.rating?.ratedAt && (
                          <div className="flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2">
                            <Rating value={reservation.rating.stars} readonly size="sm" />
                            <span className="text-sm text-gray-600">Rated</span>
                          </div>
                        )}

                        {/* Chat button for confirmed or active reservations */}
                        {(reservation.status === ReservationStatus.CONFIRMED || 
                          reservation.status === ReservationStatus.COMPLETED) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setChatReservationId(reservation._id);
                              setShowChatModal(true);
                            }}
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Chat
                          </Button>
                        )}

                        {/* Show cancel button for active reservations */}
                        {reservation.status !== ReservationStatus.CANCELLED &&
                          reservation.status !== ReservationStatus.COMPLETED && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleCancelReservation(reservation._id)}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Cancel
                            </Button>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      {selectedReservation && (
        <Modal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedReservation(null);
          }}
          title="Rate Your Experience"
          size="md"
        >
          <div className="space-y-6">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <strong>Car:</strong> {(selectedReservation.carId as ICar).make}{' '}
                {(selectedReservation.carId as ICar).model}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Rating
              </label>
              <Rating
                value={ratingStars}
                onChange={setRatingStars}
                size="lg"
              />
              <p className="mt-2 text-sm text-gray-600">
                {ratingStars === 5 && 'Excellent!'}
                {ratingStars === 4 && 'Very Good'}
                {ratingStars === 3 && 'Good'}
                {ratingStars === 2 && 'Fair'}
                {ratingStars === 1 && 'Poor'}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Review (Optional)
              </label>
              <textarea
                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                rows={4}
                placeholder="Share your experience with this rental..."
                value={ratingReview}
                onChange={(e) => setRatingReview(e.target.value)}
              />
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRatingModal(false);
                  setSelectedReservation(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmitRating}
              >
                Submit Rating
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Deposit Amount Modal */}
      {selectedReservationForDeposit && (
        <Modal
          isOpen={showDepositModal}
          onClose={() => {
            setShowDepositModal(false);
            setSelectedReservationForDeposit(null);
          }}
          title="Choose Deposit Amount"
          size="md"
        >
          <div className="space-y-6">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <strong>Total Booking:</strong> {formatCurrency(selectedReservationForDeposit.totalPrice)}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Minimum deposit required: 30% ({formatCurrency(selectedReservationForDeposit.totalPrice * 0.3)})
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Deposit Percentage: {depositPercentage}%
              </label>
              <input
                type="range"
                min="30"
                max="100"
                value={depositPercentage}
                onChange={(e) => setDepositPercentage(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>30% (Min)</span>
                <span>100% (Full)</span>
              </div>
            </div>

            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-lg font-semibold text-green-800">
                Deposit Amount: {formatCurrency(Math.round(selectedReservationForDeposit.totalPrice * (depositPercentage / 100)))}
              </p>
              <p className="text-sm text-green-600 mt-1">
                Remaining Balance: {formatCurrency(selectedReservationForDeposit.totalPrice - Math.round(selectedReservationForDeposit.totalPrice * (depositPercentage / 100)))}
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowDepositModal(false);
                  setSelectedReservationForDeposit(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => handlePayment(selectedReservationForDeposit, PaymentType.DEPOSIT, depositPercentage)}
                isLoading={isProcessing}
                disabled={isProcessing}
              >
                Pay Deposit
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Chat Modal */}
      {showChatModal && chatReservationId && (
        <ChatWindow
          reservationId={chatReservationId}
          otherParticipantName="Car Owner"
          onClose={() => {
            setShowChatModal(false);
            setChatReservationId(null);
          }}
        />
      )}

      {/* Pickup Modal */}
      <Modal
        isOpen={showPickupModal}
        onClose={() => {
          setShowPickupModal(false);
          setSelectedReservationForPickup(null);
        }}
        title="Mark Car as Picked Up"
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> You can optionally capture your location to record where you picked up the car.
            </p>
          </div>

          <LocationTracker 
            onLocationCapture={handlePickup}
            buttonText="Capture Location & Mark as Picked Up"
            showMap={false}
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">or</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => handlePickup()}
          >
            Mark as Picked Up (Without Location)
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setShowPickupModal(false);
              setSelectedReservationForPickup(null);
            }}
          >
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Return Modal */}
      <Modal
        isOpen={showReturnModal}
        onClose={() => {
          setShowReturnModal(false);
          setSelectedReservationForReturn(null);
        }}
        title="Mark Car as Returned"
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-sm text-green-800">
              <strong>Note:</strong> Marking the car as returned will complete this reservation. You can optionally capture your location to record where you returned the car.
            </p>
          </div>

          <LocationTracker 
            onLocationCapture={handleReturn}
            buttonText="Capture Location & Mark as Returned"
            showMap={false}
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">or</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleReturn()}
          >
            Mark as Returned (Without Location)
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setShowReturnModal(false);
              setSelectedReservationForReturn(null);
            }}
          >
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Car Location Modal */}
      {selectedCarForLocation && (
        <Modal
          isOpen={showCarLocationModal}
          onClose={() => {
            setShowCarLocationModal(false);
            setSelectedCarForLocation(null);
          }}
          title={`${selectedCarForLocation.make} ${selectedCarForLocation.model} Location`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900">Car Location</p>
                  <p className="text-sm text-blue-700 mt-1">
                    {selectedCarForLocation.location?.address || 'Address not available'}
                  </p>
                  {selectedCarForLocation.location?.city && (
                    <p className="text-sm text-blue-600 mt-1">
                      {selectedCarForLocation.location.city}
                      {selectedCarForLocation.location.state && `, ${selectedCarForLocation.location.state}`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {selectedCarForLocation.location && (
              <Map
                address={selectedCarForLocation.location.address}
                city={selectedCarForLocation.location.city}
                state={selectedCarForLocation.location.state}
                lat={selectedCarForLocation.location.coordinates?.lat}
                lng={selectedCarForLocation.location.coordinates?.lng}
              />
            )}

            {!selectedCarForLocation.location && (
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-600">No location information available for this car</p>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setShowCarLocationModal(false);
                setSelectedCarForLocation(null);
              }}
            >
              Close
            </Button>
          </div>
        </Modal>
      )}
    </SidebarLayout>
  );
}

