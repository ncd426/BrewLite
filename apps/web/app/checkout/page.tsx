'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/lib/useCartStore';
import {
  createOrder,
  processPayment,
  getAccessToken,
  type PaymentMethod,
  type OrderItemInput,
} from '@/lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MOMO');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push('/login?redirect=/checkout');
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  const totalPrice = getTotalPrice();

  const handlePayment = async () => {
    if (items.length === 0) {
      setErrorMessage('Giỏ hàng của bạn đang trống.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const idempotencyKey = crypto.randomUUID();

    try {
      const orderItems: OrderItemInput[] = items.map((item) => ({
        productId: Number(item.id),
        size: item.size || 'M',
        qty: item.quantity,
        price: item.price,
      }));

      const order = await createOrder(orderItems);
      const targetOrderId = order.orderId || (order as any).id;

      const paymentRes = await processPayment(
        {
          orderId: targetOrderId,
          method: paymentMethod,
        },
        idempotencyKey,
      );

      if (paymentRes.status === 'PAID') {
        clearCart();
        router.push(`/checkout/success?orderId=${targetOrderId}`);
      } else {
        setErrorMessage(
          paymentRes.message ||
            'Thanh toán không thành công. Giỏ hàng của bạn vẫn được giữ nguyên để thử lại.',
        );
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Có lỗi phát sinh trong quá trình thanh toán. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-gray-500">Đang kiểm tra thông tin đăng nhập...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Giỏ hàng của bạn đang trống</h1>
        <p className="mt-2 text-gray-600">Hãy thêm món nước yêu thích trước khi tiến hành thanh toán.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-amber-600 px-6 py-2.5 font-medium text-white transition hover:bg-amber-700"
        >
          Khám phá thực đơn
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Thanh toán đơn hàng</h1>

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Thông báo:</p>
          <p>{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Món đã chọn ({items.length})</h2>
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div key={item.key || `${item.id}-${item.size}`} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      Size: {item.size} {item.toppings?.length ? `| Topping: ${item.toppings.join(', ')}` : ''}
                    </p>
                    <p className="text-xs text-gray-500">Số lượng: x{item.quantity}</p>
                  </div>
                  <span className="font-semibold text-gray-800">
                    {((item.price || 0) * item.quantity).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Phương thức thanh toán</h2>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center justify-between rounded-xl border p-4 transition hover:bg-amber-50/50 has-[:checked]:border-amber-600 has-[:checked]:bg-amber-50">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="method"
                    value="MOMO"
                    checked={paymentMethod === 'MOMO'}
                    onChange={() => setPaymentMethod('MOMO')}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Ví điện tử (Momo / VNPay / ZaloPay)</p>
                    <p className="text-xs text-gray-500">Quét mã QR thanh toán tức thời</p>
                  </div>
                </div>
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border p-4 transition hover:bg-amber-50/50 has-[:checked]:border-amber-600 has-[:checked]:bg-amber-50">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="method"
                    value="CARD"
                    checked={paymentMethod === 'CARD'}
                    onChange={() => setPaymentMethod('CARD')}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Thẻ ngân hàng / Thẻ quốc tế</p>
                    <p className="text-xs text-gray-500">ATM nội địa, Visa, MasterCard</p>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="h-fit rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Chi tiết thanh toán</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Tạm tính</span>
              <span>{totalPrice.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between">
              <span>Phí vận chuyển</span>
              <span>0đ</span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900 text-base">
              <span>Tổng thanh toán</span>
              <span className="text-amber-700">{totalPrice.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handlePayment}
            className="mt-6 w-full rounded-xl bg-amber-600 py-3 text-center text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? 'Đang kết nối cổng thanh toán...' : 'Xác nhận thanh toán'}
          </button>
        </div>
      </div>
    </main>
  );
}