'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  clearAccessToken,
  getAccessToken,
  getUserEmail,
  getUserName,
} from '@/lib/api';
import { useCartStore } from '@/lib/useCartStore';

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const totalItems = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );

  useEffect(() => {
    setMounted(true);

    const syncAuthState = () => {
      const isAuthenticated = Boolean(getAccessToken());
      setUserName(isAuthenticated ? getUserName() : null);
      setUserEmail(isAuthenticated ? getUserEmail() : null);
      if (!isAuthenticated) setAccountMenuOpen(false);
    };
    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key === 'brewlite-access-token' ||
        event.key === 'brewlite-user-name' ||
        event.key === 'brewlite-user-email'
      ) {
        syncAuthState();
      }
    };

    syncAuthState();
    window.addEventListener('brewlite-auth-change', syncAuthState);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('brewlite-auth-change', syncAuthState);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!accountMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [accountMenuOpen]);

  return (
    <header className="border-b border-amber-200/60 bg-white/50 backdrop-blur-md">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-800 text-white shadow-md transition group-hover:bg-amber-900 group-hover:scale-105">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">BrewLite</p>
            <h1 className="hidden text-2xl font-bold text-amber-950 transition group-hover:text-amber-800 sm:block">
              Menu
            </h1>
          </div>
        </Link>
        <Link
          href="/orders"
          aria-label="Lịch sử đơn hàng"
          title="Lịch sử đơn hàng"
          className="absolute left-1/2 top-1/2 inline-flex h-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 text-xs font-semibold text-amber-800 shadow-sm transition-all duration-200 hover:bg-amber-100 active:scale-95 min-[824px]:h-auto min-[824px]:px-3.5 min-[824px]:py-1.5"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 text-amber-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span className="hidden min-[824px]:inline">Lịch sử đơn hàng</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link
            href="/cart"
            aria-label="Giỏ hàng"
            title="Giỏ hàng"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-amber-300 bg-white/80 text-sm font-medium text-amber-900 shadow-sm backdrop-blur transition hover:border-amber-400 hover:bg-amber-100/50 min-[824px]:h-auto min-[824px]:w-auto min-[824px]:gap-2 min-[824px]:px-4 min-[824px]:py-2"
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
            <span className="hidden min-[824px]:inline">Giỏ hàng</span>

            {mounted && totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-700 px-1 text-xs font-bold text-white shadow min-[824px]:static">
                {totalItems}
              </span>
            )}
          </Link>

          {mounted && userEmail ? (
            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-label="Thông tin cá nhân"
                aria-expanded={accountMenuOpen}
                onClick={() => setAccountMenuOpen((open) => !open)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-sm font-medium text-amber-900 transition hover:bg-amber-200 min-[824px]:h-auto min-[824px]:w-auto min-[824px]:max-w-56 min-[824px]:gap-2 min-[824px]:px-4 min-[824px]:py-2"
                title={userName || userEmail}
              >
                <svg aria-hidden="true" className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 00-16 0m8-10a4 4 0 100-8 4 4 0 000 8z" />
                </svg>
                <span className="hidden max-w-40 truncate min-[824px]:inline">{userName || userEmail}</span>
                <svg
                  aria-hidden="true"
                  className={`hidden h-4 w-4 transition-transform min-[824px]:block ${accountMenuOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.22 7.22a.75.75 0 011.06 0L10 10.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 8.28a.75.75 0 010-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {accountMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-amber-100 bg-white py-1 shadow-lg"
                >
                  <Link
                    href="/profile"
                    role="menuitem"
                    onClick={() => setAccountMenuOpen(false)}
                    className="block px-4 py-3 text-sm text-amber-950 transition hover:bg-amber-50"
                  >
                    Thông tin cá nhân
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      clearAccessToken();
                      setAccountMenuOpen(false);
                    }}
                    className="block w-full px-4 py-3 text-left text-sm text-red-700 transition hover:bg-red-50"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              aria-label="Đăng nhập"
              title="Đăng nhập"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-800 text-sm font-medium text-white shadow-sm transition hover:bg-amber-900 hover:shadow min-[824px]:h-auto min-[824px]:w-auto min-[824px]:px-4 min-[824px]:py-2"
            >
              <svg aria-hidden="true" className="h-5 w-5 min-[824px]:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5m5 5H3" />
              </svg>
              <span className="hidden min-[824px]:inline">Đăng nhập</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}