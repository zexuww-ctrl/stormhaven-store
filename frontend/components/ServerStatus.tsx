'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export function ServerStatus() {
  const { data } = useSWR('/server/status', fetcher, { refreshInterval: 15000 });

  return (
    <div className="panel">
      <p className="text-sm text-zinc-400">Server Status</p>
      <p className="mt-1 text-2xl font-bold text-emerald-400">{data?.online ? 'Online' : 'Offline'}</p>
      <p className="text-sm">Players: {data?.players ?? 0}</p>
    </div>
  );
}
