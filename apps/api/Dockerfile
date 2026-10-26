FROM node:22-bookworm-slim AS build

RUN apt-get update \
    && apt-get install --no-install-recommends -y openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY apps/api/package.json apps/api/package-lock.json ./
RUN npm ci

COPY apps/api/ ./
RUN DATABASE_URL=postgresql://postgres:postgres@localhost:5432/brewlite npx prisma generate \
    && npm run build

FROM node:22-bookworm-slim AS runtime

RUN apt-get update \
    && apt-get install --no-install-recommends -y openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=development

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts

USER node
EXPOSE 4000

CMD ["npm", "run", "start:prod"]
