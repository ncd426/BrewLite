'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createOrder, getAccessToken } from '@/lib/api';
import { useCartStore } from '@/lib/useCartStore';

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const clearCart = useCartStore((state) => state.clearCart);
  const total = useCartStore((state) => state.getTotalPrice());
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
        items.map((item) => ({
          productId: item.id,
          size: item.size,
          qty: item.quantity,
          price: item.price,
        })),
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
            <div key={item.key} className="flex items-center justify-between border-b py-3">
              <div>
                <h3 className="font-semibold">{item.name} ({item.size})</h3>
                {item.toppings.length > 0 && (
                  <p className="text-xs text-amber-800">Topping: {item.toppings.join(', ')}</p>
                )}
                <p className="text-sm text-gray-600">{item.price.toLocaleString('vi-VN')}đ</p>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(item.key, item.quantity - 1)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.key, item.quantity + 1)}>+</button>
                <button onClick={() => removeFromCart(item.key)} className="text-red-500">Xóa</button>
              </div>
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
