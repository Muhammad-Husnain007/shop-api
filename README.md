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

Use `.env` for Mongo, JWT, and the Pulse DSN.

The local Pulse SDK is installed from the sibling `../make-ai/sdk` package. `src/config/telemetry.js` initializes it on startup, and the Express error handler reports unexpected 500 errors with request context.

## Test Pulse locally

1. Start the Pulse project from `../make-ai` with `npm run dev`, then create a project in its dashboard and copy the project DSN.
2. In this app's `.env`, set the DSN and a GitHub test repository:

   ```env
   PULSE_DSN=http://127.0.0.1:8787/ingest/YOUR_PROJECT_KEY
   PULSE_ENVIRONMENT=local
   PULSE_RELEASE=shop-api-local
   GITHUB_TOKEN=YOUR_TEST_REPO_TOKEN
   GITHUB_REPO=owner/test-repo
   GITHUB_BASE_BRANCH=main
   ISENABLEDSENDEMAIL=false
   ```

   Use a token for a disposable test repository with permission to read and write contents and create pull requests. Configure `GEMINI_API_KEY` in the Pulse server's `.env` so the AI agent can run. The SDK registers the repo settings with Pulse at startup.
3. Start MongoDB, then run `npm run seed` and `npm run dev` in this project.
4. Run `npm run test:pulse-crash` to submit the existing checkout crash scenario. Check the issue and agent status in the Pulse dashboard, and review any resulting PR in the test repository.

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
