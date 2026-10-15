# BrewLite

BrewLite is a mobile-first beverage ordering application organized as a monorepo:

- `apps/web/`: Next.js and TypeScript web application.
- `apps/api/`: NestJS API with Prisma and PostgreSQL.
- `tests/`: integration and end-to-end tests.
- `docs/`: requirements, architecture, diagrams, traceability, and deployment notes.

## Run with Docker Compose

```powershell
Copy-Item .env.example .env
docker compose up --build
```

The web app is available at <http://localhost:3000> and the API at
<http://localhost:4000>. The API's product endpoint is
<http://localhost:4000/products>.

## Run locally

Start PostgreSQL, then configure the API and web app:

```powershell
cd apps/api
Copy-Item .env.example .env
npm ci
npx prisma generate
npx prisma db push
npm run start:dev
```

In another terminal:

```powershell
cd apps/web
Copy-Item .env.example .env.local
npm ci
npm run dev
```

For local API development outside Docker, set `DATABASE_URL` to a PostgreSQL
address reachable from the host (typically `localhost:5432`).

## Tests

Run the API unit tests from `apps/api`:

```powershell
npm test -- --runInBand
```

Run the API end-to-end tests from `apps/api`:

```powershell
npm run test:e2e
```

The end-to-end suite is in `tests/e2e/` and requires the API's configured
database and environment.

See [deployment.md](docs/deployment.md) for more run and deployment details.
