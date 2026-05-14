# Hackatom 2026 Monorepo

This is a hackathon monorepo for the Paks NPP thermal optimizer project.

## Structure

- `frontend/` contains the Next.js dashboard.
- `backend/` contains the API and optimizer service.
- `shared/api-contract.yaml` is the source of truth for API fields.
- `shared/notes.md` is the shared coordination log for contract changes, blockers, and demo decisions.

Frontend and backend contributors must not rename API fields without updating `shared/api-contract.yaml` in the same coordinated change.

## Basic Commands

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
```

Contract:

```bash
shared/api-contract.yaml
```
