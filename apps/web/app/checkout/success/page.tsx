'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 mb-4 text-2xl font-bold">
        ✓
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Đặt hàng thành công!</h1>
      <p className="mt-2 text-sm text-gray-600">
        Mã đơn hàng của bạn: <span className="font-semibold text-gray-900">#{orderId}</span>
      </p>
      <p className="mt-1 text-xs text-gray-500">Đơn hàng đã được gửi tới quầy pha chế.</p>

      <div className="mt-6 flex flex-col gap-2">
        <Link
          href="/"
          className="rounded-xl bg-amber-600 px-6 py-2.5 font-medium text-white transition hover:bg-amber-700"
        >
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<p className="text-center py-10">Đang tải...</p>}>
      <SuccessContent />
    </Suspense>
  );
}