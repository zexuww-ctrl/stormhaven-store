'use client';

import { useCart } from '@/components/CartProvider';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CheckoutPage() {
  const { items, clear } = useCart();
  const [playerName, setPlayerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const router = useRouter();

  const pay = async () => {
    const { data } = await api.post('/payments/create-session', { items, playerName, paymentMethod });
    clear();
    router.push(`/order-confirmation?orderId=${data.orderId}`);
  };

  return (
    <div className="panel max-w-xl space-y-4">
      <h1 className="text-3xl font-black">Checkout</h1>
      <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Minecraft IGN" className="w-full rounded bg-zinc-900 p-3" />
      <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full rounded bg-zinc-900 p-3">
        <option value="stripe">Stripe</option>
        <option value="paypal">PayPal</option>
      </select>
      <button onClick={pay} className="rounded bg-emerald-500 px-4 py-2 font-bold text-black">Pay Securely</button>
    </div>
  );
}
