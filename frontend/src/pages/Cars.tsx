import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Search, Filter, Calendar, Star } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import Rating from '@/components/ui/Rating';
import Map from '@/components/ui/Map';
import { carService } from '@/services/car.service';
import { reservationService } from '@/services/reservation.service';
import { useAuthStore } from '@/store/auth.store';
import { ICar, CarType } from '@/types';
import { formatCurrency, calculateDays } from '@/lib/utils';

interface BookingForm {
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  guestEmail?: string;
  guestPhone?: string;
  licenseNumber: string;
  licenseExpiry: string;
}

export default function Cars() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [cars, setCars] = useState<ICar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState<ICar | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    minPrice: '',
    maxPrice: '',
    search: '',
    startDate: '',
    endDate: '',
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<BookingForm>();

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  useEffect(() => {
    loadCars();
  }, []);

  const loadCars = async () => {
    try {
      setIsLoading(true);
      const response = await carService.getCars({
        type: filters.type as CarType,
        minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      setCars(response.cars);
    } catch (error) {
      console.error('Failed to load cars:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    loadCars();
  };

  const filteredCars = cars.filter((car) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        car.make.toLowerCase().includes(searchLower) ||
        car.model.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const handleViewDetails = (car: ICar) => {
    setSelectedCar(car);
    setSelectedImageIndex(0);
    setShowDetailsModal(true);
  };

  const handleBookCar = (car: ICar) => {
    setSelectedCar(car);
    reset();
    setShowBookingModal(true);
  };

  const calculateTotalPrice = () => {
    if (!selectedCar || !startDate || !endDate) return 0;
    const days = calculateDays(startDate, endDate);
    return days * selectedCar.rentalPricePerDay;
  };

  const onSubmitBooking = async (data: BookingForm) => {
    if (!selectedCar) return;

    setIsSubmitting(true);
    try {
      if (isAuthenticated) {
        await reservationService.createFirmReservation({
          carId: selectedCar._id,
          startDate: data.startDate,
          endDate: data.endDate,
          startTime: data.startTime,
          endTime: data.endTime,
        });
        toast.success('Reservation created successfully!');
        navigate({ to: '/reservations' });
      } else {
        if (!data.guestEmail || !data.guestPhone) {
          toast.error('Please provide email and phone for guest reservation');
          return;
        }
        await reservationService.createSoftReservation({
          carId: selectedCar._id,
          startDate: data.startDate,
          endDate: data.endDate,
          startTime: data.startTime,
          endTime: data.endTime,
          guestInfo: {
            email: data.guestEmail,
            phone: data.guestPhone,
          },
          driverLicense: {
            number: data.licenseNumber,
            expiryDate: data.licenseExpiry,
          },
        });
        toast.success('Soft reservation created! Please register to confirm.');
        setShowBookingModal(false);
        setSelectedCar(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Reservation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              Find Your Perfect Car
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Choose from our wide selection of quality vehicles
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mt-12 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="md:col-span-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by make or model..."
                    className="pl-10"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
              </div>

              <Select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="">All Types</option>
                {Object.values(CarType).map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </Select>

              <Input
                type="number"
                placeholder="Min price"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />

              <Input
                type="number"
                placeholder="Max price"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </div>

            {/* Availability Date Filters */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                type="date"
                label="Start Date (Optional)"
                min={new Date().toISOString().split('T')[0]}
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
              <Input
                type="date"
                label="End Date (Optional)"
                min={filters.startDate || new Date().toISOString().split('T')[0]}
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                disabled={!filters.startDate}
              />
              {(filters.startDate || filters.endDate) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, startDate: '', endDate: '' }));
                    handleSearch();
                  }}
                  className="sm:col-span-2 lg:col-span-1"
                >
                  Clear Dates
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={handleSearch}>
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
          </div>

          {/* Cars Grid */}
          {isLoading ? (
            <div className="mt-12 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="mt-12 text-center">
              <p className="text-lg text-gray-600">No cars found matching your criteria</p>
            </div>
          ) : (
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCars.map((car) => (
                <CarCard 
                  key={car._id} 
                  car={car} 
                  onBook={handleBookCar}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setSelectedCar(null);
        }}
        title={selectedCar ? `Book ${selectedCar.make} ${selectedCar.model}` : 'Book Car'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmitBooking)} className="space-y-6">
          {/* Date Selection */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Start Date"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              error={errors.startDate?.message}
              {...register('startDate', { required: 'Start date is required' })}
            />
            <Input
              label="End Date"
              type="date"
              min={startDate || new Date().toISOString().split('T')[0]}
              error={errors.endDate?.message}
              {...register('endDate', { required: 'End date is required' })}
            />
          </div>

          {/* Time Selection (Optional) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Start Time (Optional)"
              type="time"
              error={errors.startTime?.message}
              {...register('startTime')}
            />
            <Input
              label="End Time (Optional)"
              type="time"
              error={errors.endTime?.message}
              {...register('endTime')}
            />
          </div>
          
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-sm text-blue-800">
              💡 <strong>Time-based pricing:</strong> If you select times, we'll calculate the exact duration. 
              Rentals less than 24 hours are charged as 1 day. Rentals over 24 hours are rounded up to the nearest day.
            </p>
          </div>

          {!isAuthenticated && (
            <>
              <Input
                label="Email"
                type="email"
                placeholder="your@email.com"
                error={errors.guestEmail?.message}
                {...register('guestEmail', {
                  required: !isAuthenticated ? 'Email is required' : false,
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
              <Input
                label="Phone"
                type="tel"
                placeholder="+234 800 000 0000"
                error={errors.guestPhone?.message}
                {...register('guestPhone', {
                  required: !isAuthenticated ? 'Phone is required' : false,
                })}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Driver License Number"
                  type="text"
                  placeholder="Enter your license number"
                  error={errors.licenseNumber?.message}
                  {...register('licenseNumber', { required: 'License number is required' })}
                />
                <Input
                  label="License Expiry Date"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  error={errors.licenseExpiry?.message}
                  {...register('licenseExpiry', {
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

              <div className="rounded-lg bg-yellow-50 p-4">
                <p className="text-sm text-yellow-800">
                  This will create a soft reservation. You'll receive an email with details. 
                  Please register or login to confirm your booking.
                </p>
              </div>
            </>
          )}

          {startDate && endDate && selectedCar && (
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex justify-between">
                <span className="text-gray-700">Duration:</span>
                <span className="font-semibold">
                  {calculateDays(startDate, endDate)} days
                </span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-gray-700">Price per day:</span>
                <span className="font-semibold">
                  {formatCurrency(selectedCar.rentalPricePerDay)}
                </span>
              </div>
              <div className="mt-2 flex justify-between border-t border-gray-200 pt-2">
                <span className="text-gray-900 font-semibold">Total Price:</span>
                <span className="text-2xl font-bold text-primary-600">
                  {formatCurrency(calculateTotalPrice())}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowBookingModal(false);
                setSelectedCar(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {isAuthenticated ? 'Confirm Booking' : 'Create Soft Reservation'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Car Details Modal */}
      {selectedCar && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedCar(null);
          }}
          title={`${selectedCar.make} ${selectedCar.model}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Image Gallery */}
            <div>
              <div className="aspect-video overflow-hidden rounded-xl bg-gray-100 flex items-center justify-center">
                <img
                  src={selectedCar.images.length > 0 ? selectedCar.images[selectedImageIndex] : '/Frame 2147226662.svg'}
                  alt={`${selectedCar.make} ${selectedCar.model}`}
                  className={`h-full w-full ${selectedCar.images.length > 0 ? 'object-cover' : 'object-contain p-8'}`}
                />
              </div>
              {selectedCar.images.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-4">
                  {selectedCar.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-video overflow-hidden rounded-lg ${
                        selectedImageIndex === index ? 'ring-2 ring-primary-600' : ''
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${selectedCar.make} ${selectedCar.model} - ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Car Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {selectedCar.year} · {selectedCar.type.charAt(0).toUpperCase() + selectedCar.type.slice(1)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    selectedCar.availability.status === 'available'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selectedCar.availability.status}
                </span>
              </div>

              <div className="text-4xl font-bold text-primary-600">
                {formatCurrency(selectedCar.rentalPricePerDay)}
                <span className="text-lg text-gray-600"> /day</span>
              </div>

              <div className="space-y-3 border-t border-gray-200 pt-4">
                {selectedCar.averageRating && selectedCar.averageRating > 0 && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{selectedCar.averageRating.toFixed(1)}</span>
                      <Rating value={Math.round(selectedCar.averageRating)} readonly size="sm" />
                      <span className="text-sm text-gray-500">({selectedCar.ratingCount} reviews)</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="h-5 w-5 text-primary-600" />
                  <span>License Plate: {selectedCar.licensePlate}</span>
                </div>
                {selectedCar.mileage && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="h-5 w-5 text-primary-600" />
                    <span>Mileage: {selectedCar.mileage.toLocaleString()} km</span>
                  </div>
                )}
                {selectedCar.weight && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="h-5 w-5 text-primary-600" />
                    <span>Weight: {selectedCar.weight.toLocaleString()} kg</span>
                  </div>
                )}
              </div>

              {selectedCar.availability.rules && (
                <div className="rounded-lg bg-blue-50 p-4">
                  <h3 className="font-semibold text-blue-900">Rental Rules</h3>
                  <p className="mt-2 text-sm text-blue-800">{selectedCar.availability.rules}</p>
                </div>
              )}
            </div>

            {/* Location Map */}
            {selectedCar.location && (selectedCar.location.address || selectedCar.location.city) && (
              <div>
                <Map
                  address={selectedCar.location.address}
                  city={selectedCar.location.city}
                  state={selectedCar.location.state}
                  lat={selectedCar.location.coordinates?.lat}
                  lng={selectedCar.location.coordinates?.lng}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 border-t border-gray-200 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setShowDetailsModal(false);
                  handleBookCar(selectedCar);
                }}
                disabled={selectedCar.availability.status !== 'available'}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Book Now
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </SidebarLayout>
  );
}

interface CarCardProps {
  car: ICar;
  onBook: (car: ICar) => void;
  onViewDetails: (car: ICar) => void;
}

function CarCard({ car, onBook, onViewDetails }: CarCardProps) {
  const imageUrl = car.images.length > 0 ? car.images[0] : '/Frame 2147226662.svg';

  const handleCardClick = () => {
    onViewDetails(car);
  };

  const handleBookClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBook(car);
  };

  return (
    <Card 
      className="h-full cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
      onClick={handleCardClick}
    >
      <div className="aspect-video overflow-hidden bg-gray-100 flex items-center justify-center">
        <img
          src={imageUrl}
          alt={`${car.make} ${car.model}`}
          className={`h-full w-full transition-transform hover:scale-105 ${
            car.images.length > 0 ? 'object-cover' : 'object-contain p-8'
          }`}
        />
      </div>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {car.make} {car.model}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {car.year} · {car.type.charAt(0).toUpperCase() + car.type.slice(1)}
            </p>
            {car.averageRating && car.averageRating > 0 && (
              <div className="mt-2 flex items-center gap-1">
                <Rating value={Math.round(car.averageRating)} readonly size="sm" showCount count={car.ratingCount} />
              </div>
            )}
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              car.availability.status === 'available'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {car.availability.status}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-primary-600">
              {formatCurrency(car.rentalPricePerDay)}
            </p>
            <p className="text-sm text-gray-600">per day</p>
          </div>
          <Button size="sm" type="button" onClick={handleBookClick}>
            <Calendar className="mr-2 h-4 w-4" />
            Book Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

