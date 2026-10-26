# BrewLite API

Backend NestJS cho ứng dụng BrewLite. Dùng Prisma ORM để truy cập PostgreSQL;
đăng nhập được bảo vệ bằng JWT.

## Yêu cầu

- Node.js 22+, npm và PostgreSQL 16+; hoặc chạy toàn bộ ứng dụng bằng Docker
  Compose tại [README chính](../../README.md).
- Các biến môi trường cần thiết: `DATABASE_URL`, `JWT_SECRET`,
  `SEED_DEMO_PASSWORD`.

## Chức năng

- Cung cấp menu sản phẩm và thông tin chi tiết.
- Đăng ký, đăng nhập và lấy hồ sơ người dùng.
- Tạo đơn, áp dụng khuyến mãi và xem lịch sử/chi tiết đơn của chính người dùng.
- Mô phỏng thanh toán MoMo hoặc thẻ; hỗ trợ header idempotency và mô phỏng
  thanh toán thất bại.

## Cách chạy local

Từ thư mục API, tạo file cấu hình nếu chưa có:

```powershell
Copy-Item .env.example .env
```

Đặt `DATABASE_URL` trỏ tới PostgreSQL có thể truy cập từ host, đặt
`JWT_SECRET` bằng secret local riêng, và đặt `SEED_DEMO_PASSWORD` dài ít nhất
12 ký tự.

```powershell
npm ci
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run start:dev
```

API chạy tại <http://localhost:4000>. Seed dùng ảnh local từ frontend; tài khoản
demo và mật khẩu lấy từ biến `SEED_DEMO_PASSWORD`. Mật khẩu tài khoản đã tồn
tại sẽ không bị seed ghi đè.

> Nếu database đã có schema nhưng chưa có migration history tương ứng, hãy kiểm
> tra và baseline migration theo [hướng dẫn migration](../../docs/database-migrations.md)
> trước khi deploy. Không reset database cần giữ dữ liệu.

## API

Base URL: `http://localhost:4000`. Các endpoint có xác thực dùng header
`Authorization: Bearer <accessToken>`.

| Method | Endpoint | Xác thực | Nội dung |
| --- | --- | --- | --- |
| `GET` | `/products` | Không | Danh sách menu. |
| `GET` | `/products/:id` | Không | Chi tiết sản phẩm. |
| `POST` | `/auth/register` | Không | Body: `name`, `email`, `password`. |
| `POST` | `/auth/login` | Không | Body: `email`, `password`; trả về `accessToken`. |
| `GET` | `/users/me` | Có | Hồ sơ người dùng đang đăng nhập. |
| `POST` | `/orders` | Có | Tạo đơn với các `items` và `promotionCode` tùy chọn. |
| `GET` | `/orders/me` | Có | Lịch sử đơn hàng của người dùng hiện tại. |
| `GET` | `/orders/:id` | Có | Xem đơn hàng của người dùng hiện tại. |
| `POST` | `/payments` | Có | Thanh toán đơn hàng. |

Ví dụ body thanh toán:

```json
{
  "orderId": 42,
  "method": "MOMO"
}
```

`method` nhận `MOMO` hoặc `CARD`. Request phải có header
`Idempotency-Key: <unique-key>`. Có thể thêm `"simulateFailure": true` để mô
phỏng thanh toán thất bại; trạng thái thanh toán và đơn hàng được lưu trong
database. Quyền sở hữu đơn được xác định từ JWT, không lấy từ request body.

## Tài khoản demo

| Email | Mật khẩu |
| --- | --- |
| `demo@brewlite.test` | `SEED_DEMO_PASSWORD` khi tài khoản được tạo lần đầu |
| `khach1@brewlite.test` | `SEED_DEMO_PASSWORD` khi tài khoản được tạo lần đầu |
| `khach2@brewlite.test` | `SEED_DEMO_PASSWORD` khi tài khoản được tạo lần đầu |

Seed từ chối chạy với `NODE_ENV=production`. Không dùng các tài khoản demo
trong môi trường production.

## Chạy test

Unit test:

```powershell
npm test -- --runInBand
```

End-to-end test:

```powershell
npm run test:e2e
```

End-to-end test dùng cấu hình database và môi trường API hiện tại. Build API:

```powershell
npm run build
```

## Biến môi trường

| Biến | Mô tả |
| --- | --- |
| `DATABASE_URL` | URL kết nối PostgreSQL. |
| `JWT_SECRET` | Secret dùng ký JWT. |
| `SEED_DEMO_PASSWORD` | Password tối thiểu 12 ký tự dùng khi tạo tài khoản demo lần đầu. |
