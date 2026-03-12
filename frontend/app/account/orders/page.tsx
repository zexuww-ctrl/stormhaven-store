'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function OrdersPage() {
  const { data } = useSWR('/orders/me', fetcher);
  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-black">Order History</h1>
      {data?.map((order: any) => (
        <div key={order._id} className="panel">{order.items.map((i: any) => i.name).join(', ')} - ${order.total}</div>
      ))}
    </div>
  );
}
