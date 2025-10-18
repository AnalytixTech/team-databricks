import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Building2, Loader } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { userService } from '@/services/user.service';

interface BusinessNameForm {
  businessName: string;
}

interface BusinessNameModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export default function BusinessNameModal({ isOpen, onComplete }: BusinessNameModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessNameForm>();

  const handleBusinessNameSubmit = async (data: BusinessNameForm) => {
    setIsSubmitting(true);
    try {
      await userService.updateProfile({ businessName: data.businessName });
      toast.success('Business name saved successfully!');
      onComplete();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save business name');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="" showCloseButton={false}>
      <div className="mb-6 flex justify-center">
        <img src="/Frame 2147226802.svg" alt="Fleetly" className="h-10" />
      </div>
      
      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <Building2 className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome, Business Owner!</h2>
        <p className="mt-2 text-gray-600">
          Please provide your business name to complete your registration
        </p>
      </div>

      <form onSubmit={handleSubmit(handleBusinessNameSubmit)} className="space-y-6">
        <Input
          label="Business Name"
          type="text"
          placeholder="e.g., Ace Car Rentals Ltd."
          error={errors.businessName?.message}
          {...register('businessName', {
            required: 'Business name is required',
            minLength: {
              value: 2,
              message: 'Business name must be at least 2 characters',
            },
          })}
        />

        <Button
          type="submit"
          className="w-full bg-orange-600 hover:bg-orange-700"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Complete Registration'
          )}
        </Button>
      </form>
    </Modal>
  );
}

