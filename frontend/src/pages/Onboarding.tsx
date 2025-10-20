import { useState, useEffect } from 'react';
import { Car, Shield, Clock, Award, CheckCircle, Star, MapPin, Users, DollarSign } from 'lucide-react';
import Button from '@/components/ui/Button';
import LoginModal from '@/components/auth/LoginModal';
import RegisterModal from '@/components/auth/RegisterModal';
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal';
import { UserRole } from '@/types';

export default function Onboarding() {
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [registerRole, setRegisterRole] = useState<'renter' | 'owner'>('renter');
  const [howItWorksTab, setHowItWorksTab] = useState<'renters' | 'owners'>('renters');

  // Handle modal from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modal = params.get('modal');
    
    console.log('URL search:', window.location.search);
    console.log('Modal param:', modal);
    
    if (modal === 'login') {
      console.log('Opening login modal');
      setShowLoginModal(true);
      setShowRegisterModal(false);
      setShowForgotPasswordModal(false);
    } else if (modal === 'register') {
      console.log('Opening register modal');
      setShowLoginModal(false);
      setShowRegisterModal(true);
      setShowForgotPasswordModal(false);
    } else if (modal === 'forgot-password') {
      console.log('Opening forgot password modal');
      setShowLoginModal(false);
      setShowRegisterModal(false);
      setShowForgotPasswordModal(true);
    } else {
      setShowLoginModal(false);
      setShowRegisterModal(false);
      setShowForgotPasswordModal(false);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const modal = params.get('modal');
      
      if (modal === 'login') {
        setShowLoginModal(true);
        setShowRegisterModal(false);
        setShowForgotPasswordModal(false);
      } else if (modal === 'register') {
        setShowLoginModal(false);
        setShowRegisterModal(true);
        setShowForgotPasswordModal(false);
      } else if (modal === 'forgot-password') {
        setShowLoginModal(false);
        setShowRegisterModal(false);
        setShowForgotPasswordModal(true);
      } else {
        setShowLoginModal(false);
        setShowRegisterModal(false);
        setShowForgotPasswordModal(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openLoginModal = () => {
    console.log('openLoginModal called');
    setShowLoginModal(true);
    setShowRegisterModal(false);
    setShowForgotPasswordModal(false);
    window.history.pushState({}, '', '/?modal=login');
  };

  const openRegisterModal = (role: 'renter' | 'owner' = 'renter') => {
    console.log('openRegisterModal called with role:', role);
    setRegisterRole(role);
    setShowLoginModal(false);
    setShowRegisterModal(true);
    setShowForgotPasswordModal(false);
    window.history.pushState({}, '', '/?modal=register');
  };

  const openForgotPasswordModal = () => {
    console.log('openForgotPasswordModal called');
    setShowLoginModal(false);
    setShowRegisterModal(false);
    setShowForgotPasswordModal(true);
    window.history.pushState({}, '', '/?modal=forgot-password');
  };

  const closeModal = () => {
    console.log('closeModal called');
    setShowLoginModal(false);
    setShowRegisterModal(false);
    setShowForgotPasswordModal(false);
    window.history.pushState({}, '', '/');
  };

  const rentersSteps = [
    {
      step: '01',
      title: 'Sign Up & Verify',
      description: 'Create your account and verify your email in minutes. Upload your driver\'s license for instant approval.',
      icon: <CheckCircle className="h-12 w-12 text-blue-500" />,
    },
    {
      step: '02',
      title: 'Browse & Select',
      description: 'Search our extensive fleet, compare prices, and choose the perfect vehicle for your needs.',
      icon: <Car className="h-12 w-12 text-blue-500" />,
    },
    {
      step: '03',
      title: 'Book & Drive',
      description: 'Complete your booking with secure payment, pick up your car, and enjoy the ride!',
      icon: <Star className="h-12 w-12 text-blue-500" />,
    },
  ];

  const ownersSteps = [
    {
      step: '01',
      title: 'Register as Owner',
      description: 'Create your business owner account and complete verification with your business details.',
      icon: <CheckCircle className="h-12 w-12 text-orange-500" />,
    },
    {
      step: '02',
      title: 'List Your Fleet',
      description: 'Add your vehicles with photos, set pricing, and manage availability through our dashboard.',
      icon: <Car className="h-12 w-12 text-orange-500" />,
    },
    {
      step: '03',
      title: 'Earn & Manage',
      description: 'Accept bookings, track earnings, and manage your fleet with powerful analytics tools.',
      icon: <DollarSign className="h-12 w-12 text-orange-500" />,
    },
  ];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <div className="min-h-screen bg-[#272727]">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-gray-100/95 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-12">
                <img src="/Frame 2147226802.svg" alt="Fleetly" className="h-8 sm:h-10" />
                <nav className="hidden md:flex items-center gap-8">
                  <a href="#features" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                    Features
                  </a>
                  <a href="#how-it-works" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                    How It Works
                  </a>
                  <a href="#testimonials" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                    Testimonials
                  </a>
                  <a href="/about" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                    About
                  </a>
                </nav>
              </div>
              
              {/* Mobile menu button */}
              <button
                type="button"
                className="md:hidden inline-flex items-center justify-center rounded-md p-4 text-gray-700 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                )}
              </button>

              {/* Desktop auth buttons */}
              <div className="hidden md:flex items-center gap-4">
                <Button variant="ghost" onClick={openLoginModal} className="text-gray-700 hover:bg-gray-200 hover:text-gray-900">
                  Sign In
                </Button>
                <Button onClick={() => openRegisterModal('renter')} className="bg-primary-600 hover:bg-primary-700">
                  Get Started
                </Button>
              </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
              <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
                <nav className="space-y-1">
                  <a 
                    href="#features" 
                    className="block rounded-lg px-3 py-2.5 text-base font-semibold text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Features
                  </a>
                  <a 
                    href="#how-it-works" 
                    className="block rounded-lg px-3 py-2.5 text-base font-semibold text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    How It Works
                  </a>
                  <a 
                    href="#testimonials" 
                    className="block rounded-lg px-3 py-2.5 text-base font-semibold text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Testimonials
                  </a>
                  <a 
                    href="/about" 
                    className="block rounded-lg px-3 py-2.5 text-base font-semibold text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    About
                  </a>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openLoginModal();
                    }}
                    className="w-full text-center rounded-lg px-3 py-2.5 text-base font-semibold text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openRegisterModal('renter');
                    }}
                    className="w-full text-center rounded-lg bg-primary-600 px-3 py-2.5 text-base font-semibold text-white hover:bg-primary-700 transition-colors mt-2"
                  >
                    Get Started
                  </button>
                </nav>
              </div>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16 md:py-20 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:gap-12 lg:grid-cols-2 items-center">
              {/* Left Content */}
              <div className="space-y-6 sm:space-y-8">
                <div className="space-y-3 sm:space-y-4">
                  <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-center lg:text-left">
                    <span className="block sm:inline sm:whitespace-nowrap">Your Perfect Ride,</span>{' '}
                    <span className="block sm:inline bg-gradient-to-r from-blue-500 to-blue-300 bg-clip-text text-transparent">
                      Just a Click Away
                    </span>
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl leading-6 sm:leading-7 md:leading-8 text-gray-300 text-center lg:text-left">
                    Discover Nigeria's premier car rental platform. Rent premium vehicles instantly or list your fleet to earn extra income.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center lg:items-start">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto" onClick={() => openRegisterModal('renter')}>
                    Start Renting Now
                  </Button>
                  <Button variant="outline" size="lg" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto" onClick={() => openRegisterModal('owner')}>
                    List Your Cars
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 pt-6 sm:pt-8 border-t border-gray-700">
                  <div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-500">1000+</div>
                    <div className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1">Available Cars</div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-500">5000+</div>
                    <div className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1">Happy Customers</div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-500">4.9★</div>
                    <div className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1">Average Rating</div>
                  </div>
                </div>
              </div>

              {/* Right Image */}
              <div className="relative">
                <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 p-4 sm:p-6 md:p-8">
                  <img 
                    src="/Frame 2147226662.svg" 
                    alt="Premium Car" 
                    className="h-full w-full object-contain"
                  />
                  
                  {/* Car Details */}
                  <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                    <div className="rounded-lg bg-gray-800 p-2.5 sm:p-3 md:p-4 text-center">
                      <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white">272km/h</div>
                      <div className="text-xs sm:text-sm text-gray-400 mt-0.5">Top Speed</div>
                    </div>
                    <div className="rounded-lg bg-gray-800 p-2.5 sm:p-3 md:p-4 text-center">
                      <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white">3.2s</div>
                      <div className="text-xs sm:text-sm text-gray-400 mt-0.5">0-100 km/h</div>
                    </div>
                    <div className="rounded-lg bg-gray-800 p-2.5 sm:p-3 md:p-4 text-center">
                      <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white">450hp</div>
                      <div className="text-xs sm:text-sm text-gray-400 mt-0.5">Horsepower</div>
                    </div>
                    <div className="rounded-lg bg-gray-800 p-2.5 sm:p-3 md:p-4 text-center">
                      <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white">AWD</div>
                      <div className="text-xs sm:text-sm text-gray-400 mt-0.5">Drive Type</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-gray-800 py-12 sm:py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                Why Choose Fleetly?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
                Experience hassle-free car rental with verified vehicles, instant booking, and 24/7 support
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: 'Premium Fleet',
                  description: 'Choose from a wide selection of verified, well-maintained vehicles for any occasion',
                },
                {
                  title: 'Instant Booking',
                  description: 'Book your car in minutes with our streamlined verification process',
                },
                {
                  title: 'Best Prices',
                  description: 'Competitive rates with transparent pricing and no hidden fees',
                },
                {
                  title: 'Flexible Pickup',
                  description: 'Choose from multiple locations or get free delivery to your doorstep',
                },
                {
                  title: 'Trusted Community',
                  description: 'Join thousands of verified renters and business owners across Nigeria',
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group rounded-xl sm:rounded-2xl border border-gray-700 bg-gray-900 p-5 sm:p-6 md:p-8 shadow-sm transition-all hover:shadow-lg hover:border-blue-500"
                >
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section with Toggle */}
        <section id="how-it-works" className="bg-[#272727] py-12 sm:py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                How It Works
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8">
                Get on the road in three simple steps
              </p>

              {/* Toggle Buttons */}
              <div className="inline-flex rounded-lg border border-gray-700 bg-gray-800 p-1 w-full max-w-xs sm:max-w-none sm:w-auto">
                <button
                  onClick={() => setHowItWorksTab('renters')}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    howItWorksTab === 'renters'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  For Renters
                </button>
                <button
                  onClick={() => setHowItWorksTab('owners')}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    howItWorksTab === 'owners'
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  For Owners
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:gap-10 md:gap-12 md:grid-cols-3">
              {(howItWorksTab === 'renters' ? rentersSteps : ownersSteps).map((item, index) => (
                <div key={index} className="relative text-center pt-16 sm:pt-20">
                  {/* Step Number */}
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 text-5xl sm:text-6xl md:text-7xl font-bold leading-none ${
                    howItWorksTab === 'renters' ? 'text-blue-500/40' : 'text-orange-500/40'
                  } pointer-events-none select-none`}>
                    {item.step}
                  </div>
                  
                  {/* Icon Container */}
                  <div className="relative mb-4 sm:mb-6 mt-6 sm:mt-8 flex justify-center">
                    <div className={`flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full ${
                      howItWorksTab === 'renters' ? 'bg-blue-500/10' : 'bg-orange-500/10'
                    }`}>
                      {item.icon}
                    </div>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-500 py-12 sm:py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-8 sm:mb-10 max-w-2xl mx-auto">
              Join thousands of users already enjoying seamless car rentals. Sign up now and get verified in minutes!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button
                size="lg"
                variant="outline"
                className="border-white bg-white text-blue-600 hover:bg-blue-50 text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto"
                onClick={() => openRegisterModal('renter')}
              >
                Create Free Account
              </Button>
              <Button
                size="lg"
                className="bg-blue-700 hover:bg-blue-800 text-white text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto"
                onClick={openLoginModal}
              >
                Sign In
              </Button>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="bg-gray-800 py-12 sm:py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                Loved by Customers
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300">
                See what our community has to say
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
              {[
                {
                  name: 'Adebayo Johnson',
                  role: 'Business Owner',
                  rating: 5,
                  text: 'Listing my fleet on Fleetly has been a game-changer. The platform is easy to use and I\'ve seen a 40% increase in bookings!',
                },
                {
                  name: 'Sarah Williams',
                  role: 'Frequent Renter',
                  rating: 5,
                  text: 'The verification process was quick and the cars are always in excellent condition. Best car rental experience I\'ve had!',
                },
                {
                  name: 'Chioma Okafor',
                  role: 'Weekend Traveler',
                  rating: 5,
                  text: 'Love how easy it is to book. The instant verification and transparent pricing make planning trips stress-free.',
                },
              ].map((testimonial, index) => (
                <div
                  key={index}
                  className="rounded-xl sm:rounded-2xl border border-gray-700 bg-gray-900 p-5 sm:p-6 md:p-8 shadow-sm"
                >
                  <div className="mb-3 sm:mb-4 flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 leading-relaxed">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 font-bold text-base sm:text-lg">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-semibold text-white">{testimonial.name}</div>
                      <div className="text-xs sm:text-sm text-gray-400">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-700 bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
              <div className="col-span-1">
                <img src="/Frame 2147226802.svg" alt="Fleetly" className="h-8 mb-4" />
                <p className="text-sm text-gray-400">
                  Nigeria's most trusted car rental platform, connecting renters with quality vehicles.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Company</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="/about" className="hover:text-white">About Us</a></li>
                  <li><a href="#" className="hover:text-white">Careers</a></li>
                  <li><a href="/contact" className="hover:text-white">Contact</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Support</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white">Help Center</a></li>
                  <li><a href="#" className="hover:text-white">Safety</a></li>
                  <li><a href="/terms" className="hover:text-white">Terms</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Legal</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
                  <li><a href="/terms" className="hover:text-white">Terms of Service</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-12 border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
              <p>© {new Date().getFullYear()} Fleetly. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Modals */}
      {console.log('Rendering modals:', { showLoginModal, showRegisterModal, showForgotPasswordModal })}
      
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={closeModal}
          onForgotPassword={() => {
            closeModal();
            openForgotPasswordModal();
          }}
          onSwitchToRegister={() => {
            closeModal();
            openRegisterModal('renter');
          }}
        />
      )}
      
      {showRegisterModal && (
        <RegisterModal
          isOpen={showRegisterModal}
          onClose={closeModal}
          onSwitchToLogin={() => {
            closeModal();
            openLoginModal();
          }}
          defaultRole={registerRole === 'owner' ? UserRole.BUSINESS_OWNER : UserRole.USER}
        />
      )}
      
      {showForgotPasswordModal && (
        <ForgotPasswordModal
          isOpen={showForgotPasswordModal}
          onClose={closeModal}
          onBackToLogin={() => {
            closeModal();
            openLoginModal();
          }}
        />
      )}
    </>
  );
}
