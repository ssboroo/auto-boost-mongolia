# Auto Boost Mongolia

**Монгол хэлтэй AI Ads Manager** — Meta Ads Manager-ийн professional workflow, AI quality review, reporting, direct Meta Graph / Marketing API integration.

## Product flow

Auto Boost-д нэвтрэх → Workspace → Facebook холбоно → Кампайн → Зарын багц → Зар → AI шалгалт → Баталгаажуулалт → **PAUSED draft** → хэрэглэгч тусдаа зөвшөөрсний дараа ACTIVE.

## Architecture

```text
Browser
  ↓
Supabase Auth
  ↓
Frontend — Next.js / Vercel
  https://auto-boost-mongolia.vercel.app
  ↓ same-origin /api proxy
Backend — NestJS / Vercel Function
  https://auto-boost-api.vercel.app
  ↓                 ↓
Supabase tenant DB  Meta Graph / Marketing API
```

Production browser requests нь frontend-ийн `/api/*` замаар backend рүү proxy хийгдэнэ. App user session нь Supabase Auth-аар баталгаажна. Meta access token нь browser-д хадгалагдахгүй; тухайн workspace-ийн encrypted token vault-д хадгалагдана.

## Current functionality

- 2026 premium responsive SaaS UI
- Login / signup / password reset / sign out
- Automatic workspace provisioning per user
- Row Level Security tenant isolation
- Campaign → Ad Set → Ad 5-step builder
- Budget, audience, placement, creative, UTM controls
- AI quality review + campaign score
- Explicit spend protection / PAUSED-first flow
- Direct Meta OAuth — Windsor ашиглахгүй
- OAuth CSRF state + expiry + app-user validation
- AES-256-GCM encrypted Meta token vault in Supabase
- Long-lived Meta token exchange attempt
- Facebook Page / Post / Ad Account endpoints
- Campaign, Ad Set, Creative, Ad creation endpoints
- Insights endpoint
- Audit logs for sensitive Meta actions
- Global backend rate limiting
- Backend health / production readiness checks
- Same-origin production API proxy
- Baseline production security headers

## Supabase data model

- `profiles`
- `workspaces`
- `workspace_members`
- `meta_connections`
- `ad_drafts`
- `audit_logs`

RLS асаалттай. Security helper/trigger functions нь exposed `public` schema биш `private` schema-д байрлана. Supabase security advisor дээр blocking security warning байхгүй.

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
- Login: `http://localhost:3000/login`
- Facebook connection: `http://localhost:3000/facebook`

## Production Vercel setup

### Frontend project

- Root Directory: `frontend`
- Framework: Next.js
- Production domain: `https://auto-boost-mongolia.vercel.app`
- `NEXT_PUBLIC_API_URL` production-д шаардлагагүй. `frontend/vercel.json` `/api/*`-г backend рүү proxy хийнэ.

Optional explicit public config:

```env
NEXT_PUBLIC_SUPABASE_URL=https://rnujhqmtusuddxygarto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_OXj1FlWu2QkUM9A2XSIR1Q_ZYcSJ3ob
```

### Backend project

- Root Directory: `backend`
- Framework: Other
- Production domain: `https://auto-boost-api.vercel.app`

Required environment variables:

```env
META_APP_ID=2154953748431672
META_APP_SECRET=
META_GRAPH_VERSION=v25.0
SESSION_SECRET=<long-random-secret>
SUPABASE_URL=https://rnujhqmtusuddxygarto.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_OXj1FlWu2QkUM9A2XSIR1Q_ZYcSJ3ob
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

## Supabase Auth production configuration

Supabase Auth dashboard дээр:

- Site URL: `https://auto-boost-mongolia.vercel.app`
- Allowed redirect URL-д `https://auto-boost-mongolia.vercel.app/login` нэмнэ.

Email confirmation ашиглаж байгаа бол production email delivery/template-ээ мөн шалгана.

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

Campaign, Ad Set, Ad create endpoints нь frontend-ээс `ACTIVE` ирсэн ч backend дээр **PAUSED** төлөвөөр үүсгэнэ. ACTIVE болгох үйлдэл нь тусдаа explicit status action бөгөөд audit log-д бүртгэгдэнэ.

## Remaining launch dependencies

Codebase production-hardened боловч олон нийтэд Meta Ads SaaS болгон бүрэн нээхийн өмнө гаднын дараах зүйлс заавал дууссан байна:

- Meta App Review / шаардлагатай Business Verification
- Supabase Auth production Site URL / redirect configuration
- Vercel production secrets verification
- Privacy Policy / Terms / account deletion policy
- Хэрэв төлбөртэй бол subscription/billing integration
- Production observability/error tracking болон alerting
