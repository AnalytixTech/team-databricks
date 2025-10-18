import { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import Button from './Button';
import Map from './Map';
import toast from 'react-hot-toast';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

interface LocationTrackerProps {
  onLocationCapture?: (location: LocationData) => void;
  showMap?: boolean;
  buttonText?: string;
  buttonVariant?: 'primary' | 'outline' | 'ghost' | 'danger';
}

export default function LocationTracker({ 
  onLocationCapture, 
  showMap = true,
  buttonText = 'Get My Location',
  buttonVariant = 'primary'
}: LocationTrackerProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Get address from coordinates
        const address = await reverseGeocode(latitude, longitude);
        
        const locationData: LocationData = {
          latitude,
          longitude,
          address,
        };

        setLocation(locationData);
        
        if (onLocationCapture) {
          onLocationCapture(locationData);
        }

        toast.success('Location captured successfully!');
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        toast.error(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={getCurrentLocation}
        isLoading={isGettingLocation}
        disabled={isGettingLocation}
        variant={buttonVariant}
        className="w-full"
      >
        {isGettingLocation ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Getting Location...
          </>
        ) : (
          <>
            <MapPin className="mr-2 h-4 w-4" />
            {buttonText}
          </>
        )}
      </Button>

      {location && (
        <div className="space-y-3">
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-900">Location Captured</p>
                <p className="text-sm text-green-700 mt-1">
                  {location.address}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          </div>

          {showMap && (
            <Map
              lat={location.latitude}
              lng={location.longitude}
              address={location.address}
            />
          )}
        </div>
      )}
    </div>
  );
}

