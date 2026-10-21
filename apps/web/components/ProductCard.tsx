import Link from 'next/link';
import type { Product } from '@/lib/api';

export function ProductCard({ product }: { product: Product }) {
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

        <div className="mt-auto pt-3">
          <Link
            href={`/products/${product.id}`}
            className="block w-full rounded-xl bg-amber-600 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-amber-700"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </article>
  );
}