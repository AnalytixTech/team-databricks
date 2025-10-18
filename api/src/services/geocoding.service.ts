interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress?: string;
}

class GeocodingService {
  private apiKey = process.env.GEOCODE_API_KEY || '';

  /**
   * Get coordinates from address using geocode.maps.co API
   */
  async getCoordinatesFromAddress(address: string, city?: string, state?: string): Promise<GeocodeResult> {
    try {
      // Build full address string
      const fullAddress = [address, city, state, 'Nigeria']
        .filter(Boolean)
        .join(', ');

      console.log('🗺️ Geocoding address:', fullAddress);

      // Use geocode.maps.co API
      const url = `https://geocode.maps.co/search?q=${encodeURIComponent(fullAddress)}&api_key=${this.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const location = data[0];
        const result = {
          lat: parseFloat(location.lat),
          lng: parseFloat(location.lon),
          formattedAddress: location.display_name || fullAddress,
        };

        console.log('✅ Geocoding successful:', result);
        return result;
      }

      // If API key is not set or geocoding fails, return default Lagos coordinates
      console.warn('⚠️ Geocoding failed or API key not set, using default coordinates');
      return {
        lat: 6.5244, // Lagos, Nigeria default
        lng: 3.3792,
        formattedAddress: fullAddress,
      };
    } catch (error) {
      console.error('❌ Geocoding error:', error);
      
      // Return default coordinates on error
      return {
        lat: 6.5244,
        lng: 3.3792,
        formattedAddress: address,
      };
    }
  }
}

export default new GeocodingService();

