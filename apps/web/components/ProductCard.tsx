'use client';

import Link from 'next/link';
import type { Product } from '@/lib/api';
import { useCartStore } from '@/lib/useCartStore';

export function ProductCard({ product }: { product: Product }) {
  const addToCart = useCartStore((state) => state.addToCart);

  const handleQuickAdd = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      size: 'S',
      toppings: [],
    });
  };

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
      <img src={product.imageUrl} alt={product.name} className="h-52 w-full object-cover" />

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-h-[3rem] text-lg font-semibold text-gray-900 line-clamp-2">
            {product.name}
          </h2>
          <span className="shrink-0 font-medium text-amber-700">
            {product.price.toLocaleString('vi-VN')}đ
          </span>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-3">
          <Link
            href={`/products/${product.id}`}
            className="flex-1 rounded-xl bg-amber-600 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-amber-700"
          >
            Xem chi tiết
          </Link>

          <button
            type="button"
            title="Thêm nhanh vào giỏ"
            onClick={handleQuickAdd}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-amber-50 text-amber-800 transition hover:bg-amber-100 hover:text-amber-900 active:scale-95"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}