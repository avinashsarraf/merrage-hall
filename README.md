# Merrage — venue management, made for moments that matter

Merrage is a responsive marriage-hall and event-venue booking SaaS prototype. It includes a conversion-focused marketing site, a role-aware venue workspace, an event inquiry flow, and a small Node API with persistent demo data.

## Run locally

```sh
npm install
npm run dev
```

Vite serves the web app on port `5173`; the Express API runs on `3001` and is proxied under `/api` by Vite. Both services bind to `0.0.0.0` for preview environments. Build the client with `npm run build`.

## Try the app

- Landing page: `http://localhost:5173/`
- Open **Log in** and use any email/password, then choose an account type:
  - Marriage hall owner
  - Venue staff
  - Merrage SaaS owner (platform overview)
  - Couple / event client (public inquiry form)
- Owner workspace: bookings, clients, venues, menus/packages, add-ons/assets, team, website/domains, and settings.
- Create, edit, confirm, search/filter, and delete bookings; create/edit/delete venue, menu, and asset records.
- Public booking requests are added to the same workspace as inquiries.

## Persistence and API

The web client hydrates from `GET /api/data`, writes changes to `PUT /api/data`, and keeps a browser-local fallback. The API seeds realistic demo records on first start and persists workspace changes to `data/store.json` (intentionally git-ignored).

- `GET /api/health` — service health
- `GET /api/data` — workspace data
- `PUT /api/data` — persist workspace data
- `POST /api/auth/login` — demo role-aware sign-in

## Production note

This is a runnable product prototype, not a hardened multi-tenant deployment. The included sign-in endpoint deliberately accepts demo credentials and returns a demo token; workspace persistence is a single local JSON store. Before handling real client data, replace the demo auth adapter with a proper identity provider, enforce tenant/role authorization on every API route, move persistence to a managed database, and wire payment, email, and domain provisioning integrations.
