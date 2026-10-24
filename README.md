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

The local Pulse SDK is installed from the sibling `../make-ai/sdk` package. The `start` and `dev` scripts preload `@pulse/sdk/register`, which reads the app's `.env`, initializes Pulse, and instruments Express before the server starts. The Express error handler also reports unexpected 500 errors with request context.

## Test Pulse locally

1. Start the Pulse project from `../make-ai` with `npm run dev`, then create a project in its dashboard and copy the project DSN.
2. In this app's `.env`, set the DSN and a GitHub test repository:

   ```env
   PULSE_DSN=http://127.0.0.1:8787/ingest/YOUR_PROJECT_KEY
   PULSE_ENVIRONMENT=production
   PULSE_RELEASE=shop-api-local
   PULSE_NOTIFY_EMAIL=alerts@example.com
   GITHUB_TOKEN=YOUR_TEST_REPO_TOKEN
   GITHUB_REPO=owner/test-repo
   GITHUB_BASE_BRANCH=main
   ISENABLEDSENDEMAIL=true
   ```

   Use a token for a disposable test repository with permission to read and write contents and create pull requests. Configure `AI_API_KEY` in the Pulse server's `.env` so the AI agent can run. The SDK registers the repo settings with Pulse at startup.
3. Start MongoDB, then run `npm run seed` and `npm run dev` in this project.
4. Check `http://127.0.0.1:4000/health`. Its `pulse.sdkLoaded`, `pulse.dsnConfigured`, and `pulse.initialized` values should all be `true`. The Pulse server's `/health` must report `agent.gemini: true`.
5. Run `npm run test:pulse-crash` to submit the existing checkout crash scenario. Check the issue and agent status in the Pulse dashboard, and review any resulting PR in the test repository.

Pulse opens a PR only after the `Pulse fix validation` GitHub Actions workflow passes on its candidate branch. Add `.github/workflows/pulse-validation.yml` to the connected repository's default branch and grant the project's fine-grained GitHub token Actions: Read and write, Contents: Read and write, and Pull requests: Read and write. If `make-ai` is private, add a repository secret named `PULSE_SDK_READ_TOKEN` with read access to it. The workflow uses an isolated MongoDB service and runs `npm run test:data`; it does not deploy or merge.

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
