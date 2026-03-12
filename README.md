# Stormhaven Store

Professional Minecraft server store for **Stormhaven** (`mc.stormhaven.fun`) built with Next.js + Tailwind frontend and Express + MongoDB backend.

## Features

- Dark black + emerald gaming UI with responsive layout.
- Home, Store, Ranks, Crate Keys, Cart, Checkout, Account, and Admin pages.
- JWT auth with user/admin role protection.
- Stripe webhook verification and PayPal configuration.
- RCON execution after successful purchase with command logging and retry job.
- Mojang username validation endpoint.
- Live server status + player counter + leaderboard endpoint.
- Discount code management and revenue stats in admin.
- API rate limiting and validation middleware.

## Project Structure

```txt
frontend/          # Next.js + React + Tailwind
backend/           # Express API, MongoDB models, JWT auth, payment + RCON integration
docker-compose.yml # Local MongoDB for development
```

## Setup

### 1) Start MongoDB

```bash
docker compose up -d mongo
```

### 2) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

### 3) Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`, backend on `http://localhost:5000`.

## Payment Integration

### Stripe

1. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `backend/.env`.
2. Configure webhook endpoint:
   - `POST /api/payments/webhook/stripe`
3. Use Stripe CLI locally:

```bash
stripe listen --forward-to localhost:5000/api/payments/webhook/stripe
```

### PayPal

1. Create REST app in PayPal developer dashboard.
2. Add `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`.
3. Extend `paymentController` for create/capture order if you want full server-side PayPal order capture.

## Connect Website to Minecraft Server (RCON)

1. Enable RCON in your Minecraft server config:
   - `enable-rcon=true`
   - `rcon.password=<secure password>`
   - `rcon.port=25575`
2. Set `RCON_HOST`, `RCON_PORT`, and `RCON_PASSWORD` in backend `.env`.
3. Add rank and crate commands to each product, e.g.:
   - `lp user {player} parent set vip`
   - `crate give {player} legendary 3`
4. After successful payment webhook, commands are executed automatically and logged in `CommandLog`.
5. Failed commands are retried every minute by background retry job.

## Security Notes

- JWT-based auth and role checks for admin routes.
- Stripe webhook signature verification.
- Input validation via `express-validator`.
- API rate limiting enabled globally.
- HTTPS ready behind reverse proxy (Nginx/Cloudflare).

## Deployment Notes

- Deploy frontend to Vercel/Netlify with environment variables from `frontend/.env.example`.
- Deploy backend to VPS/Render/Fly.io and expose port `5000` (or configured `PORT`).
- Use managed MongoDB (MongoDB Atlas recommended).
- Place backend behind HTTPS reverse proxy and allow Stripe webhook access.
