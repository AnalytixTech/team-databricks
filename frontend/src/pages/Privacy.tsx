import Layout from '@/components/layout/Layout';
import { Shield } from 'lucide-react';

export default function Privacy() {
  return (
    <Layout>
      <div className="bg-[#272727] min-h-screen py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-blue-500/10 p-4">
                <Shield className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
            <p className="mt-4 text-lg text-gray-300">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Content */}
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-8 shadow-lg">
            <div className="prose prose-lg prose-invert max-w-none">
              <h2 className="text-2xl font-bold text-white">1. Information We Collect</h2>
              <p className="text-gray-300">
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-gray-300">
                <li>Name, email address, and phone number</li>
                <li>Driver's license information (number and expiry date)</li>
                <li>Payment information (processed securely by Paystack)</li>
                <li>Profile information for business owners</li>
                <li>Communication history through our chat system</li>
              </ul>

              <h2 className="mt-8 text-2xl font-bold text-white">2. How We Use Your Information</h2>
              <p className="text-gray-300">We use the information we collect to:</p>
              <ul className="list-disc space-y-2 pl-6 text-gray-300">
                <li>Provide, maintain, and improve our services</li>
                <li>Process your bookings and payments</li>
                <li>Send you confirmations, updates, and notifications</li>
                <li>Respond to your comments and questions</li>
                <li>Prevent fraud and ensure platform security</li>
                <li>Comply with legal obligations</li>
              </ul>

              <h2 className="mt-8 text-2xl font-bold text-white">3. Information Sharing</h2>
              <p className="text-gray-300">
                We share your information only in the following circumstances:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-gray-300">
                <li>With car owners when you book a vehicle</li>
                <li>With payment processors (Paystack) to process transactions</li>
                <li>With service providers who assist in operating our platform</li>
                <li>When required by law or to protect our rights</li>
                <li>With your consent or at your direction</li>
              </ul>

              <h2 className="mt-8 text-2xl font-bold text-white">4. Data Security</h2>
              <p className="text-gray-300">
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
              </p>

              <h2 className="mt-8 text-2xl font-bold text-white">5. Your Rights</h2>
              <p className="text-gray-300">You have the right to:</p>
              <ul className="list-disc space-y-2 pl-6 text-gray-300">
                <li>Access and update your personal information</li>
                <li>Request deletion of your account and data</li>
                <li>Object to processing of your personal information</li>
                <li>Withdraw consent at any time</li>
                <li>File a complaint with a supervisory authority</li>
              </ul>

              <h2 className="mt-8 text-2xl font-bold text-white">6. Cookies and Tracking</h2>
              <p className="text-gray-300">
                We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </p>

              <h2 className="mt-8 text-2xl font-bold text-white">7. Data Retention</h2>
              <p className="text-gray-300">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
              </p>

              <h2 className="mt-8 text-2xl font-bold text-white">8. Children's Privacy</h2>
              <p className="text-gray-300">
                Our service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18.
              </p>

              <h2 className="mt-8 text-2xl font-bold text-white">9. Changes to This Policy</h2>
              <p className="text-gray-300">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>

              <h2 className="mt-8 text-2xl font-bold text-white">10. Contact Us</h2>
              <p className="text-gray-300">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <ul className="list-none space-y-2 pl-0 text-gray-300">
                <li>Email: privacy@fleetly.com</li>
                <li>Phone: +234 800 000 0000</li>
                <li>Address: 123 Victoria Island, Lagos, Nigeria</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
