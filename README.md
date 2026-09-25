# Kanban

A full-stack Kanban board: React + TypeScript + Tailwind on the frontend, Express + TypeScript + SQLite on the backend. Multiple boards, drag-and-drop lists and cards, card details with due dates and tags, dark mode.

## Structure

- `client/` — Vite + React + TypeScript frontend (Tailwind CSS v4, @dnd-kit for drag-and-drop, TanStack Query for data fetching)
- `server/` — Express + TypeScript API backed by SQLite (`better-sqlite3`)

## Getting started

```bash
npm run install:all   # installs client + server dependencies
npm run dev           # runs the API (port 4000) and the Vite dev server (port 5173) together
```

Open http://localhost:5173. The Vite dev server proxies `/api` requests to the backend.

On first run the server seeds a demo board with a few lists and cards. The SQLite database lives at `server/data.sqlite3` (gitignored) — delete it to reset to the seed data.

## API

REST endpoints under `/api`: `boards`, `lists`, `cards`, each with `POST`/`PATCH`/`DELETE`, plus `PATCH /lists/:id/move` and `PATCH /cards/:id/move` for drag-and-drop reordering (cards can move across lists).
