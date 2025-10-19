import { Link } from '@tanstack/react-router';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import Button from '@/components/ui/Button';
import { UserRole } from '@/types';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  // Determine home link based on authentication status
  const getHomeLink = () => {
    if (!isAuthenticated) return '/';
    if (user?.role === UserRole.BUSINESS_OWNER) return '/dashboard';
    return '/user-dashboard';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-700 bg-[#272727]/95 backdrop-blur supports-[backdrop-filter]:bg-[#272727]/90">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8">
        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link to={getHomeLink()} className="flex items-center">
            <img src="/Frame 2147226802.svg" alt="Fleetly" className="h-8" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:gap-x-8">
          {/* Only show Browse Cars to non-authenticated users and regular users */}
          {(!isAuthenticated || user?.role !== UserRole.BUSINESS_OWNER) && (
            <Link
              to="/cars"
              className="text-sm font-semibold leading-6 text-gray-300 hover:text-white transition-colors"
            >
              Browse Cars
            </Link>
          )}
        </div>

        {/* Auth buttons */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-x-2 text-sm font-semibold leading-6 text-gray-300 hover:text-white transition-colors"
              >
                <User className="h-5 w-5" />
                {user?.email}
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-700 bg-gray-800">
          <div className="space-y-2 px-4 pb-3 pt-2">
            {/* Only show Browse Cars to non-authenticated users and regular users */}
            {(!isAuthenticated || user?.role !== UserRole.BUSINESS_OWNER) && (
              <Link
                to="/cars"
                className="block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-300 hover:bg-gray-700 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse Cars
              </Link>
            )}

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-x-2 rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-300 hover:bg-gray-700 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  Profile
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-x-2 rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-300 hover:bg-gray-700 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="block rounded-lg bg-blue-600 px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-blue-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
