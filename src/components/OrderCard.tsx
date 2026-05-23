import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { formatRupiah, formatDate } from '@/utils/format';
import Card from '@/components/ui/Card';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'delivering' | 'completed' | 'cancelled' | 'rejected';

interface OrderCardProps {
  order: {
    id: string;
    total: number;
    status: OrderStatus;
    created_at: string;
    umkm: { name: string };
  };
}

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  confirmed: { label: 'Dikonfirmasi', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  processing: { label: 'Diproses', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  delivering: { label: 'Dikirim', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  completed: { label: 'Selesai', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export default function OrderCard({ order }: OrderCardProps) {
  const navigate = useNavigate();
  const config = statusConfig[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' };

  return (
    <Card 
      hoverable 
      onClick={() => navigate(`/pesanan/${order.id}`)}
      className="p-4 transition-base group"
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          {/* UMKM Name */}
          <h3 className="font-bold text-content-primary group-hover:text-primary-500 transition-colors">
            {order.umkm.name}
          </h3>
          
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-content-placeholder">
              {formatDate(order.created_at)}
            </span>
            <div className="w-1 h-1 bg-border rounded-full" />
            <span className="text-xs font-bold text-primary-500">
              {formatRupiah(order.total)}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${config.color}`}>
              {config.label}
            </span>
            <span className="text-[10px] text-content-placeholder">
              ID: {order.id.slice(0, 8)}...
            </span>
          </div>
        </div>

        {/* Arrow Icon */}
        <div className="text-content-placeholder group-hover:text-primary-500 transition-colors self-center">
          <ChevronRight size={18} />
        </div>
      </div>
    </Card>
  );
}
