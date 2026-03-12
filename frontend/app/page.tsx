'use client';

import { Copy, Disc3 } from 'lucide-react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import Link from 'next/link';
import { ServerStatus } from '@/components/ServerStatus';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function HomePage() {
  const { data: purchases } = useSWR('/orders/recent', fetcher);
  const ip = process.env.NEXT_PUBLIC_SERVER_IP || 'mc.stormhaven.fun';

  return (
    <div className="space-y-8">
      <section className="panel overflow-hidden bg-[url('https://images.unsplash.com/photo-1580077873521-dc3860f5f4f0')] bg-cover bg-center">
        <div className="bg-black/70 p-8">
          <h1 className="text-5xl font-black">Stormhaven Store</h1>
          <p className="mt-2 text-zinc-200">Premium ranks, crate keys, and bundles for the Stormhaven network.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={() => navigator.clipboard.writeText(ip)} className="flex items-center gap-2 rounded-md border border-emerald-500/50 px-4 py-2 hover:bg-emerald-500/10">{ip} <Copy size={16} /></button>
            <a href={process.env.NEXT_PUBLIC_DISCORD_INVITE || '#'} className="flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-2 font-semibold text-black"><Disc3 size={16}/> Join Discord</a>
            <Link href="/store" className="rounded-md border border-zinc-600 px-4 py-2">Visit Store</Link>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <ServerStatus />
        <div className="panel md:col-span-2">
          <h2 className="text-xl font-bold">Recent Purchases</h2>
          <div className="mt-4 space-y-2 text-sm">
            {purchases?.map((entry: any) => (
              <div key={entry._id} className="rounded border border-zinc-700 p-3">{entry.playerName} bought {entry.productName} • ${entry.total}</div>
            )) || <p>No purchases yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
