import Layout from '@/components/layout/Layout';
import { Users, Shield, Zap, Heart, Target, Award } from 'lucide-react';

export default function About() {
  const values = [
    {
      icon: Shield,
      title: 'Trust & Safety',
      description: 'We prioritize the safety and security of all our users through verified accounts and secure payments.',
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Leveraging cutting-edge technology to provide the best car rental experience.',
    },
    {
      icon: Heart,
      title: 'Customer First',
      description: 'Our users are at the heart of everything we do, from features to support.',
    },
  ];

  const stats = [
    { label: 'Active Users', value: '10,000+' },
    { label: 'Cars Listed', value: '5,000+' },
    { label: 'Successful Rentals', value: '50,000+' },
    { label: 'Cities Covered', value: '25+' },
  ];

  return (
    <Layout>
      <div className="bg-[#272727] min-h-screen">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 py-20 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold sm:text-5xl">About Fleetly</h1>
              <p className="mt-6 text-xl text-blue-100">
                Connecting car owners with renters across Nigeria
              </p>
            </div>
          </div>
        </div>

        {/* Mission Section */}
        <div className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="mb-4 inline-flex rounded-full bg-blue-500/10 p-3">
                  <Target className="h-8 w-8 text-blue-500" />
                </div>
                <h2 className="text-3xl font-bold text-white">Our Mission</h2>
                <p className="mt-4 text-lg text-gray-300">
                  To revolutionize car rental in Nigeria by creating a trusted platform that empowers car owners to monetize their vehicles and provides renters with affordable, convenient access to quality transportation.
                </p>
                <p className="mt-4 text-lg text-gray-300">
                  We believe in the sharing economy and the power of technology to connect people, reduce costs, and maximize the utilization of existing resources.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-700 bg-gray-800 p-8 shadow-lg">
                <h3 className="mb-6 text-2xl font-bold text-white">Our Story</h3>
                <p className="text-gray-300">
                  Founded in 2025, Fleetly was born from a simple observation: many car owners have vehicles sitting idle while many people need short-term transportation solutions.
                </p>
                <p className="mt-4 text-gray-300">
                  We set out to bridge this gap by creating a platform that makes car rental as easy as booking a ride. With features like driver ratings, real-time chat, and secure payments, we've built a trusted community of car owners and renters.
                </p>
                <p className="mt-4 text-gray-300">
                  Today, we're proud to serve thousands of users across Nigeria, facilitating tens of thousands of successful rentals and helping car owners earn extra income.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-gray-800 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white">Our Values</h2>
              <p className="mt-4 text-lg text-gray-300">
                The principles that guide everything we do
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              {values.map((value) => (
                <div key={value.title} className="rounded-2xl border border-gray-700 bg-gray-900 p-8 text-center transition-all hover:border-blue-500">
                  <div className="mb-4 flex justify-center">
                    <div className="rounded-full bg-blue-500/10 p-4">
                      <value.icon className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-white">{value.title}</h3>
                  <p className="text-gray-400">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 px-8 py-12 text-white">
              <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-4xl font-bold">{stat.value}</div>
                    <div className="mt-2 text-blue-100">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-gray-800 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-blue-500/10 p-4">
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white">Built by Team-Databricks</h2>
              <p className="mt-4 text-lg text-gray-300">
                A passionate team dedicated to transforming car rental in Nigeria
              </p>
            </div>

            <div className="mt-12 text-center">
              <div className="inline-flex rounded-full bg-orange-500/10 border border-orange-500/20 px-6 py-3">
                <Award className="mr-2 h-6 w-6 text-orange-500" />
                <span className="font-semibold text-orange-500">
                  Winner - QAC Hackathon 2025
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
