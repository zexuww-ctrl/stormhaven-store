'use client';

import { api } from '@/lib/api';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div className="panel mx-auto max-w-md space-y-3">
      <h1 className="text-3xl font-black">Login</h1>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded bg-zinc-900 p-3" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded bg-zinc-900 p-3" />
      <button onClick={() => api.post('/auth/login', { email, password })} className="rounded bg-emerald-500 px-4 py-2 font-semibold text-black">Login</button>
    </div>
  );
}
