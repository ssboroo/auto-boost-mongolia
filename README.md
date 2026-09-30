# BOOST.MN — Mongolia Multi-Channel Ads Automation

Монгол хэрэглэгчдэд зориулсан **white-label advertising SaaS**. Нэг Монгол dashboard-аас олон рекламын сувгийн campaign бэлтгэх, төсөв тооцох, provider API-р дамжуулах, үр дүнг нэгтгэн харуулах архитектуртай.

## Supported channels

Primary provider architecture нь дараах сувгуудыг дэмжихээр бэлтгэгдсэн:

- Facebook Ads
- Instagram Ads
- Google Ads
- YouTube Ads
- TikTok Ads
- X / Twitter Ads
- LinkedIn Ads
- Microsoft Ads

Shown нь primary multi-channel provider. Direct Meta integration нь одоогийн fallback/legacy integration хэвээр үлдсэн. Цаашид Google/TikTok зэрэг direct provider adapter нэмэхэд frontend workflow өөрчлөгдөхгүй.

## Customer flow

```text
Монгол хэрэглэгч
  ↓
BOOST.MN бүртгэл / workspace
  ↓
Рекламын сувгууд сонгоно
  Facebook · Instagram · Google · YouTube
  TikTok · X · LinkedIn · Microsoft
  ↓
Зорилго сонгоно
  Messages · Traffic · Leads · Video Views · Sales
  ↓
Creative + Audience + MNT Budget
  ↓
Campaign Preview
  ↓
Local payment / billing guard
  ↓
Explicit user confirmation
  ↓
Ad Provider
  ├─ Shown (primary)
  ├─ Meta Direct (existing fallback)
  └─ Future direct adapters
  ↓
Cross-channel reporting dashboard
```

## Spend safety

Repository нь provider credentials байхгүй үед **safe preview mode**-оор ажиллана.

Shown live campaign submit хийхийн тулд backend environment дээр:

```env
SHOWN_API_BASE_URL=https://api.shown.io
SHOWN_API_KEY=
SHOWN_CAMPAIGN_CREATE_PATH=
SHOWN_LIVE_WRITES=false
```

гэсэн тохиргоо байна.

`SHOWN_LIVE_WRITES=true` болон албан ёсны partner campaign endpoint хоёул тохирсон үед л live write нээгдэнэ. Endpoint-ийг тааж hard-code хийгээгүй.

## Architecture

```text
Browser
  ↓
Next.js frontend
  ↓
Supabase Auth
  ↓
NestJS API
  ├─ /ads/*          Multi-channel provider abstraction
  ├─ /billing/*      MNT pricing / payment
  ├─ /meta/*         Direct Meta integration
  └─ /prelaunch/*    Production checks
       ↓
Provider layer
  ├─ Shown
  └─ Future adapters
       ↓
Ad networks
```

## New multi-channel API

- `GET /ads/providers`
  - provider readiness
  - supported channels
  - preview/live mode

- `POST /ads/quote`
  - MNT ad budget
  - service fee
  - daily budget
  - average budget per selected channel

- `POST /ads/campaign-preview`
  - validates objective/channels
  - prepares provider payload
  - does **not** spend money

- `POST /ads/campaigns`
  - requires `confirm=true`
  - still blocked when provider live writes are disabled

## Frontend

Main routes:

- `/` — 8-channel dashboard
- `/campaigns/new` — multi-channel campaign wizard
- `/campaigns` — campaign management
- `/analytics` — reporting
- `/facebook` — current direct Meta connection
- `/payments` — billing
- `/transactions` — transaction history
- `/admin` — production readiness

Legacy `/boost` болон `/boost/create` routes нь шинэ `/campaigns/new` wizard руу redirect хийнэ.

## Local development

Install:

```bash
npm run install:all
```

Run frontend + backend:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

## Environment

Backend:

```bash
cd backend
cp .env.example .env
```

Frontend:

```bash
cd frontend
cp .env.local.example .env.local
```

Never expose provider secrets, Meta app secret, Supabase service-role key or payment webhook secrets to the frontend.

## Current production dependencies

Codebase нь multi-channel MVP architecture-д шинэчлэгдсэн боловч live public launch хийхийн өмнө дараах external dependencies шаардлагатай:

1. Shown partner/API credentials and approved endpoints
2. Final billing/ad-spend settlement model
3. Provider account/OAuth flow for every enabled channel
4. Meta App Review / Business Verification where required
5. Production Supabase and Vercel secrets
6. Updated Privacy Policy / Terms for all advertising providers
7. Cross-channel reporting persistence
8. Production monitoring and alerting

## Product principle

**One campaign setup, multiple ad channels, one Mongolian dashboard.**
