'use client';

interface Props {
  lat: number;
  lng: number;
  name: string;
}

export default function SellerMap({ lat, lng, name }: Props) {
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&q=${lat},${lng}&zoom=14`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="rounded-xl overflow-hidden border">
      {process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ? (
        <iframe
          title={`Map for ${name}`}
          src={mapUrl}
          width="100%"
          height="220"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="bg-gray-100 h-40 flex items-center justify-center text-gray-400 text-sm">
          📍 Map preview (add NEXT_PUBLIC_GOOGLE_MAPS_KEY to .env.local)
        </div>
      )}
      <div className="p-3 bg-white">
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
          className="text-sm text-green-600 font-medium hover:underline">
          🗺️ Get Directions to {name}
        </a>
      </div>
    </div>
  );
}
