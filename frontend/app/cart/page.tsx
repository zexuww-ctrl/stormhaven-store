'use client';

import { useMemo, useState } from 'react';
import { useCart } from '@/components/CartProvider';
import Link from 'next/link';

export default function CartPage() {
  const { items, removeItem, setQuantity } = useCart();
  const [discount, setDiscount] = useState('');
  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.price * item.quantity, 0), [items]);
  const total = discount === 'STORM10' ? subtotal * 0.9 : subtotal;

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-black">Cart</h1>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item._id} className="panel flex items-center justify-between">
            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-zinc-400">${item.price} each</p>
            </div>
            <input type="number" min={1} value={item.quantity} onChange={(e) => setQuantity(item._id, Number(e.target.value))} className="w-20 rounded bg-zinc-900 p-2" />
            <button onClick={() => removeItem(item._id)} className="text-red-400">Remove</button>
          </div>
        ))}
      </div>
      <div className="panel max-w-md space-y-3">
        <input placeholder="Minecraft Username" className="w-full rounded bg-zinc-900 p-2" />
        <input value={discount} onChange={(e) => setDiscount(e.target.value.toUpperCase())} placeholder="Discount code" className="w-full rounded bg-zinc-900 p-2" />
        <p>Subtotal: ${subtotal.toFixed(2)}</p>
        <p className="text-xl font-bold text-emerald-400">Total: ${total.toFixed(2)}</p>
        <Link href="/checkout" className="inline-block rounded bg-emerald-500 px-4 py-2 font-semibold text-black">Checkout</Link>
      </div>
    </div>
  );
}
