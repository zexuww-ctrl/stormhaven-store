'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { useCart } from '@/components/CartProvider';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function CrateKeysPage() {
  const { data } = useSWR('/products?category=crate', fetcher);
  const { addItem } = useCart();

  return (
    <div>
      <h1 className="mb-6 text-4xl font-black">Crate Keys</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {data?.map((item: any) => <ProductCard key={item._id} product={item} onAdd={addItem} />)}
      </div>
    </div>
  );
}
