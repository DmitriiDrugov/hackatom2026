# HackAtom 2026 Monorepo

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

## Deploy на Vercel

Проект готов к деплою: фронтенд (`frontend/`) — Next.js 14 с моковыми API-роутами, для демо бэкенд не требуется.

### Настройка проекта в Vercel (обязательно)

1. **Add New → Project**, импортировать репозиторий.
2. В настройках проекта установить **Root Directory** → `frontend`.
   Это критически важно: Vercel должен видеть `frontend/package.json`, иначе сборка падает с `No Next.js version detected`.
3. Framework Preset определится автоматически как **Next.js**.
4. Build / Install / Output команды можно оставить по умолчанию — конфиг лежит в `frontend/vercel.json`.
5. Environment Variables (мок-режим включён по умолчанию):
   - `NEXT_PUBLIC_USE_MOCK=true` — отдавать данные из локальных мок-роутов.
   - `NEXT_PUBLIC_API_URL=https://<ваш-бэкенд>` — когда появится реальный бэкенд, переключите `NEXT_PUBLIC_USE_MOCK=false`.
6. Нажать **Deploy**.

### Vercel CLI

```bash
npm i -g vercel
cd frontend
vercel link
vercel --prod
```

### Локальная проверка production-сборки

```bash
cd frontend
npm install
npm run build
npm run start
```
