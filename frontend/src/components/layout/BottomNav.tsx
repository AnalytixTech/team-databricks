import { Link, useLocation } from '@tanstack/react-router';
import { LayoutDashboard, Calendar, Car, BarChart3, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { UserRole } from '@/types';

export default function BottomNav() {
  const { user } = useAuthStore();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path.includes('#')) {
      // For hash-based navigation (business owner)
      const [pathname, hash] = path.split('#');
      return location.pathname === pathname && window.location.hash === `#${hash}`;
    }
    return location.pathname === path;
  };

  const handleTabChange = (tab: string) => {
    const isOnDashboard = location.pathname === '/dashboard';
    if (isOnDashboard) {
      window.location.hash = tab;
    } else {
      window.location.href = `/dashboard#${tab}`;
    }
  };

  const navItemClasses = (active: boolean) =>
    `flex flex-col items-center justify-center gap-1 py-2 px-3 transition-colors ${
      active
        ? 'text-primary-600 font-semibold'
        : 'text-gray-500 hover:text-gray-700'
    }`;

  // Regular User Navigation (4 tabs)
  if (user?.role !== UserRole.BUSINESS_OWNER) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white lg:hidden">
        <div className="grid grid-cols-4 pb-4">
          <Link to="/user-dashboard" className={navItemClasses(isActive('/user-dashboard'))}>
            <LayoutDashboard className="h-6 w-6" />
            <span className="text-xs">Dashboard</span>
          </Link>

          <Link to="/reservations" className={navItemClasses(isActive('/reservations'))}>
            <Calendar className="h-6 w-6" />
            <span className="text-xs">Reservations</span>
          </Link>

          <Link to="/cars" className={navItemClasses(isActive('/cars'))}>
            <Car className="h-6 w-6" />
            <span className="text-xs">Browse</span>
          </Link>

          <Link to="/profile" className={navItemClasses(isActive('/profile'))}>
            <User className="h-6 w-6" />
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </nav>
    );
  }

  // Business Owner Navigation (5 tabs)
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white lg:hidden">
      <div className="grid grid-cols-5 pb-4">
        <button
          onClick={() => handleTabChange('overview')}
          className={navItemClasses(isActive('/dashboard#overview') || (location.pathname === '/dashboard' && !window.location.hash))}
        >
          <LayoutDashboard className="h-6 w-6" />
          <span className="text-xs">Dashboard</span>
        </button>

        <button
          onClick={() => handleTabChange('cars')}
          className={navItemClasses(isActive('/dashboard#cars'))}
        >
          <Car className="h-6 w-6" />
          <span className="text-xs">My Cars</span>
        </button>

        <button
          onClick={() => handleTabChange('reservations')}
          className={navItemClasses(isActive('/dashboard#reservations'))}
        >
          <Calendar className="h-6 w-6" />
          <span className="text-xs">Bookings</span>
        </button>

        <button
          onClick={() => handleTabChange('reports')}
          className={navItemClasses(isActive('/dashboard#reports'))}
        >
          <BarChart3 className="h-6 w-6" />
          <span className="text-xs">Reports</span>
        </button>

        <Link to="/profile" className={navItemClasses(isActive('/profile'))}>
          <User className="h-6 w-6" />
          <span className="text-xs">Profile</span>
        </Link>
      </div>
    </nav>
  );
}

