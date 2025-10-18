import { Link } from '@tanstack/react-router';
import Layout from '@/components/layout/Layout.tsx';
import { Home, Search, Car } from 'lucide-react';
import Button from '@/components/ui/Button.tsx';

export default function NotFound() {
  return (
    <Layout>
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-50 px-4 py-16">
        <div className="text-center">
          {/* 404 Illustration */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-primary-600">404</h1>
            <div className="mt-4 flex justify-center">
              <Car className="h-24 w-24 text-gray-300" />
            </div>
          </div>

          {/* Message */}
          <h2 className="mb-4 text-3xl font-bold text-gray-900">Page Not Found</h2>
          <p className="mb-8 text-lg text-gray-600">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/">
              <Button>
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </Link>
            <Link to="/cars">
              <Button variant="outline">
                <Search className="mr-2 h-4 w-4" />
                Browse Cars
              </Button>
            </Link>
          </div>

          {/* Helpful Links */}
          <div className="mt-12 border-t border-gray-200 pt-8">
            <p className="mb-4 text-sm font-medium text-gray-700">You might be looking for:</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/terms" className="text-sm text-primary-600 hover:text-primary-700">
                Terms of Service
              </Link>
              <Link to="/privacy" className="text-sm text-primary-600 hover:text-primary-700">
                Privacy Policy
              </Link>
              <Link to="/contact" className="text-sm text-primary-600 hover:text-primary-700">
                Contact Us
              </Link>
              <Link to="/about" className="text-sm text-primary-600 hover:text-primary-700">
                About Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

