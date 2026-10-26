# BrewLite

BrewLite là ứng dụng đặt đồ uống, gồm frontend Next.js, backend NestJS và
PostgreSQL. Prisma quản lý schema, migration và dữ liệu mẫu.

## Yêu cầu

- Docker Desktop và Docker Compose (cách chạy khuyến nghị); hoặc Node.js 22+,
  npm và PostgreSQL 16+ nếu chạy trực tiếp.
- Dung lượng đĩa đủ cho image Docker và dữ liệu PostgreSQL.

## Chức năng

- Xem danh sách sản phẩm, chi tiết, giá, ảnh và tồn kho.
- Chọn kích cỡ, topping; quản lý giỏ hàng và đặt hàng.
- Đăng ký, đăng nhập, xem hồ sơ và lịch sử đơn hàng.
- Áp dụng mã khuyến mãi và mô phỏng thanh toán MoMo/thẻ.
- Xem trạng thái và xác nhận đơn hàng.

## Chạy bằng Docker Compose

Tại thư mục gốc repository, tạo file cấu hình rồi khởi động:

```powershell
Copy-Item .env.example .env
```

Mở `.env`, đặt `SEED_DEMO_PASSWORD` dài ít nhất 12 ký tự và thay
`JWT_SECRET` bằng giá trị riêng cho môi trường local. Sau đó chạy:

```powershell
docker compose up --build
```

Compose khởi động ba service: PostgreSQL, backend và frontend. Backend chờ
database sẵn sàng, áp dụng các migration bằng `prisma migrate deploy`, rồi chạy
seed trước khi phục vụ API. Các địa chỉ mặc định:

- Web: <http://localhost:3000>
- API: <http://localhost:4000>
- PostgreSQL: `localhost:5433`

Dừng service bằng `Ctrl+C`, hoặc chạy `docker compose down`. Dữ liệu database
được giữ trong volume; chỉ dùng `docker compose down --volumes` nếu chủ ý xóa
dữ liệu local.

> Nếu database đã được tạo bằng `prisma db push` hoặc chưa có lịch sử migration
> tương ứng, cần đối chiếu schema và baseline migration trước khi chạy. Không
> dùng `migrate reset` trên database có dữ liệu cần giữ.

## Biến môi trường

| Biến | Mặc định trong `.env.example` | Mục đích |
| --- | --- | --- |
| `POSTGRES_DB` | `brewlite` | Tên database trong Compose. |
| `POSTGRES_USER` | `postgres` | Tài khoản PostgreSQL. |
| `POSTGRES_PASSWORD` | `brewlite-local-only` | Mật khẩu PostgreSQL local; hãy thay nếu cần. |
| `POSTGRES_PORT` | `5433` | Cổng PostgreSQL trên máy host. |
| `DATABASE_URL` | URL tới `localhost:5433` | Kết nối API chạy trực tiếp trên host. Compose tự đặt URL nội bộ trỏ tới service `db`. |
| `JWT_SECRET` | Giá trị mẫu local | Secret ký JWT; thay bằng giá trị riêng. |
| `SEED_DEMO_PASSWORD` | Giá trị mẫu local | Mật khẩu được đặt cho tài khoản demo khi tạo lần đầu; tối thiểu 12 ký tự. Seed không đổi mật khẩu của tài khoản đã tồn tại. |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | URL API frontend gọi tới; được nhúng vào frontend lúc build. |
| `API_PORT` | `4000` | Cổng API trên máy host. |
| `WEB_PORT` | `3000` | Cổng web trên máy host. |

Các giá trị mẫu chỉ dành cho phát triển local; không sử dụng nguyên trạng ở
môi trường production. Seed từ chối chạy khi `NODE_ENV=production`.

## API

Base URL mặc định: `http://localhost:4000`. Endpoint cần xác thực nhận JWT qua
header `Authorization: Bearer <accessToken>`.

| Method | Endpoint | Xác thực | Mô tả |
| --- | --- | --- | --- |
| `GET` | `/products` | Không | Danh sách sản phẩm. |
| `GET` | `/products/:id` | Không | Chi tiết sản phẩm. |
| `POST` | `/auth/register` | Không | Đăng ký với `name`, `email`, `password`. |
| `POST` | `/auth/login` | Không | Đăng nhập với `email`, `password`; trả về `accessToken`. |
| `GET` | `/users/me` | Có | Hồ sơ người dùng hiện tại. |
| `POST` | `/orders` | Có | Tạo đơn hàng từ `items` và mã khuyến mãi tùy chọn. |
| `GET` | `/orders/me` | Có | Lịch sử đơn hàng của người dùng hiện tại. |
| `GET` | `/orders/:id` | Có | Chi tiết đơn thuộc người dùng hiện tại. |
| `POST` | `/payments` | Có | Mô phỏng thanh toán cho đơn hàng. |

Thanh toán yêu cầu header `Idempotency-Key` và body gồm `orderId`, `method`
(`MOMO` hoặc `CARD`). Có thể gửi `simulateFailure: true` để thử luồng thanh toán
thất bại. Xem chi tiết API và DTO trong [apps/api/README.md](apps/api/README.md).

## Tài khoản demo

Seed tạo các tài khoản local sau:

| Email | Mật khẩu |
| --- | --- |
| `demo@brewlite.test` | Giá trị `SEED_DEMO_PASSWORD` tại lần tạo tài khoản đầu tiên |
| `khach1@brewlite.test` | Giá trị `SEED_DEMO_PASSWORD` tại lần tạo tài khoản đầu tiên |
| `khach2@brewlite.test` | Giá trị `SEED_DEMO_PASSWORD` tại lần tạo tài khoản đầu tiên |

Seed không ghi đè password của tài khoản đã có. Nếu đã seed từ trước, hãy dùng
mật khẩu đã được thiết lập lúc tạo tài khoản đó.

## Chạy trực tiếp không dùng Docker

Đảm bảo PostgreSQL đang chạy, sau đó cấu hình `apps/api/.env` theo
`apps/api/.env.example`. Đặt `DATABASE_URL` trỏ tới PostgreSQL trên host và đặt
`JWT_SECRET`, `SEED_DEMO_PASSWORD` như hướng dẫn ở trên.

Trong terminal backend:

```powershell
cd apps/api
npm ci
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run start:dev
```

Trong terminal frontend:

```powershell
cd apps/web
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Nếu API không chạy ở `http://localhost:4000`, cập nhật
`NEXT_PUBLIC_API_URL` trong `apps/web/.env.local` rồi khởi động lại frontend.

## Chạy test

Unit test backend:

```powershell
cd apps/api
npm test -- --runInBand
```

End-to-end test backend:

```powershell
cd apps/api
npm run test:e2e
```

End-to-end test cần database và biến môi trường API đã được cấu hình. Build
frontend:

```powershell
cd apps/web
npm run build
```

## Tài liệu

- [Hướng dẫn API](apps/api/README.md)
- [Triển khai local](docs/deployment.md)
- [Hướng dẫn migration database](docs/database-migrations.md)
- [Yêu cầu chức năng](docs/requirements/requirements.md)
