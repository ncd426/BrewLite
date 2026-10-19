'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Product } from '@/lib/api';

export type CartItem = {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  total: number;
  addToCart: (product: Product, size?: string) => void;
  updateQuantity: (id: number, quantity: number, name?: string) => void;
  removeFromCart: (id: number, name?: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = window.localStorage.getItem('brewlite-cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        setItems([]);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('brewlite-cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, size = 'M') => {
    const itemName = `${product.name} (${size})`;

    setItems((current) => {
      const existing = current.find((item) => item.id === product.id && item.name === itemName);
      if (existing) {
        return current.map((item) =>
          item.id === product.id && item.name === itemName
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...current,
        {
          id: product.id,
          name: itemName,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (id: number, quantity: number, name?: string) => {
    setItems((current) =>
      current
        .map((item) => {
          const isMatch = name ? item.id === id && item.name === name : item.id === id;
          return isMatch ? { ...item, quantity: Math.max(0, quantity) } : item;
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (id: number, name?: string) => {
    setItems((current) =>
      current.filter((item) => (name ? !(item.id === id && item.name === name) : item.id !== id)),
    );
  };

  const clearCart = () => setItems([]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return context;
}
