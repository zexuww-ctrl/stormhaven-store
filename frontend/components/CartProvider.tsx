'use client';

import { Product } from '@/lib/types';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type CartItem = Product & { quantity: number };

type CartCtx = {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
};

const Context = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('stormhaven-cart');
    if (raw) setItems(JSON.parse(raw));
  }, []);

  useEffect(() => {
    localStorage.setItem('stormhaven-cart', JSON.stringify(items));
  }, [items]);

  const value = useMemo(() => ({
    items,
    addItem: (product: Product) => setItems((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) return prev.map((item) => item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    }),
    removeItem: (id: string) => setItems((prev) => prev.filter((item) => item._id !== id)),
    setQuantity: (id: string, quantity: number) => setItems((prev) => prev.map((item) => item._id === id ? { ...item, quantity: Math.max(1, quantity) } : item)),
    clear: () => setItems([])
  }), [items]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useCart() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
