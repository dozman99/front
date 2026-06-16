# SAS Relay — Frontend

Internal SMS Gateway management portal for the Windows Virtualization Team (WVT).
React + TypeScript + Vite, styled with Tailwind v4. Backend is a FastAPI service
(see `sas-relay-04-backend.txt`).

## Stack

- React 18 + TypeScript, Vite
- React Router (routing + role guards)
- TanStack Query (server state)
- Zustand (auth + UI state)
- React Hook Form + Zod (form validation)
- Recharts (throttle chart), Lucide (icons)
- Tailwind CSS v4

## Pages

| Route        | Access            | Purpose                                  |
| ------------ | ----------------- | ---------------------------------------- |
| `/login`     | Public            | Microsoft sign-in (SAML / dev mode)      |
| `/dashboard` | Authenticated     | Overview, Throttle (admin), Audit (admin)|
| `/ban-list`  | Authenticated     | Phone + email ban management             |
| `/settings`  | Admin only        | AD Groups, Auto-Ban Rules                |
| `/check`     | Public            | End-user ban-status lookup               |

## Roles

- **Admin** — full read/write across the portal.
- **Helpdesk** — read-only. Write actions are not rendered (not just hidden), and
  the backend returns 403 if those endpoints are hit directly.

Admins can preview the Helpdesk experience with the **View As** toggle in the top
bar. The real role still governs server-side authorization.

## Setup

```bash
npm install
npm run dev          # http://localhost:5173
```

Environment files (already included):

- `.env.development` → `VITE_API_BASE_URL=http://127.0.0.1:8000`
- `.env.production`  → `VITE_API_BASE_URL=https://sas-relay.yourcompany.internal/api`

The backend must allow `http://localhost:5173` in `ALLOWED_ORIGINS` for local dev,
and all requests are sent with credentials so the `sas_session` cookie rides along.

## Auth flow

1. Click **Sign in with Microsoft** → `POST /auth/saml/login` returns a `redirect_url`.
2. Dev: that URL is the backend dev login page; Prod: the SECDS IDP.
3. Backend sets the `sas_session` cookie and redirects to `/dashboard`.
4. App calls `GET /auth/me` to restore `{ username, name, role }`.

Frontend code is identical in both modes — only the redirect target differs.

## Build & deploy (IIS / Windows Server)

```bash
npm run build        # outputs to dist/
```

Copy `dist/` to IIS and place `web.config` (in repo root) alongside it:

```bat
xcopy /E /Y /I dist\ C:\inetpub\sas-relay\frontend\dist\
copy /Y web.config C:\inetpub\sas-relay\frontend\dist\web.config
```

`web.config` proxies `/api/*` to the FastAPI service on `localhost:8000` and
falls back to `index.html` for SPA routing.

## Project layout

```
src/
  api/         one module per backend resource group
  components/  layout/ (Sidebar, TopBar, RoleGuard) + shared/ (Badge, Drawer, …)
  hooks/       TanStack Query wrappers
  lib/         axios client + formatters
  pages/       Login, Dashboard, BanList, Settings, Check
  router/      route table + ProtectedRoute
  store/       authStore, uiStore
  types.ts     shared types (mirror the backend schema)
```
