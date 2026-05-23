import { Package } from 'lucide-react';
import { formatRupiah } from '@/utils/format';
import Card from '@/components/ui/Card';

interface CartItemProps {
  item: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image_url: string | null;
    max_daily_stock: number | null;
  };
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const handleQtyChange = (delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      onRemove(item.id);
      return;
    }
    
    if (item.max_daily_stock !== null && newQty > item.max_daily_stock) {
      return; // Melebihi stok
    }

    onUpdateQuantity(item.id, newQty);
  };

  return (
    <Card className="p-3">
      <div className="flex gap-3">
        {/* Image */}
        <div className="w-20 h-20 bg-surface-secondary rounded-card overflow-hidden flex-shrink-0">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-content-placeholder opacity-40">
              <Package size={24} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-content-primary text-sm line-clamp-1">{item.name}</h4>
            <p className="text-primary-500 font-extrabold text-sm mt-0.5">
              {formatRupiah(item.price)}
            </p>
          </div>

          <div className="flex items-center justify-between mt-2">
            {/* Quantity Selector */}
            <div className="flex items-center gap-1 bg-surface-secondary rounded-full p-1 border border-border">
              <button 
                onClick={() => handleQtyChange(-1)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-card transition-colors text-content-secondary"
              >
                -
              </button>
              <span className="w-8 text-center text-xs font-bold text-content-primary">
                {item.quantity}
              </span>
              <button 
                onClick={() => handleQtyChange(1)}
                disabled={item.max_daily_stock !== null && item.quantity >= item.max_daily_stock}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-card transition-colors text-content-secondary disabled:opacity-30"
              >
                +
              </button>
            </div>

            {/* Remove Button */}
            <button 
              onClick={() => onRemove(item.id)}
              className="text-xs text-red-500 font-medium hover:underline"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
