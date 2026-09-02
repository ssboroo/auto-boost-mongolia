# Auto Boost Mongolia

**Монгол хэлтэй AI Ads Manager** — Meta Ads Manager-ийн professional workflow, AI quality review, reporting, direct Meta Graph / Marketing API integration.

## Product flow

Facebook холбоно → Кампайн → Зарын багц → Зар → AI шалгалт → Баталгаажуулалт → **PAUSED draft** → хэрэглэгч тусдаа зөвшөөрсний дараа ACTIVE.

## Architecture

```text
Browser
  ↓
Frontend — Next.js / Vercel
  https://auto-boost-mongolia.vercel.app
  ↓ same-origin /api proxy
Backend — NestJS / Vercel Function
  https://auto-boost-api.vercel.app
  ↓
Meta Graph / Marketing API
```

Production browser requests нь frontend-ийн `/api/*` замаар backend рүү proxy хийгдэнэ. Ингэснээр OAuth state/session cookie cross-origin асуудал үүсэхгүй.

## Current functionality

- 2026 premium responsive SaaS UI
- Campaign → Ad Set → Ad 5-step builder
- Budget, audience, placement, creative, UTM controls
- AI quality review + campaign score
- Explicit spend protection / PAUSED-first flow
- Direct Meta OAuth — Windsor ашиглахгүй
- OAuth CSRF state validation
- AES-256-GCM encrypted HttpOnly Meta session cookie
- Long-lived Meta token exchange attempt
- Facebook Page / Post / Ad Account endpoints
- Campaign, Ad Set, Creative, Ad creation endpoints
- Insights endpoint
- Backend health / production readiness checks
- Same-origin production API proxy

## Local development

Backend:

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

Frontend:

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Facebook connection: `http://localhost:3000/facebook`

## Production Vercel setup

### Frontend project

- Root Directory: `frontend`
- Framework: Next.js
- Production domain: `https://auto-boost-mongolia.vercel.app`
- `NEXT_PUBLIC_API_URL` production-д шаардлагагүй. `frontend/vercel.json` `/api/*`-г backend рүү proxy хийнэ.

### Backend project

- Root Directory: `backend`
- Framework: Other
- Production domain: `https://auto-boost-api.vercel.app`

Required environment variables:

```env
META_APP_ID=
META_APP_SECRET=
META_GRAPH_VERSION=v25.0
SESSION_SECRET=<long-random-secret>
FRONTEND_ORIGIN=https://auto-boost-mongolia.vercel.app
META_REDIRECT_URI=https://auto-boost-mongolia.vercel.app/api/meta/auth/callback
```

`META_APP_SECRET` болон `SESSION_SECRET`-ийг frontend рүү хэзээ ч гаргахгүй.

## Meta Developer App

Valid OAuth Redirect URI:

```text
https://auto-boost-mongolia.vercel.app/api/meta/auth/callback
```

Requested permissions currently include ads/page management scopes. Public users ашиглуулахын өмнө шаардлагатай permissions дээр Meta App Review / Business Verification хийсэн байх ёстой.

## Core backend endpoints

- `GET /` — API status
- `GET /health`
- `GET /meta/status`
- `GET /meta/session`
- `GET /meta/auth/url`
- `GET /meta/auth/callback`
- `POST /meta/logout`
- `GET /meta/me`
- `GET /meta/pages`
- `GET /meta/ad-accounts`
- `GET /meta/pages/:pageId/posts`
- `GET/POST /meta/ad-accounts/:adAccountId/campaigns`
- `POST /meta/ad-accounts/:adAccountId/adsets`
- `POST /meta/ad-accounts/:adAccountId/creatives/existing-post`
- `POST /meta/ad-accounts/:adAccountId/ads`
- `POST /meta/objects/:objectId/status`
- `GET /meta/ad-accounts/:adAccountId/insights`

## Spend safety

Campaign, Ad Set, Ad create endpoints нь frontend-ээс `ACTIVE` ирсэн ч backend дээр **PAUSED** төлөвөөр үүсгэнэ. ACTIVE болгох үйлдэл нь тусдаа explicit status action байна.

## Before broad public launch

Current code is a hardened MVP foundation. Multi-tenant paid SaaS болгохын өмнө дараах layer-ууд нэмэгдэнэ:

- User authentication
- Organization/workspace model
- Database-backed encrypted Meta token storage per tenant
- Subscription / billing
- Audit logs
- Rate limiting / abuse protection
- Production observability + error tracking
- Legal/privacy pages and account deletion flow
- Meta App Review / Business Verification
