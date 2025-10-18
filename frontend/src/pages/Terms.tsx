import Layout from '@/components/layout/Layout';
import { FileText } from 'lucide-react';

export default function Terms() {
  return (
    <Layout>
      <div className="bg-[#272727] min-h-screen py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-blue-500/10 p-4">
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white">Terms of Service</h1>
            <p className="mt-4 text-lg text-gray-300">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Content */}
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-8 shadow-lg">
            <div className="prose prose-lg prose-invert max-w-none">
              <h2 className="text-2xl font-bold text-white">1. Acceptance of Terms</h2>
              <p className="text-gray-300">
                By accessing or using Fleetly's services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
              </p>

              <h2 className="mt-8 text-2xl font-bold text-white">2. User Accounts</h2>
              <p className="text-gray-300">
                To use certain features of our platform, you must register for an account. You agree to:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-gray-300">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain the security of your account credentials</li>
                <li>Promptly notify us of any unauthorized use of your account</li>
                <li>Be responsible for all activities under your account</li>
                <li>Not impersonate any person or entity</li>
              </ul>

              <h2 className="mt-8 text-2xl font-bold text-white">3. For Car Renters</h2>
              <p className="text-gray-300">When renting a vehicle through Fleetly, you agree to:</p>
              <ul className="list-disc space-y-2 pl-6 text-gray-300">
                <li>Provide a valid driver's license and meet minimum age requirements</li>
                <li>Use the vehicle in compliance with all applicable laws</li>
                <li>Return the vehicle in the same condition as received</li>
                <li>Report any damage or issues immediately</li>
                <li>Pay all fees, including rental charges, late fees, and damage costs</li>
                <li>Not sublease or loan the vehicle to others</li>
              </ul>

              <h2 className="mt-8 text-2xl font-bold text-white">4. For Car Owners</h2>
              <p className="text-gray-300">When listing a vehicle on Fleetly, you agree to:</p>
              <ul className="list-disc space-y-2 pl-6 text-gray-300">
                <li>Own or have legal authority to rent the vehicle</li>
                <li>Provide accurate information about the vehicle's condition</li>
                <li>Maintain valid insurance coverage on the vehicle</li>
                <li>Ensure the vehicle is safe and roadworthy</li>
                <li>Honor confirmed bookings unless canceled according to our policies</li>
                <li>Respond promptly to rental inquiries and messages</li>
              </ul>

              <h2 className="mt-8 text-2xl font-bold text-white">5. Payments and Fees</h2>
              <p className="text-gray-300">
                All payments are processed securely through our payment partner, Paystack. By using our platform, you agree to:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-gray-300">
                <li>Pay all applicable fees as displayed at the time of booking</li>
                <li>Authorize us to collect payment on behalf of car owners</li>
                <li>Accept that Fleetly charges a service fee for each transaction</li>
                <li>Understand that refunds are subject to our cancellation policy</li>
              </ul>

              <h2 className="mt-8 text-2xl font-bold text-white">6. Cancellation Policy</h2>
              <p className="text-gray-300">
                Our cancellation policy varies depending on the type of reservation:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-gray-300">
                <li><strong>Soft Reservations:</strong> Hold a vehicle for 24 hours without payment. Automatically canceled if not converted to firm reservation.</li>
                <li><strong>Firm Reservations:</strong> Full payment required. Cancellations made more than 48 hours before pickup may receive a partial refund minus service fees.</li>
                <li>Cancellations within 48 hours of pickup are non-refundable</li>
                <li>No-shows result in forfeiture of all fees</li>
              </ul>

              <h2 className="mt-8 text-2xl font-bold text-white">7. Prohibited Activities</h2>
              <p className="text-gray-300">Users are prohibited from:</p>
              <ul className="list-disc space-y-2 pl-6 text-gray-300">
                <li>Using the platform for illegal purposes</li>
                <li>Providing false or misleading information</li>
                <li>Interfering with the platform's operation</li>
                <li>Attempting to circumvent payment systems</li>
                <li>Harassing or threatening other users</li>
                <li>Scraping or automated data collection</li>
              </ul>

              <h2 className="mt-8 text-2xl font-bold text-white">8. Intellectual Property</h2>
              <p className="text-gray-300">
                The Fleetly platform, including its design, graphics, code, and content, is protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express written permission.
              </p>

              <h2 className="mt-8 text-2xl font-bold text-white">9. Limitation of Liability</h2>
              <p className="text-gray-300">
                Fleetly acts as an intermediary platform connecting car owners and renters. We are not responsible for:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-gray-300">
                <li>The condition, safety, or legality of vehicles listed</li>
                <li>The accuracy of listings or user information</li>
                <li>Damages, accidents, or injuries occurring during rentals</li>
                <li>Disputes between car owners and renters</li>
                <li>Any indirect, incidental, or consequential damages</li>
              </ul>

              <h2 className="mt-8 text-2xl font-bold text-white">10. Indemnification</h2>
              <p className="text-gray-300">
                You agree to indemnify and hold Fleetly harmless from any claims, damages, or expenses arising from your use of the platform, violation of these terms, or infringement of any rights of another party.
              </p>

              <h2 className="mt-8 text-2xl font-bold text-white">11. Dispute Resolution</h2>
              <p className="text-gray-300">
                Any disputes arising from these Terms or your use of Fleetly will be governed by the laws of Nigeria. We encourage users to resolve disputes through our support team before pursuing legal action.
              </p>

              <h2 className="mt-8 text-2xl font-bold text-white">12. Termination</h2>
              <p className="text-gray-300">
                We reserve the right to suspend or terminate your account at any time for violations of these Terms, fraudulent activity, or any other reason at our discretion. Upon termination, you remain liable for all outstanding obligations.
              </p>

              <h2 className="mt-8 text-2xl font-bold text-white">13. Changes to Terms</h2>
              <p className="text-gray-300">
                We may modify these Terms at any time. We will notify users of significant changes via email or platform notification. Continued use of the platform after changes constitutes acceptance of the new Terms.
              </p>

              <h2 className="mt-8 text-2xl font-bold text-white">14. Contact Information</h2>
              <p className="text-gray-300">
                For questions about these Terms of Service, please contact us:
              </p>
              <ul className="list-none space-y-2 pl-0 text-gray-300">
                <li>Email: legal@fleetly.com</li>
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
