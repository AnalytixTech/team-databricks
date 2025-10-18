import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Link } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import {
  Calendar,
  DollarSign,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Package,
  Car as CarIcon,
} from 'lucide-react';
import SidebarLayout from '@/components/layout/SidebarLayout.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card.tsx';
import Button from '@/components/ui/Button.tsx';
import Badge from '@/components/ui/Badge.tsx';
import Spinner from '@/components/ui/Spinner.tsx';
import { reservationService } from '@/services/reservation.service';
import { IReservation, ICar, ReservationStatus, PaymentStatus } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface DashboardStats {
  totalBookings: number;
  totalSpent: number;
  amountOwing: number;
  activeBookings: number;
  completedBookings: number;
  upcomingBookings: number;
}

export default function UserDashboard() {
  const [reservations, setReservations] = useState<IReservation[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    totalSpent: 0,
    amountOwing: 0,
    activeBookings: 0,
    completedBookings: 0,
    upcomingBookings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const data = await reservationService.getMyReservations();
      setReservations(data);
      calculateStats(data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (reservations: IReservation[]) => {
    const now = new Date();
    
    const totalBookings = reservations.length;
    
    // Calculate total spent (all paid amounts)
    const totalSpent = reservations.reduce((sum, r) => {
      if (r.paymentStatus === PaymentStatus.FULLY_PAID) {
        return sum + r.totalPrice;
      } else if (r.paymentStatus === PaymentStatus.DEPOSIT_PAID) {
        return sum + (r.depositPaid || 0);
      }
      return sum;
    }, 0);

    // Calculate amount owing (remaining balances on active reservations)
    const amountOwing = reservations.reduce((sum, r) => {
      if (r.status === ReservationStatus.CANCELLED || r.status === ReservationStatus.COMPLETED) {
        return sum;
      }
      if (r.paymentStatus === PaymentStatus.PENDING) {
        return sum + r.totalPrice;
      } else if (r.paymentStatus === PaymentStatus.DEPOSIT_PAID) {
        return sum + (r.totalPrice - (r.depositPaid || 0));
      }
      return sum;
    }, 0);

    // Active bookings (confirmed and not yet completed/cancelled)
    const activeBookings = reservations.filter(
      (r) => r.status === ReservationStatus.CONFIRMED && new Date(r.endDate) >= now
    ).length;

    // Completed bookings
    const completedBookings = reservations.filter(
      (r) => r.status === ReservationStatus.COMPLETED
    ).length;

    // Upcoming bookings (starts in the future)
    const upcomingBookings = reservations.filter(
      (r) => r.status === ReservationStatus.CONFIRMED && new Date(r.startDate) > now
    ).length;

    setStats({
      totalBookings,
      totalSpent,
      amountOwing,
      activeBookings,
      completedBookings,
      upcomingBookings,
    });
  };

  const getActiveReservations = () => {
    const now = new Date();
    return reservations.filter(
      (r) =>
        (r.status === ReservationStatus.CONFIRMED || r.status === ReservationStatus.PENDING) &&
        new Date(r.endDate) >= now
    );
  };

  const getUpcomingReservations = () => {
    const now = new Date();
    return reservations.filter(
      (r) => r.status === ReservationStatus.CONFIRMED && new Date(r.startDate) > now
    ).slice(0, 3);
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
      <div className="bg-gray-50 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
            <p className="mt-2 text-gray-600">Overview of your rental activity</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard
              icon={<Calendar className="h-6 w-6" />}
              title="Total Bookings"
              value={stats.totalBookings.toString()}
              color="blue"
              subtitle={`${stats.activeBookings} active`}
            />
            <StatCard
              icon={<DollarSign className="h-6 w-6" />}
              title="Total Spent"
              value={formatCurrency(stats.totalSpent)}
              color="green"
              subtitle="All paid amounts"
            />
            <StatCard
              icon={<AlertCircle className="h-6 w-6" />}
              title="Amount Owing"
              value={formatCurrency(stats.amountOwing)}
              color="orange"
              subtitle="Pending payments"
            />
            <StatCard
              icon={<CheckCircle className="h-6 w-6" />}
              title="Completed"
              value={stats.completedBookings.toString()}
              color="purple"
              subtitle={`${stats.upcomingBookings} upcoming`}
            />
          </div>

          {/* Active Reservations */}
          {stats.amountOwing > 0 && (
            <Card className="mb-6 border-orange-200 bg-orange-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-orange-900">Payment Reminder</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-orange-800">
                  You have <strong>{formatCurrency(stats.amountOwing)}</strong> in pending payments across your active reservations.
                </p>
                <Link to="/reservations">
                  <Button variant="outline" className="mt-4 border-orange-600 text-orange-700 hover:bg-orange-100">
                    View & Pay Reservations
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Quick Overview Section */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
            {/* Active Rentals */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Active Rentals</CardTitle>
                  <Badge variant="info">{stats.activeBookings}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {getActiveReservations().length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p>No active rentals</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getActiveReservations().slice(0, 3).map((reservation) => {
                      const car = reservation.carId as ICar;
                      const daysLeft = Math.ceil(
                        (new Date(reservation.endDate).getTime() - new Date().getTime()) / 
                        (1000 * 60 * 60 * 24)
                      );
                      
                      return (
                        <div
                          key={reservation._id}
                          className="rounded-lg border border-gray-200 p-4 hover:border-primary-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {car.make} {car.model}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {format(new Date(reservation.startDate), 'MMM dd')} -{' '}
                                {format(new Date(reservation.endDate), 'MMM dd, yyyy')}
                              </p>
                              {reservation.pickedUpAt && !reservation.returnedAt && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Clock className="h-4 w-4 text-orange-600" />
                                  <span className="text-sm font-medium text-orange-700">
                                    {daysLeft > 0 ? `${daysLeft} days left` : 'Due today!'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <Badge
                              variant={
                                reservation.paymentStatus === PaymentStatus.FULLY_PAID
                                  ? 'success'
                                  : 'warning'
                              }
                            >
                              {reservation.paymentStatus}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                    {getActiveReservations().length > 3 && (
                      <Link to="/reservations">
                        <Button variant="ghost" className="w-full mt-2">
                          View All Active Rentals ({getActiveReservations().length})
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Bookings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Upcoming Bookings</CardTitle>
                  <Badge variant="info">{stats.upcomingBookings}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {getUpcomingReservations().length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    <CarIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p>No upcoming bookings</p>
                    <Link to="/cars">
                      <Button className="mt-4">Browse Cars</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getUpcomingReservations().map((reservation) => {
                      const car = reservation.carId as ICar;
                      const daysUntil = Math.ceil(
                        (new Date(reservation.startDate).getTime() - new Date().getTime()) / 
                        (1000 * 60 * 60 * 24)
                      );
                      
                      return (
                        <div
                          key={reservation._id}
                          className="rounded-lg border border-gray-200 p-4 hover:border-primary-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {car.make} {car.model}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                Starts: {format(new Date(reservation.startDate), 'MMM dd, yyyy')}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-700">
                                  {daysUntil === 0 ? 'Today!' : `In ${daysUntil} days`}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-primary-600">
                                {formatCurrency(reservation.totalPrice)}
                              </p>
                              {reservation.paymentStatus === PaymentStatus.PENDING && (
                                <Badge variant="warning" className="mt-1">
                                  Payment Due
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link to="/cars">
                  <Button variant="outline" className="w-full">
                    <CarIcon className="mr-2 h-4 w-4" />
                    Browse Cars
                  </Button>
                </Link>
                <Link to="/reservations">
                  <Button variant="outline" className="w-full">
                    <Calendar className="mr-2 h-4 w-4" />
                    My Reservations
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="outline" className="w-full">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Update Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {reservations.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p>No booking history yet</p>
                  <Link to="/cars">
                    <Button className="mt-4">Book Your First Car</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {reservations.slice(0, 5).map((reservation) => {
                    const car = reservation.carId as ICar;
                    return (
                      <div
                        key={reservation._id}
                        className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
                            <img
                              src={car.images[0] || '/Frame 2147226662.svg'}
                              alt={`${car.make} ${car.model}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {car.make} {car.model}
                            </p>
                            <p className="text-sm text-gray-600">
                              {format(new Date(reservation.startDate), 'MMM dd')} -{' '}
                              {format(new Date(reservation.endDate), 'MMM dd, yyyy')}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={
                                  reservation.status === ReservationStatus.CONFIRMED
                                    ? 'success'
                                    : reservation.status === ReservationStatus.COMPLETED
                                    ? 'info'
                                    : 'warning'
                                }
                              >
                                {reservation.status}
                              </Badge>
                              <Badge
                                variant={
                                  reservation.paymentStatus === PaymentStatus.FULLY_PAID
                                    ? 'success'
                                    : 'warning'
                                }
                              >
                                {reservation.paymentStatus}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(reservation.totalPrice)}
                          </p>
                          {reservation.paymentStatus !== PaymentStatus.FULLY_PAID && (
                            <p className="text-sm text-orange-600 mt-1">
                              Owing: {formatCurrency(reservation.totalPrice - (reservation.depositPaid || 0))}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {reservations.length > 5 && (
                    <Link to="/reservations">
                      <Button variant="ghost" className="w-full mt-4">
                        View All Reservations ({reservations.length})
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  color: 'green' | 'blue' | 'purple' | 'orange';
  subtitle?: string;
}

function StatCard({ icon, title, value, color, subtitle }: StatCardProps) {
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
            {subtitle && (
              <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
          <div className={`rounded-lg p-3 ${colors[color]}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

