'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import { fetchProducts, type Product } from '@/lib/api';
import { MOCK_PRODUCTS } from '@/lib/mock-data';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    fetchProducts()
      .then((data) => {
        if (mounted) setProducts(data);
      })
      .catch((cause: unknown) => {
        if (mounted) {
          console.warn('Backend chưa sẵn sàng, sử dụng dữ liệu mock', cause);
          setProducts(MOCK_PRODUCTS);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="mx-auto max-w-6xl p-8">
      <header className="mb-8 flex items-center justify-between gap-4">
      {/* 
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-amber-700">BrewLite</p>
          <h1 className="text-3xl font-bold">Menu</h1>
        </div>
      
        <Link href="/cart" className="rounded-full bg-amber-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-800">
          Xem giỏ hàng
        </Link>
      */}
      </header>
      
      {loading ? (
        <div className="rounded-2xl border border-amber-100 bg-white p-8 text-center text-amber-700">
          Đang tải danh sách sản phẩm...
        </div>
      ) : error ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-white p-8 text-center text-red-700">
          Không thể tải sản phẩm từ API ({error}). Kiểm tra xem backend có đang chạy tại{' '}
          <code>http://localhost:4000</code> không.
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-white p-8 text-center text-gray-600">
          Không có sản phẩm nào để hiển thị.
        </div>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      )}
    </main>
  );
}
