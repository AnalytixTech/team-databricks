import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import {
  Car,
  Calendar,
  DollarSign,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  PieChart,
  FileDown,
  MapPin,
  MessageCircle,
} from 'lucide-react';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import LocationTracker from '@/components/ui/LocationTracker';
import ChatWindow from '@/components/ui/ChatWindow';
import { carService } from '@/services/car.service';
import { dashboardService } from '@/services/dashboard.service';
import { ICar, IReservation, CarType, DetailedReport, ReservationStatus, PaymentStatus } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useForm } from 'react-hook-form';

interface CarForm {
  make: string;
  model: string;
  type: CarType;
  year: number;
  licensePlate: string;
  mileage?: number;
  weight?: number;
  rentalPricePerDay: number;
  availabilityRules?: string;
  address?: string;
  city?: string;
  state?: string;
}

interface ReservationForm {
  carId: string;
  startDate: string;
  endDate: string;
  customerEmail: string;
  customerPhone: string;
  licenseNumber: string;
  licenseExpiry: string;
}

export default function Dashboard() {
  const [cars, setCars] = useState<ICar[]>([]);
  const [reservations, setReservations] = useState<IReservation[]>([]);
  const [report, setReport] = useState<DetailedReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCarModal, setShowCarModal] = useState(false);
  const [editingCar, setEditingCar] = useState<ICar | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showCreateReservationModal, setShowCreateReservationModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<IReservation | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'cars' | 'reservations' | 'reports'>(() => {
    const hash = window.location.hash.replace('#', '');
    return (hash as 'overview' | 'cars' | 'reservations' | 'reports') || 'overview';
  });
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatReservationId, setChatReservationId] = useState<string | null>(null);
  const [chatCustomerName, setChatCustomerName] = useState<string>('Customer');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CarForm>();

  const {
    register: registerReservation,
    handleSubmit: handleSubmitReservation,
    formState: { errors: reservationErrors },
    reset: resetReservation,
    watch: watchReservation,
  } = useForm<ReservationForm>();

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Listen for hash changes to switch tabs
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['overview', 'cars', 'reservations', 'reports'].includes(hash)) {
        setActiveTab(hash as 'overview' | 'cars' | 'reservations' | 'reports');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [carsData, reservationsData, reportData] = await Promise.all([
        dashboardService.getOwnerCars().catch(() => []),
        dashboardService.getAllReservations().catch(() => []),
        dashboardService.getReports(dateRange.startDate, dateRange.endDate).catch(() => ({
          overview: {
            totalRevenue: 0,
            totalBookings: 0,
            averageBookingValue: 0,
          },
          topCars: [],
          reservationsByStatus: [],
          reservationsByType: [],
        })),
      ]);      
      setCars(carsData || []);
      setReservations(reservationsData || []);
      setReport(reportData || {
        overview: {
          totalRevenue: 0,
          totalBookings: 0,
          averageBookingValue: 0,
        },
        topCars: [],
        reservationsByStatus: [],
        reservationsByType: [],
      });
    } catch (error) {
      console.error('Dashboard data loading error:', error);
      toast.error('Failed to load dashboard data');
      // Set fallback data
      setCars([]);
      setReservations([]);
      setReport({
        overview: {
          totalRevenue: 0,
          totalBookings: 0,
          averageBookingValue: 0,
        },
        topCars: [],
        reservationsByStatus: [],
        reservationsByType: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCar = () => {
    setEditingCar(null);
    reset();
    setShowCarModal(true);
  };

  const handleEditCar = (car: ICar) => {
    setEditingCar(car);
    reset({
      make: car.make,
      model: car.model,
      type: car.type,
      year: car.year,
      licensePlate: car.licensePlate,
      mileage: car.mileage,
      weight: car.weight,
      rentalPricePerDay: car.rentalPricePerDay,
      availabilityRules: car.availability.rules,
      address: car.location?.address || '',
      city: car.location?.city || '',
      state: car.location?.state || '',
    });
    setShowCarModal(true);
  };

  const handleDeleteCar = async (id: string) => {
    if (!confirm('Are you sure you want to delete this car?')) {
      return;
    }

    try {
      await carService.deleteCar(id);
      toast.success('Car deleted successfully');
      loadDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete car');
    }
  };

  const handleReassignReservation = (reservation: IReservation) => {
    setSelectedReservation(reservation);
    setShowReassignModal(true);
  };

  const onSubmitReassign = async (newCarId: string) => {
    if (!selectedReservation || !newCarId) return;

    try {
      await dashboardService.reassignReservation(selectedReservation._id, newCarId);
      toast.success('Reservation reassigned successfully');
      setShowReassignModal(false);
      setSelectedReservation(null);
      loadDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reassign reservation');
    }
  };

  const handleCreateReservation = () => {
    resetReservation();
    setShowCreateReservationModal(true);
  };

  const onSubmitCreateReservation = async (data: ReservationForm) => {
    try {
      await dashboardService.createReservation({
        carId: data.carId,
        startDate: data.startDate,
        endDate: data.endDate,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        driverLicense: {
          number: data.licenseNumber,
          expiryDate: data.licenseExpiry,
        },
      });
      toast.success('Reservation created successfully');
      setShowCreateReservationModal(false);
      resetReservation();
      loadDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create reservation');
    }
  };

  const onSubmitCar = async (data: CarForm) => {
    try {
      const carData: any = {
        ...data,
      };

      // Add location data if provided
      if (data.address || data.city || data.state) {
        carData.location = {
          address: data.address,
          city: data.city,
          state: data.state,
        };
      }

      if (editingCar) {
        await carService.updateCar(editingCar._id, carData);
        toast.success('Car updated successfully');
      } else {
        const newCar = await carService.createCar(carData);
        
        // Upload images if selected
        if (selectedImages.length > 0) {
          await carService.uploadCarImages(newCar._id, selectedImages);
        }
        
        toast.success('Car created successfully');
      }
      
      setShowCarModal(false);
      setSelectedImages([]);
      loadDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save car');
    }
  };

  const handleExportPDF = () => {
    if (!report) {
      toast.error('No report data available');
      return;
    }

    try {
      toast.loading('Generating PDF...', { id: 'pdf-export' });

      const doc = new jsPDF();
      
      // Add title and logo
      doc.setFontSize(20);
      doc.text('Fleetly Car Rental Report', 20, 20);
      
      // Add date range
      const dateRangeText = dateRange.startDate && dateRange.endDate 
        ? `Report Period: ${format(new Date(dateRange.startDate), 'MMM dd, yyyy')} - ${format(new Date(dateRange.endDate), 'MMM dd, yyyy')}`
        : `Report Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`;
      
      doc.setFontSize(12);
      doc.text(dateRangeText, 20, 35);
      
      let yPosition = 50;
      
      // Overview Section
      doc.setFontSize(16);
      doc.text('Overview', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(11);
      doc.text(`Total Revenue: ${formatCurrency(report.overview?.totalRevenue || 0)}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Total Bookings: ${report.overview?.totalBookings || 0}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Average Booking Value: ${formatCurrency(report.overview?.averageBookingValue || 0)}`, 20, yPosition);
      yPosition += 20;
      
      // Top Performing Cars
      if (report.topCars && report.topCars.length > 0) {
        doc.setFontSize(16);
        doc.text('Top Performing Cars', 20, yPosition);
        yPosition += 15;
        
        doc.setFontSize(11);
        report.topCars.slice(0, 10).forEach((car, index) => {
          if (yPosition > 260) { // Start new page if needed
            doc.addPage();
            yPosition = 20;
          }
          
          const carText = `${index + 1}. ${car.make} ${car.model} - Revenue: ${formatCurrency(car.totalRevenue)} (${car.bookingCount} bookings)`;
          doc.text(carText, 20, yPosition);
          yPosition += 8;
        });
        yPosition += 10;
      }
      
      // Reservations by Status
      if (report.reservationsByStatus && report.reservationsByStatus.length > 0) {
        if (yPosition > 220) { // Start new page if needed
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(16);
        doc.text('Reservations by Status', 20, yPosition);
        yPosition += 15;
        
        doc.setFontSize(11);
        report.reservationsByStatus.forEach((status) => {
          doc.text(`${status._id}: ${status.count} reservations`, 20, yPosition);
          yPosition += 8;
        });
        yPosition += 10;
      }
      
      // Reservations by Type
      if (report.reservationsByType && report.reservationsByType.length > 0) {
        if (yPosition > 220) { // Start new page if needed
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(16);
        doc.text('Reservations by Type', 20, yPosition);
        yPosition += 15;
        
        doc.setFontSize(11);
        report.reservationsByType.forEach((type) => {
          doc.text(`${type._id}: ${type.count} reservations`, 20, yPosition);
          yPosition += 8;
        });
      }
      
      // Add footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(`Page ${i} of ${pageCount}`, 20, 280);
        doc.text('Generated by Fleetly Car Rental Platform', 120, 280);
      }
      
      // Generate filename with date
      const filename = `fleetly-report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
      
      // Save and auto-download
      doc.save(filename);
      
      toast.success('PDF report downloaded successfully!', { id: 'pdf-export' });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF report', { id: 'pdf-export' });
    }
  };

  const canCancelReservation = (reservation: IReservation): boolean => {
    // Check if reservation has been paid
    const isPaid = reservation.paymentStatus === PaymentStatus.DEPOSIT_PAID || 
                   reservation.paymentStatus === PaymentStatus.FULLY_PAID;
    
    // Check if reservation has expired
    const hasExpired = new Date(reservation.endDate) < new Date();
    
    // Can only cancel if not paid, or if paid but already expired
    return !isPaid || hasExpired;
  };

  const getCancelButtonTooltip = (reservation: IReservation): string => {
    const isPaid = reservation.paymentStatus === PaymentStatus.DEPOSIT_PAID || 
                   reservation.paymentStatus === PaymentStatus.FULLY_PAID;
    const hasExpired = new Date(reservation.endDate) < new Date();
    
    if (isPaid && !hasExpired) {
      return 'Cannot cancel paid reservation until after end date. Contact customer for refund.';
    }
    return 'Cancel this reservation';
  };

  const handleCancelReservation = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    try {
      await dashboardService.cancelReservation(id);
      toast.success('Reservation cancelled');
      loadDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel reservation');
    }
  };

  const handleOpenChat = (reservation: IReservation) => {
    setChatReservationId(reservation._id);
    
    // Get customer name
    let customerName = 'Customer';
    if (reservation.userId) {
      // For firm reservations, we might need to fetch user details
      // For now, use email from guestInfo if available
      customerName = reservation.guestInfo?.email || 'Renter';
    } else if (reservation.guestInfo?.email) {
      customerName = reservation.guestInfo.email;
    }
    
    setChatCustomerName(customerName);
    setShowChatModal(true);
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
        <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Business Dashboard</h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Manage your fleet and reservations</p>
          </div>


          {/* Overview Tab */}
          {activeTab === 'overview' && report && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  icon={<DollarSign className="h-6 w-6" />}
                  title="Total Revenue"
                  value={formatCurrency(report.overview.totalRevenue || 0)}
                  color="green"
                />
                <StatCard
                  icon={<Calendar className="h-6 w-6" />}
                  title="Total Bookings"
                  value={(report.overview.totalBookings || 0).toString()}
                  color="blue"
                />
                <StatCard
                  icon={<TrendingUp className="h-6 w-6" />}
                  title="Avg Booking Value"
                  value={formatCurrency(report.overview.averageBookingValue || 0)}
                  color="purple"
                />
                <StatCard
                  icon={<Car className="h-6 w-6" />}
                  title="Total Cars"
                  value={cars.length.toString()}
                  color="orange"
                />
              </div>

              {/* My Location Tracker */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary-600" />
                    <CardTitle>My Location</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Track your current location to share with customers or for business analytics.
                  </p>
                  <Button onClick={() => setShowLocationModal(true)}>
                    <MapPin className="mr-2 h-4 w-4" />
                    Get My Current Location
                  </Button>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Recent Reservations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Reservations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reservations.slice(0, 5).map((reservation) => {
                      const car = reservation.carId as ICar;
                      return (
                        <div
                          key={reservation._id}
                          className="flex items-center justify-between border-b border-gray-200 py-3 last:border-0"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {car.make} {car.model}
                            </p>
                            <p className="text-sm text-gray-600">
                              {format(new Date(reservation.startDate), 'MMM dd')} -{' '}
                              {format(new Date(reservation.endDate), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <Badge
                            variant={
                              reservation.status === ReservationStatus.CONFIRMED
                                ? 'success'
                                : 'warning'
                            }
                          >
                            {reservation.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Top Cars */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Fleet</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cars.slice(0, 5).map((car) => (
                      <div
                        key={car._id}
                        className="flex items-center justify-between border-b border-gray-200 py-3 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {car.make} {car.model}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(car.rentalPricePerDay)}/day
                          </p>
                        </div>
                        <Badge
                          variant={
                            car.availability.status === 'available' ? 'success' : 'danger'
                          }
                        >
                          {car.availability.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Cars Tab */}
          {activeTab === 'cars' && (
            <div id="cars-section">
              <div className="mb-6 flex justify-end">
                <Button onClick={handleAddCar} data-action="add-car">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Car
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {cars.map((car) => (
                  <Card key={car._id}>
                    <div className="aspect-video overflow-hidden rounded-t-xl">
                      <img
                        src={car.images[0] || 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=500'}
                        alt={`${car.make} ${car.model}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {car.make} {car.model}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {car.year} · {car.type}
                          </p>
                          <p className="mt-2 text-xl font-bold text-primary-600">
                            {formatCurrency(car.rentalPricePerDay)}/day
                          </p>
                        </div>
                        <Badge
                          variant={
                            car.availability.status === 'available' ? 'success' : 'danger'
                          }
                        >
                          {car.availability.status}
                        </Badge>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleEditCar(car)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteCar(car._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Reservations Tab */}
          {activeTab === 'reservations' && (
            <div id="reservations-section" className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={handleCreateReservation} data-action="create-reservation">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Reservation
                </Button>
              </div>

              {reservations.map((reservation) => {
                const car = reservation.carId as ICar;
                return (
                  <Card key={reservation._id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {car.make} {car.model}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {format(new Date(reservation.startDate), 'MMM dd, yyyy')} -{' '}
                                {format(new Date(reservation.endDate), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                            <div>
                              <p className="text-sm text-gray-600">Customer</p>
                              <p className="font-medium text-gray-900 text-sm truncate">
                                {reservation.guestInfo?.email || 'Registered User'}
                              </p>
                              {reservation.guestInfo?.phone && (
                                <p className="text-xs text-gray-500">{reservation.guestInfo.phone}</p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Total Price</p>
                              <p className="font-medium text-gray-900">
                                {formatCurrency(reservation.totalPrice)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Status</p>
                              <Badge
                                variant={
                                  reservation.status === ReservationStatus.CONFIRMED
                                    ? 'success'
                                    : 'warning'
                                }
                              >
                                {reservation.status}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Payment</p>
                              <Badge variant="info">{reservation.paymentStatus}</Badge>
                            </div>
                          </div>

                          {/* Show protection notice for paid non-expired reservations */}
                          {!canCancelReservation(reservation) && (
                            <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                              <div className="flex items-start gap-2">
                                <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-yellow-800">
                                    Protected Reservation
                                  </p>
                                  <p className="mt-1 text-xs text-yellow-700">
                                    This reservation has been paid and cannot be cancelled until after {format(new Date(reservation.endDate), 'MMM dd, yyyy')}.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {/* Chat Button - show for confirmed or active reservations with a userId */}
                          {reservation.userId && 
                           (reservation.status === ReservationStatus.CONFIRMED || 
                            reservation.status === ReservationStatus.COMPLETED) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenChat(reservation)}
                            >
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Chat with Renter
                            </Button>
                          )}
                          
                          <div className="flex gap-2">
                            {reservation.status !== ReservationStatus.CANCELLED && 
                             reservation.paymentStatus === PaymentStatus.PENDING && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReassignReservation(reservation)}
                              >
                                Reassign
                              </Button>
                            )}
                            {reservation.status !== ReservationStatus.CANCELLED && (
                              <div className="relative group">
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleCancelReservation(reservation._id)}
                                  disabled={!canCancelReservation(reservation)}
                                  title={getCancelButtonTooltip(reservation)}
                                >
                                  Cancel
                                </Button>
                                {!canCancelReservation(reservation) && (
                                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg">
                                    {getCancelButtonTooltip(reservation)}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && report && (
            <div id="reports-section" className="space-y-6">
              {/* Date Range Filter */}
              <Card>
                <CardHeader>
                  <CardTitle>Filter Reports by Date Range</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <Input
                      label="Start Date"
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    />
                    <Input
                      label="End Date"
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    />
                    <Button onClick={loadDashboardData}>
                      Apply Filter
                    </Button>
                    {(dateRange.startDate || dateRange.endDate) && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDateRange({ startDate: '', endDate: '' });
                          loadDashboardData();
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Overview Stats */}
              <div id="revenue-section" className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="mt-2 text-3xl font-bold text-green-600">
                          {formatCurrency(report.overview.totalRevenue)}
                        </p>
                      </div>
                      <DollarSign className="h-12 w-12 text-green-600 opacity-20" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Bookings</p>
                        <p className="mt-2 text-3xl font-bold text-blue-600">
                          {report.overview.totalBookings}
                        </p>
                      </div>
                      <Calendar className="h-12 w-12 text-blue-600 opacity-20" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Avg Booking Value</p>
                        <p className="mt-2 text-3xl font-bold text-purple-600">
                          {formatCurrency(report.overview.averageBookingValue)}
                        </p>
                      </div>
                      <TrendingUp className="h-12 w-12 text-purple-600 opacity-20" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Performing Cars */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary-600" />
                    <CardTitle>Top Performing Cars</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {report.topCars.length === 0 ? (
                    <p className="text-center text-gray-600 py-8">No data available for the selected period</p>
                  ) : (
                    <div className="space-y-4">
                      {report.topCars.map((car, index) => (
                        <div
                          key={car.carId}
                          className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-0"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-600">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {car.make} {car.model}
                              </p>
                              <p className="text-sm text-gray-600">Car ID: {car.carId}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-green-600">
                              {formatCurrency(car.revenue)}
                            </p>
                            <p className="text-sm text-gray-600">Total Revenue</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reservation Analytics */}
              <div id="analytics-section" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* By Status */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-primary-600" />
                      <CardTitle>Reservations by Status</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {report.reservationsByStatus.length === 0 ? (
                      <p className="text-center text-gray-600 py-8">No data available</p>
                    ) : (
                      <div className="space-y-3">
                        {report.reservationsByStatus.map((item) => (
                          <div
                            key={item._id}
                            className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-4 w-4 rounded-full bg-primary-600"></div>
                              <span className="font-medium capitalize text-gray-900">
                                {item._id}
                              </span>
                            </div>
                            <span className="text-lg font-bold text-gray-900">
                              {item.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* By Type */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-primary-600" />
                      <CardTitle>Reservations by Type</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {report.reservationsByType.length === 0 ? (
                      <p className="text-center text-gray-600 py-8">No data available</p>
                    ) : (
                      <div className="space-y-3">
                        {report.reservationsByType.map((item) => (
                          <div
                            key={item._id}
                            className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-4 w-4 rounded-full bg-blue-600"></div>
                              <span className="font-medium capitalize text-gray-900">
                                {item._id.replace('-', ' ')}
                              </span>
                            </div>
                            <span className="text-lg font-bold text-gray-900">
                              {item.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Export Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline"
                    onClick={handleExportPDF}
                    className="w-full"
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export as PDF
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Car Modal */}
      <Modal
        isOpen={showCarModal}
        onClose={() => {
          setShowCarModal(false);
          setSelectedImages([]);
        }}
        title={editingCar ? 'Edit Car' : 'Add New Car'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmitCar)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Make"
              error={errors.make?.message}
              {...register('make', { required: 'Make is required' })}
            />
            <Input
              label="Model"
              error={errors.model?.message}
              {...register('model', { required: 'Model is required' })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Type"
              error={errors.type?.message}
              {...register('type', { required: 'Type is required' })}
            >
              <option value="">Select type</option>
              {Object.values(CarType).map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </Select>
            <Input
              label="Year"
              type="number"
              error={errors.year?.message}
              {...register('year', {
                required: 'Year is required',
                valueAsNumber: true,
              })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="License Plate"
              error={errors.licensePlate?.message}
              {...register('licensePlate', { required: 'License plate is required' })}
            />
            <Input
              label="Rental Price Per Day"
              type="number"
              error={errors.rentalPricePerDay?.message}
              {...register('rentalPricePerDay', {
                required: 'Price is required',
                valueAsNumber: true,
              })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Mileage (km) - Optional"
              type="number"
              min="0"
              placeholder="e.g., 50000"
              error={errors.mileage?.message}
              {...register('mileage', { valueAsNumber: true })}
            />
            <Input
              label="Weight (kg) - Optional"
              type="number"
              min="0"
              placeholder="e.g., 1500"
              error={errors.weight?.message}
              {...register('weight', { valueAsNumber: true })}
            />
          </div>

          <Input
            label="Availability Rules (Optional)"
            {...register('availabilityRules')}
          />

          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Location Details (Optional)</h3>
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Address"
                placeholder="e.g., 123 Main Street"
                error={errors.address?.message}
                {...register('address')}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="City"
                  placeholder="e.g., Lagos"
                  error={errors.city?.message}
                  {...register('city')}
                />
                <Input
                  label="State"
                  placeholder="e.g., Lagos"
                  error={errors.state?.message}
                  {...register('state')}
                />
              </div>
            </div>
          </div>

          {!editingCar && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Car Images
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) {
                    setSelectedImages(Array.from(e.target.files));
                  }
                }}
                className="block w-full text-sm text-gray-900 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100"
              />
              {selectedImages.length > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  {selectedImages.length} file(s) selected
                </p>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowCarModal(false);
                setSelectedImages([]);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingCar ? 'Update' : 'Create'} Car
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reassign Reservation Modal */}
      {selectedReservation && (
        <Modal
          isOpen={showReassignModal}
          onClose={() => {
            setShowReassignModal(false);
            setSelectedReservation(null);
          }}
          title="Reassign Reservation"
          size="md"
        >
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <strong>Current Car:</strong> {(selectedReservation.carId as ICar).make}{' '}
                {(selectedReservation.carId as ICar).model}
              </p>
              <p className="text-sm text-blue-800 mt-1">
                <strong>Dates:</strong> {format(new Date(selectedReservation.startDate), 'MMM dd, yyyy')} -{' '}
                {format(new Date(selectedReservation.endDate), 'MMM dd, yyyy')}
              </p>
            </div>

            <Select
              label="Select New Car"
              onChange={(e) => {
                if (e.target.value) {
                  onSubmitReassign(e.target.value);
                }
              }}
            >
              <option value="">Choose a car...</option>
              {cars.map((car) => (
                <option key={car._id} value={car._id}>
                  {car.make} {car.model} - {formatCurrency(car.rentalPricePerDay)}/day
                </option>
              ))}
            </Select>

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowReassignModal(false);
                  setSelectedReservation(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Reservation Modal */}
      <Modal
        isOpen={showCreateReservationModal}
        onClose={() => {
          setShowCreateReservationModal(false);
          resetReservation();
        }}
        title="Create New Reservation"
        size="lg"
      >
        <form onSubmit={handleSubmitReservation(onSubmitCreateReservation)} className="space-y-6">
          <Select
            label="Select Car"
            error={reservationErrors.carId?.message}
            {...registerReservation('carId', { required: 'Car is required' })}
          >
            <option value="">Choose a car...</option>
            {cars.map((car) => (
              <option key={car._id} value={car._id}>
                {car.make} {car.model} - {formatCurrency(car.rentalPricePerDay)}/day
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Start Date"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              error={reservationErrors.startDate?.message}
              {...registerReservation('startDate', { required: 'Start date is required' })}
            />
            <Input
              label="End Date"
              type="date"
              min={watchReservation('startDate') || new Date().toISOString().split('T')[0]}
              error={reservationErrors.endDate?.message}
              {...registerReservation('endDate', { required: 'End date is required' })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Customer Email"
              type="email"
              placeholder="customer@email.com"
              error={reservationErrors.customerEmail?.message}
              {...registerReservation('customerEmail', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />
            <Input
              label="Customer Phone"
              type="tel"
              placeholder="+234 800 000 0000"
              error={reservationErrors.customerPhone?.message}
              {...registerReservation('customerPhone', { required: 'Phone is required' })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Driver License Number"
              type="text"
              placeholder="Enter license number"
              error={reservationErrors.licenseNumber?.message}
              {...registerReservation('licenseNumber', { required: 'License number is required' })}
            />
            <Input
              label="License Expiry Date"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              error={reservationErrors.licenseExpiry?.message}
              {...registerReservation('licenseExpiry', {
                required: 'License expiry date is required',
                validate: (value) => {
                  const expiry = new Date(value);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return expiry >= today || 'Driver license has expired';
                },
              })}
            />
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> If the customer email matches an existing user, a firm reservation will be created. 
              Otherwise, a soft reservation will be created and the customer will need to register.
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowCreateReservationModal(false);
                resetReservation();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Create Reservation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Location Tracker Modal */}
      <Modal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        title="My Current Location"
        size="lg"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This feature uses your browser's geolocation to determine your current location.
              The location will be displayed on a map using OpenStreetMap.
            </p>
          </div>

          <LocationTracker 
            onLocationCapture={(location) => {
              console.log('Business owner location:', location);
              toast.success('Location captured! You can now share this with customers if needed.');
            }}
            buttonText="Get My Current Location"
            showMap={true}
          />

          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-700">
              <strong>Use Cases:</strong>
            </p>
            <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Share your location with customers for car pickup/delivery</li>
              <li>Track your location for business analytics</li>
              <li>Verify car handover locations</li>
            </ul>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowLocationModal(false)}
          >
            Close
          </Button>
        </div>
      </Modal>

      {/* Chat Modal for Business Owners */}
      {showChatModal && chatReservationId && (
        <ChatWindow
          reservationId={chatReservationId}
          otherParticipantName={chatCustomerName}
          onClose={() => {
            setShowChatModal(false);
            setChatReservationId(null);
          }}
        />
      )}
    </SidebarLayout>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  color: 'green' | 'blue' | 'purple' | 'orange';
}

function StatCard({ icon, title, value, color }: StatCardProps) {
  const colors = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`rounded-lg p-3 ${colors[color]}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

