'use client';

import { useSearchParams } from 'next/navigation';

export default function OrderConfirmationPage() {
  const params = useSearchParams();
  return (
    <div className="panel text-center">
      <h1 className="text-4xl font-black text-emerald-400">Order Confirmed</h1>
      <p className="mt-2">Thank you for supporting Stormhaven!</p>
      <p className="mt-1 text-sm text-zinc-400">Order ID: {params.get('orderId')}</p>
    </div>
  );
}
