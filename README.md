# shop-api

Express + MongoDB commerce backend.

## Modules

| Module | Prefix | Notes |
|---|---|---|
| Auth | `/api/v1/auth` | register, login, me, logout |
| Categories | `/api/v1/categories` | public list/get, admin create/patch/delete |
| Products | `/api/v1/products` | public list/get, admin create/patch/delete |
| Cart | `/api/v1/cart` | authenticated get/add/update/remove/clear |
| Checkout | `/api/v1/checkout` | create from cart, get, confirm payment |
| Orders | `/api/v1/orders` | list/get, admin status patch, cancel |

## Run

```bash
cd shop-api
npm install
npm run seed
npm start
```

Use `.env` for Mongo, JWT, and the production Pulse DSN.

Needs MongoDB and a production Pulse DSN if you want error tracking.

Pulse client: set `PULSE_DSN` (your Pulse host ingest URL), `PULSE_NOTIFY_EMAIL`, `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BASE_BRANCH`, and `ISENABLEDSENDEMAIL` in `.env`. On start the SDK registers those with Pulse. The start script already preloads `@pulse/sdk/register`.

## Auth header

```
Authorization: Bearer <token>
```

## Example flow

1. `POST /api/v1/auth/register`
2. `POST /api/v1/cart/items` `{ "productId", "quantity" }`
3. `POST /api/v1/checkout` with shipping address
4. `POST /api/v1/checkout/:id/confirm`
5. `GET /api/v1/orders`
