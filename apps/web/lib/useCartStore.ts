import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  key: string;
  id: number;
  name: string;
  size: string;
  toppings: string[];
  price: number;
  imageUrl: string;
  quantity: number;
};

interface CartState {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity' | 'key'>) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (newItem) => {
        const size = newItem.size || 'S';
        const sortedToppings = [...newItem.toppings].sort().join(',');
        const itemKey = `${newItem.id}-${newItem.size}-${sortedToppings}`;

        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((item) => item.key === itemKey);

        if (existingIndex > -1) {
          const updated = [...currentItems];
          updated[existingIndex].quantity += 1;
          set({ items: updated });
        } else {
          set({
            items: [
              ...currentItems,
              {
                ...newItem,
                key: itemKey,
                quantity: 1,
              },
            ],
          });
        }
      },

      updateQuantity: (key: string, quantity: number) => {
        set((state) => ({
          items: state.items
            .map((item) => (item.key === key ? { ...item, quantity: Math.max(0, quantity) } : item))
            .filter((item) => item.quantity > 0),
        }));
      },

      removeFromCart: (key: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.key !== key),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalPrice: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'brewlite-cart-storage',
    }
  )
);