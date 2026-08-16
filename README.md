# chachapride — Owner Dashboard

The **owner dashboard** for the chachapride ride-hailing platform. A real
ride-hailing web app built with Next.js 14 — riders book rides, drivers accept
them, and the owner monitors everything from a single dashboard with live
stats, a live tracking map, full ride history, and driver approvals.

## Owner features

- 🔐 Real authentication: signup, login, logout (bcrypt password hashing + signed JWT in an httpOnly cookie)
- 📊 Dashboard with live stats: total/completed rides, revenue, active rides, driver counts
- 🗺️ Live tracking map (Leaflet + OpenStreetMap) showing every in-progress ride — pickup, dropoff, and the driver's live position
- 📋 Full rides table with status filtering (requested / accepted / en_route / completed / cancelled)
- 👥 Driver management: review applications, approve or revoke drivers, see vehicle/license/status/ride counts
- 🗄️ Neon Postgres storage: users, drivers, and ride history persisted in the cloud
- 📱 Fully responsive (mobile hamburger nav, responsive tables)

## Tech Stack

- Next.js 14 (App Router), React 18, Tailwind CSS
- PostgreSQL on [Neon](https://neon.tech) via `pg`
- `bcryptjs` for password hashing, `jose` for JWT sessions
- Leaflet / react-leaflet, OpenStreetMap tiles

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
DATABASE_URL="postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require"
JWT_SECRET="<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">"
```

> `.env.local` is gitignored — never commit real credentials.

3. Create the tables and (optionally) seed demo data:

```bash
npm run db:setup
npm run db:seed
```

4. Run:

```bash
npm run dev
```

Open http://localhost:3000

## Demo login (owner)

| Role  | Email                     | Password     |
| ----- | ------------------------- | ------------ |
| Owner | owner@chachapride.com     | password123  |

Other demo accounts are created by `npm run db:seed` (check `scripts/seed.mjs`).

## Owner API

All owner endpoints require a logged-in `owner` role (JWT httpOnly cookie).
Non-owner accounts get `403`, unauthenticated requests get `401`.

| Method | Route                          | Description                                    |
| ------ | ------------------------------ | ---------------------------------------------- |
| POST   | /api/auth/signup               | Create account, sets session cookie            |
| POST   | /api/auth/login                | Log in, sets session cookie                    |
| POST   | /api/auth/logout               | Clears session cookie                          |
| GET    | /api/auth/me                   | Current user                                   |
| GET    | /api/owner/stats               | Dashboard stats (rides, revenue, drivers)      |
| GET    | /api/owner/rides               | All rides (optional `?status=` filter)         |
| GET    | /api/owner/tracking            | Active rides with live driver locations        |
| GET    | /api/owner/drivers             | All drivers with approval + ride counts        |
| POST   | /api/owner/drivers/:id/approve | Approve (`{approved:true}`) / revoke a driver  |

## Project structure

```
app/
  page.js              # Owner dashboard (stats + live map + recent rides)
  rides/page.js        # All rides table with status filter
  drivers/page.js      # Driver management + approvals
  components/Header.js # Sticky responsive header (nav + logout)
  components/LiveMap.js# Lazy-loaded Leaflet tracking map (client only)
  api/auth/*           # Auth endpoints (login/logout/me/signup)
  api/owner/*          # Owner endpoints (stats/rides/tracking/drivers)
  context/             # Auth + Ride React contexts
lib/                   # db, auth (JWT), guards, pricing, geocode
```

## Notes

- Map tiles use the free public OpenStreetMap tile service; for production traffic, switch to a commercial provider or self-hosted tiles.
- Ride prices are estimated from straight-line distance (haversine) + a per-type rate.
