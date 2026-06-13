import { Package } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { formatRupiah } from '@/utils/format';
import { toast } from '@/components/ui/Toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface Product {
  id: string;
  umkm_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
  daily_stock: number | null;
  discount_percentage?: number | null;
}

interface ProductCardProps {
  product: Product;
  umkmName: string;
}

export default function ProductCard({ product, umkmName }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  
  const isOutOfStock = !product.is_available || (product.daily_stock !== null && product.daily_stock <= 0);

  const hasDiscount = !!product.discount_percentage && product.discount_percentage > 0;
  const finalPrice = hasDiscount
    ? product.price - (product.price * (product.discount_percentage! / 100))
    : product.price;

  const handleAddToCart = (e?: React.MouseEvent) => {
    e?.stopPropagation();  // Mencegah bubble ke parent (yang membuka modal)
    const success = addItem(
      {
        id: product.id,
        name: product.name,
        price: finalPrice, // Save final discounted price to cart
        quantity: 1,
        image_url: product.image_url,
        max_daily_stock: product.daily_stock,
      },
      product.umkm_id,
      umkmName
    );

    if (success) {
      toast.success(`${product.name} ditambah ke keranjang`);
    } else {
      // Alasan gagal biasanya beda UMKM (Single-Vendor Policy)
      toast.warning('Hanya bisa memesan dari satu UMKM yang sama. Kosongkan keranjang Anda terlebih dahulu.');
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      {/* Product Image */}
      <div className="aspect-square bg-surface-secondary relative overflow-hidden">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover transition-base hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20 text-content-primary">
            <Package size={40} />
          </div>
        )}
        
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Habis
            </span>
          </div>
        )}
        {hasDiscount && !isOutOfStock && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
            Diskon {product.discount_percentage}%
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col">
        <h4 className="font-bold text-content-primary line-clamp-1 text-sm sm:text-base">{product.name}</h4>
        <p className="text-[10px] sm:text-xs text-content-secondary mt-1 line-clamp-2 flex-1">
          {product.description}
        </p>
        
        <div className="mt-2 sm:mt-3 flex flex-wrap items-end justify-between gap-1">
          <div className="flex flex-col min-w-0">
            {hasDiscount && (
              <span className="text-[9px] sm:text-[10px] text-content-placeholder line-through font-medium truncate">
                {formatRupiah(product.price)}
              </span>
            )}
            <span className="font-extrabold text-primary-500 leading-tight text-sm sm:text-base truncate">
              {formatRupiah(finalPrice)}
            </span>
          </div>
          {product.daily_stock !== null && (
            <span className="text-[9px] sm:text-[10px] text-content-placeholder shrink-0 mb-0.5">
              Stok: {product.daily_stock}
            </span>
          )}
        </div>

        <Button 
          variant="primary" 
          size="sm" 
          fullWidth 
          className="mt-4"
          disabled={isOutOfStock}
          onClick={(e) => handleAddToCart(e)}
        >
          {isOutOfStock ? 'Stok Habis' : 'Beli'}
        </Button>
      </div>
    </Card>
  );
}
