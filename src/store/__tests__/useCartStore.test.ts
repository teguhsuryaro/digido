import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '../useCartStore';

const mockItem = {
  id: 'prod-1', 
  name: 'Nasi Goreng', 
  price: 18000,
  quantity: 1, 
  image_url: null, 
  max_daily_stock: 10,
};

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('should add item to cart', () => {
    const result = useCartStore.getState().addItem(mockItem, 'umkm-1', 'Warung Sederhana');
    expect(result).toBe(true);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().umkmId).toBe('umkm-1');
  });

  it('should reject item from different UMKM (single-vendor)', () => {
    useCartStore.getState().addItem(mockItem, 'umkm-1', 'Warung A');
    const result = useCartStore.getState().addItem(
      { ...mockItem, id: 'prod-2' }, 'umkm-2', 'Warung B',
    );
    expect(result).toBe(false);
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it('should reject if quantity exceeds daily stock', () => {
    // Add 10 items (max stock)
    useCartStore.getState().addItem({ ...mockItem, quantity: 10 }, 'umkm-1', 'Warung');
    // Try adding one more
    const result = useCartStore.getState().addItem(mockItem, 'umkm-1', 'Warung');
    expect(result).toBe(false);
  });

  it('should calculate subtotal correctly', () => {
    useCartStore.getState().addItem(mockItem, 'umkm-1', 'Warung');
    useCartStore.getState().addItem(
      { ...mockItem, id: 'prod-2', name: 'Mie Goreng', price: 15000, quantity: 2 },
      'umkm-1', 'Warung',
    );
    expect(useCartStore.getState().getSubtotal()).toBe(18000 + 30000);
  });

  it('should clear cart and reset UMKM info', () => {
    useCartStore.getState().addItem(mockItem, 'umkm-1', 'Warung');
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().umkmId).toBeNull();
  });
});
