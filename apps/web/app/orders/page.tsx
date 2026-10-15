'use client';

const sampleOrders = [
  { id: 'BK-1001', total: 85000, status: 'Đang chuẩn bị' },
  { id: 'BK-1000', total: 52000, status: 'Hoàn tất' },
];

export default function OrdersPage() {
  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-3xl font-bold">Lịch sử đơn hàng</h1>

      <div className="space-y-4">
        {sampleOrders.map((order) => (
          <div key={order.id} className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-amber-100">
            <div>
              <p className="text-sm text-gray-500">Mã đơn</p>
              <p className="text-lg font-semibold">{order.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng tiền</p>
              <p className="font-medium">{order.total.toLocaleString('vi-VN')}đ</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Trạng thái</p>
              <p className="font-medium text-amber-700">{order.status}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
