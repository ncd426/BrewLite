# Local deployment and development

## Docker Compose

From the repository root:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Compose runs exactly three services: PostgreSQL (`db`), the NestJS API
(`backend`), and the Next.js web application (`frontend`). The backend waits
until PostgreSQL is healthy, runs `prisma migrate deploy`, and seeds the
development accounts, current menu, promotions, and sample orders before it
starts listening. The seed can be rerun safely and uses local image paths
served by the frontend. The web app is available at `http://localhost:3000`;
the API is available at `http://localhost:4000`.

The sample `.env` values are for local development only. Set a private
`SEED_DEMO_PASSWORD` (at least 12 characters) and replace the JWT secret and
database credentials before use outside local development. The API container
connects to PostgreSQL using the Compose service name `db`; when running the API
directly on the host, use `localhost` in `DATABASE_URL`. `NEXT_PUBLIC_API_URL`
is embedded into the frontend at image build time.

For an existing database that was created with `prisma db push` or has no
matching migration history, reconcile/baseline its migration history first
using [database-migrations.md](database-migrations.md). Compose deliberately
does not reset or delete existing data.

Stop the services with `docker compose down`. Add `--volumes` only when you
intentionally want to remove the local PostgreSQL data volume.

## Running without Compose

Run PostgreSQL separately, configure `apps/api/.env`, and follow the API
instructions in [apps/api/README.md](../apps/api/README.md). Configure
`apps/web/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:4000`, then run
`npm ci` and `npm run dev` from `apps/web`.

## CI

GitHub Actions builds and tests the API and builds the web app on pushes and
pull requests to the default branch.
