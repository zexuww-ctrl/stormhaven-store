'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function AdminPage() {
  const { data } = useSWR('/admin/stats', fetcher);
  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-black">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel"><p>Revenue</p><p className="text-2xl text-emerald-400">${data?.revenue || 0}</p></div>
        <div className="panel"><p>Orders</p><p className="text-2xl">{data?.orders || 0}</p></div>
        <div className="panel"><p>Users</p><p className="text-2xl">{data?.users || 0}</p></div>
      </div>
    </div>
  );
}
