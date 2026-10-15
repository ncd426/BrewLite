import Link from 'next/link';
import type { Product } from '@/lib/api';

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
      <img src={product.imageUrl} alt={product.name} className="h-52 w-full object-cover" />
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{product.name}</h2>
          <span className="font-medium text-amber-700">{product.price.toLocaleString('vi-VN')}đ</span>
        </div>
        <Link
          href={`/products/${product.id}`}
          className="block w-full rounded-xl bg-amber-600 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-amber-700"
        >
          Xem chi tiết
        </Link>
      </div>
    </article>
  );
}
