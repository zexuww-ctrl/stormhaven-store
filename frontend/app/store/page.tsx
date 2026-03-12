'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { useCart } from '@/components/CartProvider';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function StorePage() {
  const { data: products } = useSWR('/products', fetcher);
  const { addItem } = useCart();
  const categories = ['rank', 'crate', 'bundle'];

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-black">Store</h1>
      {categories.map((category) => (
        <section key={category}>
          <h2 className="mb-4 text-2xl font-bold capitalize">{category === 'crate' ? 'Crate Keys' : `${category}s`}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {products?.filter((p: any) => p.category === category).map((product: any) => (
              <ProductCard key={product._id} product={product} onAdd={addItem} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
