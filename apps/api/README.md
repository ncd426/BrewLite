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
- `POST /auth/register` — body: `{"name":"Nguyen Van An","email":"name@example.com","password":"secret123"}`
- `POST /auth/login` — body: `{"email":"name@example.com","password":"secret123"}`
- `GET /users/me` — returns the authenticated user's profile; requires `Authorization: Bearer <accessToken>`
- `POST /orders` and `GET /orders/me` — require `Authorization: Bearer <accessToken>`
- `POST /payments`

Registration and login return an `accessToken`. Passwords are hashed with
bcrypt and user records are stored in PostgreSQL. Invalid login credentials
return `401 Unauthorized`; order ownership is taken from the verified JWT, not
from the request body.

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