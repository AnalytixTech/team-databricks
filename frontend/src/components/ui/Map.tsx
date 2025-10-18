import { MapPin, ExternalLink } from 'lucide-react';

interface MapProps {
  address?: string;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
}

/**
 * Map component using OpenStreetMap
 * Displays location information with interactive map embed
 */
export default function Map({ address, city, state, lat, lng }: MapProps) {
  if (!address && !city && !lat && !lng) {
    return null;
  }

  const fullAddress = [address, city, state, 'Nigeria']
    .filter(Boolean)
    .join(', ');

  // Default to Lagos if no coordinates provided
  const mapLat = lat || 6.5244;
  const mapLng = lng || 3.3792;
  const zoom = lat && lng ? 15 : 12;

  // OpenStreetMap URL
  const openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${mapLat}&mlon=${mapLng}#map=${zoom}/${mapLat}/${mapLng}`;

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Location</h3>
        </div>
      </div>

      {/* OpenStreetMap Embed */}
      <div className="relative h-64 bg-gray-100">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapLng - 0.01},${mapLat - 0.01},${mapLng + 0.01},${mapLat + 0.01}&layer=mapnik&marker=${mapLat},${mapLng}`}
          style={{ border: 0 }}
        />
      </div>

      {/* Address Display and Link */}
      <div className="p-4 space-y-3">
        <p className="text-gray-700">{fullAddress}</p>
        
        <a
          href={openStreetMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <ExternalLink className="h-4 w-4" />
          <span>View on OpenStreetMap</span>
        </a>
      </div>
    </div>
  );
}

