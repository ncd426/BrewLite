'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '@/lib/api';
import { useCartStore } from '@/lib/useCartStore';

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const checkoutItemKeys = useCartStore((state) => state.checkoutItemKeys);
  const setCheckoutItemKeys = useCartStore((state) => state.setCheckoutItemKeys);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const clearCart = useCartStore((state) => state.clearCart);
  const selectedItems = items.filter((item) =>
    checkoutItemKeys === null || checkoutItemKeys.includes(item.key),
  );
  const total = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const toggleCheckoutItem = (key: string) => {
    const selected = new Set(checkoutItemKeys ?? items.map((item) => item.key));
    if (selected.has(key)) selected.delete(key);
    else selected.add(key);
    setCheckoutItemKeys([...selected]);
  };

  const handleProceedToCheckout = () => {
    if (selectedItems.length === 0) return;
    if (!getAccessToken()) {
      router.push('/login?next=%2Fcheckout');
      return;
    }
    router.push('/checkout' as any);
  };

  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Giỏ hàng</h1>
        {items.length > 0 && (
          <button onClick={clearCart} className="text-sm font-medium text-amber-700 hover:underline">
            Xóa tất cả
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-300 bg-white p-8 text-center">
          <p className="text-lg font-medium">Giỏ hàng hiện đang trống.</p>
          <p className="mt-2 text-sm text-gray-600">Thêm sản phẩm từ menu để tiếp tục đặt hàng.</p>
          <Link href="/" className="mt-4 inline-block rounded-xl bg-amber-700 px-4 py-2 text-white transition hover:bg-amber-800">
            Quay lại menu
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.key} className="flex flex-wrap items-center gap-3 border-b py-4 sm:flex-nowrap">
              <input
                type="checkbox"
                aria-label={`Chọn ${item.name} để thanh toán`}
                checked={checkoutItemKeys === null || checkoutItemKeys.includes(item.key)}
                onChange={() => toggleCheckoutItem(item.key)}
                className="h-4 w-4 shrink-0 accent-amber-700"
              />
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-20 w-20 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">{item.name} ({item.size})</h3>
                {item.toppings.length > 0 && (
                  <p className="text-xs text-amber-800">Topping: {item.toppings.join(', ')}</p>
                )}
                <p className="text-sm text-gray-600">{item.price.toLocaleString('vi-VN')}đ</p>
              </div>

              <div className="ml-auto flex items-center gap-3">
                <div className="flex items-center rounded-lg border border-gray-200">
                  <button
                    onClick={() => updateQuantity(item.key, item.quantity - 1)}
                    className="px-2.5 py-1 text-sm font-bold text-gray-600 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="px-2 text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.key, item.quantity + 1)}
                    className="px-2.5 py-1 text-sm font-bold text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(item.key)}
                  className="text-sm text-red-500 hover:underline"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}

          <div className="rounded-2xl bg-amber-900 p-5 text-white">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Tổng thanh toán ({selectedItems.length} món)</span>
              <span>{total.toLocaleString('vi-VN')}đ</span>
            </div>

            <button
              type="button"
              onClick={handleProceedToCheckout}
              disabled={selectedItems.length === 0}
              className="mt-4 block w-full rounded-xl bg-white px-4 py-3 text-center font-medium text-amber-900 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {selectedItems.length === 0
                ? 'Chọn món để thanh toán'
                : getAccessToken() ? 'Tiến hành thanh toán' : 'Đăng nhập để thanh toán'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}