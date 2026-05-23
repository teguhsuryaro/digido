import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface CartItem {
  id: string;           // product ID
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
  max_daily_stock: number | null; // Batas stok harian dari mitra
}

interface CartState {
  // State
  items: CartItem[];
  umkmId: string | null;     // ID UMKM pemilik item di keranjang
  umkmName: string | null;   // Nama UMKM (untuk tampilan)

  // Actions
  addItem: (item: CartItem, umkmId: string, umkmName: string) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Getters
  getItemCount: () => number;
  getSubtotal: () => number;
  getItemById: (productId: string) => CartItem | undefined;
}

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        items: [],
        umkmId: null,
        umkmName: null,

        // Actions
        addItem: (item, umkmId, umkmName) => {
          const state = get();

          // ===== VALIDASI SINGLE-VENDOR =====
          // Jika keranjang sudah berisi item dari UMKM lain, TOLAK
          if (state.umkmId && state.umkmId !== umkmId) {
            // Return false → caller harus menampilkan soft alert
            return false;
          }

          // Cek apakah item sudah ada di keranjang
          const existingItem = state.items.find((i) => i.id === item.id);

          if (existingItem) {
            // Validasi stok harian
            const newQty = existingItem.quantity + item.quantity;
            if (
              existingItem.max_daily_stock !== null &&
              newQty > existingItem.max_daily_stock
            ) {
              return false; // Melebihi stok harian
            }

            // Update quantity
            set(
              {
                items: state.items.map((i) =>
                  i.id === item.id ? { ...i, quantity: newQty } : i,
                ),
              },
              false,
              'addItem/updateQty',
            );
          } else {
            // Validasi stok harian untuk item baru
            if (
              item.max_daily_stock !== null &&
              item.quantity > item.max_daily_stock
            ) {
              return false;
            }

            // Tambah item baru
            set(
              {
                items: [...state.items, item],
                umkmId,
                umkmName,
              },
              false,
              'addItem/new',
            );
          }

          return true; // Berhasil ditambahkan
        },

        removeItem: (productId) => {
          const state = get();
          const newItems = state.items.filter((i) => i.id !== productId);

          set(
            {
              items: newItems,
              // Reset UMKM info jika keranjang kosong
              umkmId: newItems.length === 0 ? null : state.umkmId,
              umkmName: newItems.length === 0 ? null : state.umkmName,
            },
            false,
            'removeItem',
          );
        },

        updateQuantity: (productId, quantity) => {
          if (quantity <= 0) {
            get().removeItem(productId);
            return;
          }

          set(
            (state) => ({
              items: state.items.map((i) =>
                i.id === productId ? { ...i, quantity } : i,
              ),
            }),
            false,
            'updateQuantity',
          );
        },

        clearCart: () =>
          set(
            { items: [], umkmId: null, umkmName: null },
            false,
            'clearCart',
          ),

        // Getters
        getItemCount: () =>
          get().items.reduce((sum, item) => sum + item.quantity, 0),

        getSubtotal: () =>
          get().items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
          ),

        getItemById: (productId) =>
          get().items.find((i) => i.id === productId),
      }),
      {
        name: 'digido-cart', // Key di localStorage
        // Hanya persist items, umkmId, dan umkmName (bukan functions)
        partialize: (state) => ({
          items: state.items,
          umkmId: state.umkmId,
          umkmName: state.umkmName,
        }),
      },
    ),
    { name: 'CartStore' },
  ),
);
