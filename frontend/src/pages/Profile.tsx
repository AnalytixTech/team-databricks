import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { User, CreditCard, FileText, Save, Lock, Edit, X } from 'lucide-react';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { userService } from '@/services/user.service';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { UserRole } from '@/types';

interface ProfileForm {
  phone: string;
  businessName?: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  licenseState: string;
}

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileForm>();

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    watch: watchPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordForm>();

  const newPassword = watchPassword('newPassword');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await userService.getProfile();
      setUser(data);
      
      // Set form values
      if (data.phone) setValue('phone', data.phone);
      if (data.profile?.businessName) setValue('businessName', data.profile.businessName);
      if (data.profile?.driverLicense) {
        setValue('licenseNumber', data.profile.driverLicense.number);
        setValue('licenseExpiryDate', data.profile.driverLicense.expiryDate.split('T')[0]);
        setValue('licenseState', data.profile.driverLicense.state);
      }
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    setIsSaving(true);
    try {
      const updatedUser = await userService.updateProfile({
        phone: data.phone,
        businessName: data.businessName,
        driverLicense: data.licenseNumber
          ? {
              number: data.licenseNumber,
              expiryDate: data.licenseExpiryDate,
              state: data.licenseState,
            }
          : undefined,
      });
      setUser(updatedUser);
      setIsEditingProfile(false); // Reset edit mode after save
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePaymentMethod = async (id: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    try {
      await userService.removePaymentMethod(id);
      toast.success('Payment method removed');
      loadProfile();
    } catch (error) {
      toast.error('Failed to remove payment method');
    }
  };

  const handleChangePassword = async (data: ChangePasswordForm) => {
    setIsChangingPassword(true);
    try {
      await authService.changePassword(data.currentPassword, data.newPassword);
      toast.success('Password changed successfully!');
      resetPassword();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      </SidebarLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarLayout>
      <div className="bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 md:py-16 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Manage your account information</p>
          </div>

          <div className="space-y-6">
            {/* Account Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary-600" />
                  <CardTitle>Account Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Role</label>
                    <div className="mt-1">
                      <Badge variant="info">{user.role}</Badge>
                    </div>
                  </div>
                  {user.role === UserRole.BUSINESS_OWNER && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Business Name</label>
                      <p className="mt-1 text-gray-900">{user.profile?.businessName || 'Not set'}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact & Business/License Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary-600" />
                    <CardTitle>
                      {user.role === UserRole.BUSINESS_OWNER 
                        ? 'Contact & Business Information' 
                        : 'Contact & License Information'}
                    </CardTitle>
                  </div>
                  {!isEditingProfile && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditingProfile(true)}
                    >
                      <Edit className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!isEditingProfile ? (
                  // Read-only view
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Phone Number</label>
                      <p className="mt-1 text-gray-900">{user.phone || 'Not set'}</p>
                    </div>
                    
                    {user.role === UserRole.USER && user.profile?.driverLicense && (
                      <>
                        <div>
                          <label className="text-sm font-medium text-gray-700">License Number</label>
                          <p className="mt-1 text-gray-900">{user.profile.driverLicense.number}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Expiry Date</label>
                            <p className="mt-1 text-gray-900">
                              {format(new Date(user.profile.driverLicense.expiryDate), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">State</label>
                            <p className="mt-1 text-gray-900">{user.profile.driverLicense.state}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  // Editable form
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <Input
                      label="Phone Number"
                      type="tel"
                      error={errors.phone?.message}
                      {...register('phone')}
                    />

                    {/* Business Name for Business Owners */}
                    {user.role === UserRole.BUSINESS_OWNER && (
                      <Input
                        label="Business Name"
                        error={errors.businessName?.message}
                        {...register('businessName', {
                          required: 'Business name is required',
                        })}
                      />
                    )}

                    {/* Driver License for Regular Users */}
                    {user.role === UserRole.USER && (
                      <div className="border-t pt-6">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">
                          Driver License Information
                        </h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Input
                            label="License Number"
                            error={errors.licenseNumber?.message}
                            {...register('licenseNumber')}
                          />
                          <Input
                            label="Expiry Date"
                            type="date"
                            error={errors.licenseExpiryDate?.message}
                            {...register('licenseExpiryDate')}
                          />
                          <Input
                            label="State"
                            error={errors.licenseState?.message}
                            {...register('licenseState')}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditingProfile(false);
                          // Reset form values to original
                          if (user.phone) setValue('phone', user.phone);
                          if (user.profile?.businessName) setValue('businessName', user.profile.businessName);
                          if (user.profile?.driverLicense) {
                            setValue('licenseNumber', user.profile.driverLicense.number);
                            setValue('licenseExpiryDate', user.profile.driverLicense.expiryDate.split('T')[0]);
                            setValue('licenseState', user.profile.driverLicense.state);
                          }
                        }}
                      >
                        <X className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Cancel</span>
                      </Button>
                      <Button type="submit" isLoading={isSaving} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Change Password */}
            {user.googleId ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary-600" />
                    <CardTitle>Password</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    You're signed in with Google. Password management is not available for OAuth accounts.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary-600" />
                    <CardTitle>Change Password</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitPassword(handleChangePassword)} className="space-y-4">
                    <Input
                      label="Current Password"
                      type="password"
                      autoComplete="current-password"
                      error={passwordErrors.currentPassword?.message}
                      {...registerPassword('currentPassword', {
                        required: 'Current password is required',
                      })}
                    />

                    <Input
                      label="New Password"
                      type="password"
                      autoComplete="new-password"
                      error={passwordErrors.newPassword?.message}
                      {...registerPassword('newPassword', {
                        required: 'New password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters',
                        },
                      })}
                    />

                    <Input
                      label="Confirm New Password"
                      type="password"
                      autoComplete="new-password"
                      error={passwordErrors.confirmPassword?.message}
                      {...registerPassword('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: (value) =>
                          value === newPassword || 'Passwords do not match',
                      })}
                    />

                    <Button
                      type="submit"
                      disabled={isChangingPassword}
                      className="w-full"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary-600" />
                  <CardTitle>Saved Payment Methods</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {user.profile?.savedPaymentMethods?.length === 0 ? (
                  <p className="text-gray-600">No saved payment methods</p>
                ) : (
                  <div className="space-y-3">
                    {user.profile?.savedPaymentMethods?.map((method) => (
                      <div
                        key={method._id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {method.type} ending in {method.last4}
                            </p>
                            <p className="text-sm text-gray-600">
                              Expires {method.expiryMonth}/{method.expiryYear}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemovePaymentMethod(method._id!)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

