# Local deployment and development

## Docker Compose

From the repository root:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Compose starts PostgreSQL, the NestJS API, and the Next.js web application.
The web app is available at `http://localhost:3000`; the API is available at
`http://localhost:4000`.

The sample `.env` values are for local development only. Replace the JWT secret
and database credentials before using a non-local environment. The API container
connects to PostgreSQL using the Compose service name `db`; when running the API
directly on the host, use `localhost` in `DATABASE_URL`.

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
