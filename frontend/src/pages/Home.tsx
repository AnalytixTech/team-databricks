import { Link } from '@tanstack/react-router';
import { Car, Shield, CreditCard, ArrowRight, Search, Calendar, Key, Settings, Tag, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import Rating from '@/components/ui/Rating';
import Layout from '@/components/layout/Layout';
import { carService } from '@/services/car.service';
import { ICar } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'renters' | 'owners'>('renters');
  const [popularCars, setPopularCars] = useState<ICar[]>([]);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const response = await carService.getRecommendations();
      setPopularCars(response.popular.slice(0, 3)); // Top 3 popular cars
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  return (
    <Layout>
      {/* Hero Section - Dark Theme */}
      <section className="relative bg-gray-900 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Left Content */}
            <div className="flex flex-col justify-center text-center lg:text-left">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
                One Platform.{' '}
                <span className="text-primary-400">Two Experience</span>
              </h1>
              <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg leading-6 sm:leading-7 md:leading-8 text-gray-300">
                Fleetly connects renters with reliable vehicles and empowers fleet owners 
                with powerful management tools. Whether you're looking to rent your dream 
                car or manage your fleet efficiently, we've got you covered.
              </p>
              <div className="mt-6 sm:mt-8 md:mt-10 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center lg:justify-start">
                <Link to="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started
                  </Button>
                </Link>
                <Link to="/cars" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto border-gray-600 text-white hover:bg-gray-800">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Content - Car Showcase */}
            <div className="relative flex flex-col items-center justify-center">
              {/* Speedometer graphic */}
              <div className="relative w-full max-w-md">
                <div className="aspect-square overflow-hidden rounded-full bg-gradient-to-br from-primary-600/20 to-primary-800/20 flex items-center justify-center">
                  <img
                    src="/Frame 2147226662.svg"
                    alt="Premium Car"
                    className="w-4/5 h-4/5 object-contain"
                  />
                </div>
                
                {/* Car Stats */}
                <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-2 sm:gap-4 text-center">
                  <div className="bg-gray-800/50 rounded-lg p-2.5 sm:p-3 backdrop-blur">
                    <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-primary-400">200km/h</p>
                    <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Highest Speed</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2.5 sm:p-3 backdrop-blur">
                    <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-primary-400">160km</p>
                    <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Battery Range</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2.5 sm:p-3 backdrop-blur">
                    <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-primary-400">4 hours</p>
                    <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Charging Time</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2.5 sm:p-3 backdrop-blur">
                    <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-primary-400">1696kg</p>
                    <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Weight</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-800 py-12 sm:py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
              How It Works
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-gray-300 max-w-2xl mx-auto">
              Simple steps for both renters and owners to get started on Fleetly
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="mt-8 sm:mt-10 md:mt-12 flex justify-center">
            <div className="inline-flex rounded-lg bg-gray-900 p-1 w-full max-w-xs sm:max-w-none sm:w-auto">
              <button
                onClick={() => setActiveTab('renters')}
                className={`flex-1 sm:flex-none px-5 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                  activeTab === 'renters'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Renters
              </button>
              <button
                onClick={() => setActiveTab('owners')}
                className={`flex-1 sm:flex-none px-5 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                  activeTab === 'owners'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Owners
              </button>
            </div>
          </div>

          {/* Steps Grid */}
          <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
            {activeTab === 'renters' ? (
              <>
                <StepCard
                  icon={<Search className="h-8 w-8 text-gray-900" />}
                  title="Search"
                  description="Easily browse through a wide selection of vehicles based on your location, car type, or budget."
                />
                <StepCard
                  icon={<Calendar className="h-8 w-8 text-gray-900" />}
                  title="Reserve & Pay"
                  description="Once you've found the right car, select your preferred dates and instantly secure it with a safe and seamless payment process."
                />
                <StepCard
                  icon={<Key className="h-8 w-8 text-gray-900" />}
                  title="Pick Up"
                  description="Collect your car from the designated pickup location and enjoy your trip with confidence."
                />
                <StepCard
                  icon={<Settings className="h-8 w-8 text-gray-900" />}
                  title="Manage Bookings"
                  description="Keep full control of your reservations directly from the app. Easily view upcoming rentals, make adjustments if your plans change."
                />
              </>
            ) : (
              <>
                <StepCard
                  icon={<Car className="h-8 w-8 text-gray-900" />}
                  title="List Your Cars"
                  description="Add your vehicles to the platform with details, photos, and pricing to attract renters."
                />
                <StepCard
                  icon={<Calendar className="h-8 w-8 text-gray-900" />}
                  title="Manage Bookings"
                  description="Track all reservations in real-time through your dashboard and stay organized."
                />
                <StepCard
                  icon={<CreditCard className="h-8 w-8 text-gray-900" />}
                  title="Receive Payments"
                  description="Get paid securely and on time for each rental with our integrated payment system."
                />
                <StepCard
                  icon={<Settings className="h-8 w-8 text-gray-900" />}
                  title="Monitor Analytics"
                  description="Access detailed reports on revenue, bookings, and performance to optimize your fleet."
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-gray-900 py-12 sm:py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
              Why Choose Us
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-gray-300 max-w-3xl mx-auto">
              We make car rentals effortless for renters and profitable for owners, all in one seamless platform
            </p>
          </div>

          <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
            <WhyChooseCard
              icon={<Tag className="h-10 w-10 text-white" />}
              title="Transparent & Competitive Pricing"
              description="We believe in fairness. With Fleetly, renters enjoy the best prices on quality vehicles, while owners set competitive rates that reflect true market value. No hidden fees, no last-minute surprises—just clear, upfront costs."
              variant="blue"
            />
            <WhyChooseCard
              icon={<Car className="h-10 w-10 text-white" />}
              title="Seamless Dual Experience"
              description="Fleetly is built for both sides of the rental ecosystem. Renters get a mobile app that makes finding, reserving, and paying for cars quick and effortless. Owners get a powerful web dashboard to manage fleets, track bookings, and monitor earnings in real time."
              variant="dark"
            />
            <WhyChooseCard
              icon={<Shield className="h-10 w-10 text-white" />}
              title="Secure & Reliable Platform"
              description="Trust and safety are at the heart of Fleetly. Every transaction is protected with secure payment gateways, while user verification helps prevent fraud and misuse. Owners can confidently list vehicles knowing their earnings are protected, and renters can book with peace of mind."
              variant="dark"
            />
          </div>
        </div>
      </section>

      {/* Popular Cars Section */}
      {popularCars.length > 0 && (
        <section className="bg-gray-50 py-12 sm:py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
                <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary-600" />
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
                  Popular Cars
                </h2>
              </div>
              <p className="mt-2 sm:mt-4 text-sm sm:text-base md:text-lg text-gray-600">
                Most booked vehicles by our community
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {popularCars.map((car) => (
                <Link key={car._id} to="/cars">
                  <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
                    <div className="aspect-video overflow-hidden bg-gray-100">
                      <img
                        src={car.images[0] || '/Frame 2147226662.svg'}
                        alt={`${car.make} ${car.model}`}
                        className={`h-full w-full ${car.images.length > 0 ? 'object-cover' : 'object-contain p-8'}`}
                      />
                    </div>
                    <CardContent className="p-4 sm:p-5 md:p-6">
                      <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">
                        {car.make} {car.model}
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm text-gray-600">
                        {car.year} · {car.type.charAt(0).toUpperCase() + car.type.slice(1)}
                      </p>
                      {car.averageRating && car.averageRating > 0 && (
                        <div className="mt-2 flex items-center gap-1">
                          <Rating value={Math.round(car.averageRating)} readonly size="sm" showCount count={car.ratingCount} />
                        </div>
                      )}
                      <div className="mt-3 sm:mt-4 flex items-center justify-between">
                        <div>
                          <p className="text-lg sm:text-xl md:text-2xl font-bold text-primary-600">
                            {formatCurrency(car.rentalPricePerDay)}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">per day</p>
                        </div>
                        {(car as any).bookingCount && (
                          <div className="rounded-full bg-primary-100 px-2 sm:px-3 py-1">
                            <p className="text-xs font-medium text-primary-700">
                              {(car as any).bookingCount} bookings
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link to="/cars">
                <Button size="lg">
                  View All Cars
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-primary-600">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
              Ready to get started?
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-primary-100">
              Join thousands of satisfied customers and rent your car today
            </p>
            <div className="mt-6 sm:mt-8">
              <Link to="/register">
                <Button
                  size="lg"
                  className="bg-white text-primary-600 hover:bg-gray-100 w-full sm:w-auto"
                >
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

interface StepCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function StepCard({ icon, title, description }: StepCardProps) {
  return (
    <div className="bg-gray-700/50 rounded-xl p-5 sm:p-6 md:p-8 backdrop-blur">
      <div className="flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-yellow-400 mb-3 sm:mb-4">
        {icon}
      </div>
      <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-xs sm:text-sm md:text-base text-gray-300 leading-relaxed">{description}</p>
    </div>
  );
}

interface WhyChooseCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  variant: 'blue' | 'dark';
}

function WhyChooseCard({ icon, title, description, variant }: WhyChooseCardProps) {
  const bgColor = variant === 'blue' ? 'bg-primary-600' : 'bg-gray-800/80';
  
  return (
    <div className={`${bgColor} rounded-xl p-5 sm:p-6 md:p-8 backdrop-blur`}>
      <div className="flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-primary-500/30 mb-3 sm:mb-4 md:mb-6">
        {icon}
      </div>
      <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-2 sm:mb-3 md:mb-4">{title}</h3>
      <p className="text-xs sm:text-sm md:text-base text-gray-200 leading-relaxed">{description}</p>
    </div>
  );
}

