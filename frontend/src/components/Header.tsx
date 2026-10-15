'use client';

import Link from 'next/link';
import { ShoppingBag, Coffee } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

export default function Header() {
  const totalItems = useCartStore((state) => state.totalItems);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-emerald-800">
          <Coffee className="w-5 h-5 text-emerald-600" />
          <span>BrewLite</span>
        </Link>

        <Link 
          href="/cart" 
          className="relative p-2 text-gray-700 hover:text-emerald-700 transition"
          aria-label="Xem giỏ hàng"
        >
          <ShoppingBag className="w-6 h-6" />
          {totalItems > 0 && (
            <span className="absolute top-1 right-1 bg-emerald-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}