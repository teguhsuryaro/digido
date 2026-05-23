import { useNavigate } from 'react-router-dom';
import { Star, Truck, Gift, ChevronRight, MapPin } from 'lucide-react';
import Card from '@/components/ui/Card';
import { useLocationStore } from '@/store/useLocationStore';
import { calculateDistance, formatDistance } from '@/utils/distance';

interface UMKMCardProps {
  umkm: {
    id: string;
    name: string;
    business_type: string;
    description?: string;
    is_open: boolean;
    avg_rating: number;
    review_count: number;
    has_delivery: boolean;
    is_free_delivery: boolean;
    photo_url?: string | null;
    is_unggulan?: boolean;
    latitude?: number;
    longitude?: number;
  };
}

export default function UMKMCard({ umkm }: UMKMCardProps) {
  const navigate = useNavigate();

  // Generate inisial dari nama toko
  const initials = umkm.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Generate warna avatar berdasarkan nama (deterministik)
  const colors = [
    'from-blue-500 to-blue-600',
    'from-orange-500 to-orange-600',
    'from-green-500 to-green-600',
    'from-purple-500 to-purple-600',
    'from-pink-500 to-pink-600',
    'from-teal-500 to-teal-600',
    'from-indigo-500 to-indigo-600',
    'from-amber-500 to-amber-600',
  ];
  const colorIndex = umkm.name.charCodeAt(0) % colors.length;
  const avatarGradient = colors[colorIndex];

  const userLocation = useLocationStore((s) => s.userLocation);

  let distanceText = null;
  if (userLocation && umkm.latitude && umkm.longitude) {
    const dist = calculateDistance(umkm.latitude, umkm.longitude, userLocation.lat, userLocation.lng);
    distanceText = formatDistance(dist);
  }

  return (
    <Card 
      hoverable 
      onClick={() => navigate(`/umkm/${umkm.id}`)}
      className="p-4 transition-all duration-200 group hover:border-primary-500/30"
    >
      <div className="flex items-start gap-4">
        {/* Avatar / Foto Toko */}
        <div className={`
          w-14 h-14 rounded-xl overflow-hidden
          ${!umkm.photo_url ? `bg-gradient-to-br ${avatarGradient}` : ''}
          flex items-center justify-center text-white font-bold text-lg
          shrink-0 shadow-sm group-hover:scale-105 transition-transform
        `}>
          {umkm.photo_url ? (
            <img
              src={umkm.photo_url}
              alt={umkm.name}
              className="w-full h-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title & Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-content-primary group-hover:text-primary-500 transition-colors truncate">
              {umkm.name}
            </h3>
            {umkm.is_unggulan && (
              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 flex items-center gap-0.5">
                ★ Premium
              </span>
            )}
            <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              umkm.is_open 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {umkm.is_open ? 'Buka' : 'Tutup'}
            </span>
          </div>
          
          <p className="text-xs text-content-secondary mt-0.5">
            {umkm.business_type}
          </p>

          {/* Description (jika ada) — hanya 1 baris */}
          {umkm.description && (
            <p className="text-xs text-content-placeholder mt-1 line-clamp-1">
              {umkm.description}
            </p>
          )}

          {/* Rating + Badges */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <Star size={12} className="text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-bold text-content-primary">
                {umkm.avg_rating.toFixed(1)}
              </span>
              <span className="text-[10px] text-content-placeholder">
                ({umkm.review_count})
              </span>
            </div>

            {/* Jarak */}
            {distanceText && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-surface-secondary text-content-secondary px-2 py-0.5 rounded-full border border-border">
                <MapPin size={10} />
                {distanceText}
              </span>
            )}

            {/* Delivery Badge */}
            {umkm.has_delivery && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-800">
                <Truck size={10} />
                Delivery
              </span>
            )}

            {/* Free Delivery Badge */}
            {umkm.is_free_delivery && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 px-2 py-0.5 rounded-full border border-orange-100 dark:border-orange-800">
                <Gift size={10} />
                Gratis Ongkir
              </span>
            )}
          </div>
        </div>

        {/* Arrow Icon */}
        <div className="text-content-placeholder group-hover:text-primary-500 transition-colors self-center shrink-0">
          <ChevronRight size={20} />
        </div>
      </div>
    </Card>
  );
}
