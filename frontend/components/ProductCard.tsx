'use client';

import { Product } from '@/lib/types';
import { motion } from 'framer-motion';

export function ProductCard({ product, onAdd }: { product: Product; onAdd?: (product: Product) => void }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="panel flex flex-col gap-4">
      <img src={product.image} alt={product.name} className="h-36 w-full rounded-lg object-cover" />
      <h3 className="text-xl font-bold">{product.name}</h3>
      <p className="text-sm text-zinc-300">{product.description}</p>
      <div className="mt-auto flex items-center justify-between">
        <span className="text-lg font-semibold text-emerald-400">${product.price.toFixed(2)}</span>
        <button onClick={() => onAdd?.(product)} className="rounded-md bg-emerald-500 px-4 py-2 font-semibold text-black transition hover:bg-emerald-400">Buy</button>
      </div>
    </motion.div>
  );
}
