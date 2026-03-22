# crud-api-fastify

Simple Product Catalog CRUD API with in-memory store and cluster mode support (Fastify + Zod + uuid).

### Quick summary
- Keep `.env.example` with `MODE=dev, PORT=4000`
- For  npm run start:multi use `MODE=multi` in `.env.example`

## Description

Provides REST endpoints:

- GET `/api/products`
- GET `/api/products/:id`
- POST `/api/products`
- PUT `/api/products/:id`
- DELETE `/api/products/:id`

Product fields:
- `id` — string (uuid generated on server)
- `name` — string required
- `description` — string required
- `price` — number required, > 0
- `category` — string required
- `inStock` — boolean required

---

## Project files

- `src/app.ts` — routes and business logic
- `src/db.ts` — shared product data
- `src/index.ts` — single instance startup (dev/prod)
- `src/cluster.ts` — cluster + load balancer
- `.env` — local environment variables
- `.env.example` — sample env template
- `package.json` — scripts
- `test/products.test.ts` — tests

---

## Env config

Supported modes:
- `MODE=multi` — cluster mode (IPC requests to master)
- `MODE=dev` — single instance, no IPC

`.env.example` should contain:
MODE=dev
PORT=4000

Run
MODE=dev PORT=4000 npm run start:dev
Cluster (required by assignment)
MODE=multi PORT=4000 npm run start:multi



