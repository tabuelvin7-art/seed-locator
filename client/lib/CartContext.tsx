'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { CartItem, Product } from './types';

interface CartContextType {
  items: CartItem[];
  add: (product: Product, quantity?: number) => void;
  remove: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  clear: () => void;
  count: number;
  total: number;
  // All items must be from the same seller — returns the seller id or null
  sellerId: string | null;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const sellerId = items.length > 0 ? (items[0].product.seller?._id ?? null) : null;

  const add = (product: Product, quantity = 1) => {
    setItems(prev => {
      // If cart has items from a different seller, clear it first
      if (prev.length > 0 && prev[0].product.seller?._id !== product.seller?._id) {
        return [{ product, quantity }];
      }
      const existing = prev.find(i => i.product._id === product._id);
      if (existing) {
        return prev.map(i => i.product._id === product._id
          ? { ...i, quantity: i.quantity + quantity }
          : i);
      }
      return [...prev, { product, quantity }];
    });
  };

  const remove = (productId: string) =>
    setItems(prev => prev.filter(i => i.product._id !== productId));

  const updateQty = (productId: string, quantity: number) => {
    if (quantity < 1) return remove(productId);
    setItems(prev => prev.map(i => i.product._id === productId ? { ...i, quantity } : i));
  };

  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, updateQty, clear, count, total, sellerId }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
