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

### Вариант 1 (рекомендуемый): Root Directory = `frontend`

1. В Vercel выберите **Add New → Project** и импортируйте репозиторий.
2. В настройках проекта установите **Root Directory** → `frontend`.
3. Framework Preset определится автоматически как **Next.js**.
4. Build / Install / Output команды можно оставить по умолчанию.
5. Environment Variables (мок-режим включён по умолчанию через `frontend/vercel.json`):
   - `NEXT_PUBLIC_USE_MOCK=true` — отдавать данные из локальных мок-роутов.
   - `NEXT_PUBLIC_API_URL=https://<ваш-бэкенд>` — когда появится реальный бэкенд, переключите `NEXT_PUBLIC_USE_MOCK=false`.
6. Нажмите **Deploy**.

### Вариант 2: Root Directory = корень репозитория

В корне лежит `vercel.json`, который сам заходит в `frontend/` для install/build. Дополнительно ничего настраивать не нужно.

### Vercel CLI

```bash
npm i -g vercel
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
