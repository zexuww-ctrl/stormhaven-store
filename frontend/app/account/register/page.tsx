'use client';

import { api } from '@/lib/api';
import { useState } from 'react';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  return (
    <div className="panel mx-auto max-w-md space-y-3">
      <h1 className="text-3xl font-black">Register</h1>
      <input placeholder="Username" className="w-full rounded bg-zinc-900 p-3" onChange={(e) => setForm({ ...form, username: e.target.value })} />
      <input placeholder="Email" className="w-full rounded bg-zinc-900 p-3" onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input type="password" placeholder="Password" className="w-full rounded bg-zinc-900 p-3" onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <button onClick={() => api.post('/auth/register', form)} className="rounded bg-emerald-500 px-4 py-2 font-semibold text-black">Create account</button>
    </div>
  );
}
