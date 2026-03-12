'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';
import { useCart } from '@/components/CartProvider';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function RanksPage() {
  const { data } = useSWR('/products?category=rank', fetcher);
  const { addItem } = useCart();
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-black">Ranks</h1>
      <div className="panel overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr><th>Rank</th><th>Price</th><th>Perks</th><th></th></tr></thead>
          <tbody>
            {data?.map((rank: any) => (
              <tr key={rank._id} className="border-t border-zinc-700">
                <td className="py-3 font-semibold uppercase">{rank.name}</td>
                <td>${rank.price}</td>
                <td>{rank.perks?.join(', ') || rank.description}</td>
                <td><button onClick={() => addItem(rank)} className="rounded bg-emerald-500 px-3 py-1 font-semibold text-black">Buy</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
