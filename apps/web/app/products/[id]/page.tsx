'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { fetchProduct, type Product } from '@/lib/api';
import { useCart } from '@/components/CartProvider';
import { MOCK_PRODUCTS } from '@/lib/mock-data';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('M');
  const { addToCart } = useCart();

  useEffect(() => {
    const productId = Number(params.id);
    fetchProduct(Number(params.id))
      .then(setProduct)
      .catch(() => {
        const fallback = MOCK_PRODUCTS.find((p) => p.id === productId) || null;
        setProduct(fallback);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const totalPrice = useMemo(() => {
    if (!product) return 0;
    const sizeMultiplier = selectedSize === 'S' ? 0.9 : selectedSize === 'L' ? 1.15 : 1;
    return Math.round(product.price * sizeMultiplier);
  }, [product, selectedSize]);

  if (loading) {
    return <main className="mx-auto max-w-2xl p-8 text-amber-700">Đang tải sản phẩm...</main>;
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="mb-4 text-3xl font-bold">Không tìm thấy sản phẩm</h1>
        <Link href="/" className="rounded-xl bg-amber-700 px-4 py-2 text-white">Quay lại menu</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link href="/" className="mb-6 inline-block text-sm font-medium text-amber-700">
        ← Quay lại menu
      </Link>

      <div className="grid gap-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-amber-100 md:grid-cols-2">
        <img src={product.imageUrl} alt={product.name} className="h-[360px] w-full rounded-2xl object-cover" />

        <div className="space-y-5">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-amber-700">BrewLite</p>
            <h1 className="mt-2 text-3xl font-bold">{product.name}</h1>
          </div>

          <p className="text-gray-600">
            Một món uống nóng thơm ngon, phù hợp cho những buổi sáng năng động hoặc thư giãn giữa ngày.
          </p>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Chọn kích cỡ</p>
            <div className="flex gap-2">
              {['S', 'M', 'L'].map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`rounded-full border px-3 py-2 text-sm font-medium ${
                    selectedSize === size ? 'border-amber-700 bg-amber-700 text-white' : 'border-amber-200 bg-white text-amber-900'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-amber-50 p-4">
            <p className="text-sm text-gray-600">Giá dự kiến</p>
            <p className="text-2xl font-bold text-amber-700">{totalPrice.toLocaleString('vi-VN')}đ</p>
          </div>

          <button
            onClick={() => addToCart(product, selectedSize)}
            className="w-full rounded-xl bg-amber-700 px-4 py-3 font-medium text-white"
          >
            Thêm vào giỏ hàng
          </button>
        </div>
      </div>
    </main>
  );
}
