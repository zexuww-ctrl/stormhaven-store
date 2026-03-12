'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

const links = [
  ['Store', '/store'],
  ['Ranks', '/ranks'],
  ['Crate Keys', '/crate-keys'],
  ['Account', '/account/login'],
  ['Admin', '/admin']
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-emerald-500/20 bg-storm-900/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-2xl font-black tracking-wide text-emerald-400">Stormhaven</Link>
        <div className="flex items-center gap-4 text-sm">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="transition hover:text-emerald-300">{label}</Link>
          ))}
          <Link href="/cart" className="rounded-lg border border-emerald-500/30 p-2 hover:bg-emerald-500/10"><ShoppingCart size={18} /></Link>
        </div>
      </nav>
    </header>
  );
}
