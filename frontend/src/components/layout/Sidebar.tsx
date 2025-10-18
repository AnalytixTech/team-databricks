import { useState, useEffect } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { 
  LayoutDashboard, 
  Calendar, 
  Car, 
  BarChart3, 
  Plus,
  CalendarPlus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { UserRole } from '@/types';
import Button from '@/components/ui/Button.tsx';

export default function Sidebar() {
  const { user } = useAuthStore();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(isCollapsed));
    // Dispatch custom event for layout to listen to
    window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { isCollapsed } }));
  }, [isCollapsed]);

  const isActive = (path: string) => location.pathname === path;

  const linkClasses = (path: string) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive(path)
        ? 'bg-primary-50 text-primary-700'
        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
    }`;

  // Regular User Sidebar
  if (user?.role !== UserRole.BUSINESS_OWNER) {
    return (
      <aside className={`hidden lg:fixed lg:left-0 lg:top-16 lg:block lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:border-r lg:border-gray-200 lg:bg-white transition-all duration-300 ${
        isCollapsed ? 'lg:w-16' : 'lg:w-64'
      }`}>
        {/* Toggle Button */}
        <div className="sticky top-0 z-10 flex justify-end border-b border-gray-200 bg-white p-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="space-y-1 p-4">
          <Link 
            to="/user-dashboard" 
            className={linkClasses('/user-dashboard')}
            title="Dashboard"
          >
            <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>Dashboard</span>}
          </Link>
          <Link 
            to="/reservations" 
            className={linkClasses('/reservations')}
            title="My Reservations"
          >
            <Calendar className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>My Reservations</span>}
          </Link>
        </nav>
      </aside>
    );
  }

  // Business Owner Sidebar
  const isOnDashboard = location.pathname === '/dashboard';
  
  const handleTabChange = (tab: string) => {
    if (isOnDashboard) {
      window.location.hash = tab;
    } else {
      window.location.href = `/dashboard#${tab}`;
    }
  };

  return (
    <aside className={`hidden lg:fixed lg:left-0 lg:top-16 lg:block lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:border-r lg:border-gray-200 lg:bg-white transition-all duration-300 ${
      isCollapsed ? 'lg:w-16' : 'lg:w-64'
    }`}>
      {/* Toggle Button */}
      <div className="sticky top-0 z-10 flex justify-end border-b border-gray-200 bg-white p-2">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="space-y-6 p-4">
        {/* Navigation Section */}
        <div>
          {!isCollapsed && (
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Navigation
            </h3>
          )}
          <div className="space-y-1">
            <button
              onClick={() => handleTabChange('overview')}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
              title="Dashboard Overview"
            >
              <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>Dashboard Overview</span>}
            </button>
            <button
              onClick={() => handleTabChange('cars')}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
              title="My Cars"
            >
              <Car className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>My Cars</span>}
            </button>
            <button
              onClick={() => handleTabChange('reservations')}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
              title="Reservations"
            >
              <Calendar className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>Reservations</span>}
            </button>
            <button
              onClick={() => handleTabChange('reports')}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
              title="Analytics & Reports"
            >
              <BarChart3 className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>Analytics & Reports</span>}
            </button>
          </div>
        </div>

        {/* Quick Actions Section */}
        {!isCollapsed && (
          <div>
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  handleTabChange('cars');
                  setTimeout(() => {
                    const addCarBtn = document.querySelector('[data-action="add-car"]') as HTMLButtonElement;
                    addCarBtn?.click();
                  }, 100);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Car
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  handleTabChange('reservations');
                  setTimeout(() => {
                    const createReservationBtn = document.querySelector('[data-action="create-reservation"]') as HTMLButtonElement;
                    createReservationBtn?.click();
                  }, 100);
                }}
              >
                <CalendarPlus className="mr-2 h-4 w-4" />
                Create Reservation
              </Button>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}

