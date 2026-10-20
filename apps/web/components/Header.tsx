'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/lib/useCartStore';

export function Header() {
  const [mounted, setMounted] = useState(false);
  const totalItems = useCartStore((state) => state.getTotalItems());

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-amber-200/60 px-4 py-4 mb-6">
      <Link href="/" className="group block">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">BrewLite</p>
        <h1 className="text-2xl font-bold text-amber-950 transition group-hover:text-amber-800">
          Menu
        </h1>
      </Link>

      <nav className="flex items-center gap-3">
        <Link
          href="/cart"
          className="relative flex items-center gap-2 rounded-xl border border-amber-300 bg-white/80 px-4 py-2 text-sm font-medium text-amber-900 shadow-sm backdrop-blur transition hover:border-amber-400 hover:bg-amber-100/50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-amber-800"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <span>Giỏ hàng</span>

          {mounted && totalItems > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-700 px-1 text-xs font-bold text-white shadow">
              {totalItems}
            </span>
          )}
        </Link>

        <Link
          href="/login"
          className="rounded-xl bg-amber-800 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-amber-900 hover:shadow"
        >
          Đăng nhập
        </Link>
      </nav>
    </header>
  );
}