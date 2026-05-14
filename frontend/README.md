# Paks Thermal Optimizer Frontend

Frontend owner workspace for the hackathon project. Keep frontend changes inside this folder unless a shared API contract update is explicitly coordinated.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

## Scripts

- `npm run dev` - local Next.js dev server.
- `npm run build` - production build and type check.
- `npm run lint` - Next.js lint.
- `npm run generate:api` - generate OpenAPI types from `../shared/api-contract.yaml` once the shared contract exists.

## Environment

Copy `.env.example` to `.env.local` when needed.

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCK=true
```

Mock mode is enabled by default in development if `NEXT_PUBLIC_USE_MOCK` is not set. It serves:

- `GET /api/mock/scenario/{summer|winter|heatwave}`
- `POST /api/mock/scenario`

When backend integration starts, set `NEXT_PUBLIC_USE_MOCK=false` and point `NEXT_PUBLIC_API_URL` at the backend host.

## Pages

- `/` - main operator dashboard.
- `/scenario` - override and recompute workbench.

## Coordination Notes

- Frontend state lives in `lib/store/dashboard-store.ts`.
- API hooks live in `lib/api/client.ts`.
- Mock scenario data lives in `lib/mock/scenarios.ts`.
- `demo.html` remains as the visual reference from the original prompt.
