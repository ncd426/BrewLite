'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart } from '@/components/CartProvider';
import { createOrder, getAccessToken } from '@/lib/api';

export default function CartPage() {
  const router = useRouter();
  const { items, total, updateQuantity, removeFromCart, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderMessage, setOrderMessage] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!getAccessToken()) {
      router.push('/login?next=%2Fcart');
      return;
    }

    setIsSubmitting(true);
    setOrderError(null);
    setOrderMessage(null);

    try {
      const order = await createOrder(
        items.map((item) => {
          const size = item.name.match(/\(([SML])\)$/)?.[1] ?? 'M';
          return {
            productId: item.id,
            size,
            qty: item.quantity,
            price: item.price,
          };
        }),
      );
      clearCart();
      setOrderMessage(`Đặt hàng thành công! Mã đơn: ${order.orderId}`);
    } catch (cause) {
      setOrderError(
        cause instanceof Error ? cause.message : 'Không thể gửi đơn hàng.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Giỏ hàng</h1>
        {items.length > 0 && (
          <button onClick={clearCart} className="text-sm font-medium text-amber-700">
            Xóa tất cả
          </button>
        )}
      </div>

      {orderMessage && (
        <p role="status" className="mb-4 rounded-xl bg-green-100 p-3 text-sm text-green-900">
          {orderMessage}
        </p>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-300 bg-white p-8 text-center">
          <p className="text-lg font-medium">Giỏ hàng hiện đang trống.</p>
          <p className="mt-2 text-sm text-gray-600">Thêm sản phẩm từ menu để tiếp tục đặt hàng.</p>
          <Link href="/" className="mt-4 inline-block rounded-xl bg-amber-700 px-4 py-2 text-white">
            Quay lại menu
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={`${item.id}-${item.name}`} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-amber-100">
              <img src={item.imageUrl} alt={item.name} className="h-20 w-20 rounded-xl object-cover" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold">{item.name}</h2>
                <p className="text-sm text-gray-600">{item.price.toLocaleString('vi-VN')}đ / sản phẩm</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="h-8 w-8 rounded-full border border-amber-200 text-lg"
                >
                  -
                </button>
                <span className="min-w-6 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="h-8 w-8 rounded-full border border-amber-200 text-lg"
                >
                  +
                </button>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="text-sm text-red-500">
                Xóa
              </button>
            </div>
          ))}

          <div className="rounded-2xl bg-amber-900 p-5 text-white">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Tổng thanh toán</span>
              <span>{total.toLocaleString('vi-VN')}đ</span>
            </div>
            {orderError && (
              <p role="alert" className="mt-4 rounded-xl bg-red-100 p-3 text-sm text-red-800">
                {orderError}
              </p>
            )}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="mt-4 rounded-xl bg-white px-4 py-2 font-medium text-amber-900 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? 'Đang gửi đơn...'
                : getAccessToken()
                  ? 'Đặt hàng'
                  : 'Đăng nhập để đặt hàng'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
