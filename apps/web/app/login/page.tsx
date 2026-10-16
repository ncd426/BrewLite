'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    alert(`Đăng nhập demo thành công cho ${email || 'người dùng'}`);
  };

  return (
    <main className="mx-auto max-w-md p-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-amber-100">
        <h1 className="mb-6 text-3xl font-bold">Đăng nhập</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none ring-0"
              type="email"
              placeholder="name@example.com"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Mật khẩu</label>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none ring-0"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="w-full rounded-xl bg-amber-700 px-4 py-3 font-medium text-white">
            Đăng nhập
          </button>
        </form>
      </div>
    </main>
  );
}
