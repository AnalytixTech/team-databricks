import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <Layout>
      <div className="bg-[#272727] min-h-screen py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-white">Contact Us</h1>
            <p className="mt-4 text-lg text-gray-300">
              Have a question? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Contact Information */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                  <Mail className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">Email</h3>
                <p className="text-gray-300">support@fleetly.com</p>
                <p className="text-gray-300">info@fleetly.com</p>
              </div>

              <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                  <Phone className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">Phone</h3>
                <p className="text-gray-300">+234 800 000 0000</p>
                <p className="text-sm text-gray-400">Mon-Fri, 9am-6pm WAT</p>
              </div>

              <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                  <MapPin className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">Office</h3>
                <p className="text-gray-300">
                  123 Victoria Island<br />
                  Lagos, Nigeria
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-gray-700 bg-gray-800 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Input
                      label="Your Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                    <Input
                      label="Your Email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="john@example.com"
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>

                  <Input
                    label="Subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="How can we help?"
                    className="bg-gray-900 border-gray-700 text-white"
                  />

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Message
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-br from-blue-600 to-blue-500"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
