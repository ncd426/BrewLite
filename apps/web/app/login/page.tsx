'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { login, register, saveAccessToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const auth = isRegistering
        ? await register(name, email, password)
        : await login(email, password);
      saveAccessToken(auth.accessToken, auth.name, auth.email);
      // Return to a QR confirmation only when the path is known-safe.
      const next = new URLSearchParams(window.location.search).get('next');
      const safePath = next?.startsWith('/checkout/confirm?') ? next : '/cart';
      router.replace(safePath as any);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể xác thực tài khoản.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-md p-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-amber-100">
        <Link href="/" className="text-sm font-medium text-amber-700 hover:text-amber-900">
          ← Quay lại menu
        </Link>
        <h1 className="mb-2 mt-5 text-3xl font-bold">
          {isRegistering ? 'Tạo tài khoản' : 'Đăng nhập'}
        </h1>
        <p className="mb-6 text-sm text-gray-600">
          {isRegistering
            ? 'Đăng ký để tiếp tục đặt món tại BrewLite.'
            : 'Đăng nhập để tiếp tục đặt hàng.'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium">
                Họ và tên
              </label>
              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                type="text"
                placeholder="Nguyễn Văn An"
                required
                maxLength={100}
                autoComplete="name"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
            <input
              id="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              type="email"
              placeholder="name@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">Mật khẩu</label>
            <input
              id="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              type="password"
              placeholder="Ít nhất 6 ký tự"
              required
              minLength={isRegistering ? 6 : undefined}
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
            />
          </div>
          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-amber-700 px-4 py-3 font-medium text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? 'Đang xử lý...'
              : isRegistering
                ? 'Đăng ký'
                : 'Đăng nhập'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-gray-600">
          {isRegistering ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegistering((current) => !current);
              setError(null);
            }}
            className="font-semibold text-amber-700 hover:text-amber-900"
          >
            {isRegistering ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </p>
      </div>
    </main>
  );
}
