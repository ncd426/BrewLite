# BrewLite API

NestJS API for the BrewLite beverage ordering application.

## Stack

- NestJS and TypeScript
- Prisma ORM
- PostgreSQL
- JWT and Passport
- class-validator

## Modules

- `src/products`: product menu endpoints
- `src/auth`: registration, login, and JWT
- `src/orders`: order creation and history
- `src/payments`: mock payment flow
- `src/users`: user module and service
- `src/prisma`: Prisma database client

## Main endpoints

- `GET /products`
- `GET /products/:id`
- `POST /auth/register`
- `POST /auth/login`
- `POST /orders`
- `GET /orders/me`
- `POST /payments`

## Local development

From the repository root, start PostgreSQL and set up the API:

```powershell
Copy-Item .env.example apps/api/.env
cd apps/api
npm ci
npx prisma generate
npx prisma db push
npm run start:dev
```

Set `DATABASE_URL` in `apps/api/.env` to a host-reachable database address,
such as `localhost:5432`.
