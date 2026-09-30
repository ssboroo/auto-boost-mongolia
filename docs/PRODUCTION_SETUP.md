# Production setup status

## Supabase

Production project: `rnujhqmtusuddxygarto`

Verified on 2026-09-30:
- project status: ACTIVE_HEALTHY
- primary workspace exists
- primary user is workspace `owner`
- RLS is enabled on tenant tables
- billing settings initialized
- new auth users automatically receive:
  - profile
  - workspace
  - owner membership
  - default billing settings

## Backend secret

For elevated server-only Supabase operations, prefer:

```env
SUPABASE_SECRET_KEY=sb_secret_...
```

Legacy fallback remains supported temporarily:

```env
SUPABASE_SERVICE_ROLE_KEY=...
```

Never expose either value through `NEXT_PUBLIC_*` variables.

## Vercel

The repository is already linked to two successful Vercel projects:
- frontend: `auto-boost-mongolia`
- backend: `auto-boost-api`

The frontend rewrite sends `/api/*` to `https://auto-boost-api.vercel.app/*`.

Required production backend variables:
- `SESSION_SECRET`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (preferred) or legacy service-role key
- Meta variables when enabling Meta OAuth
- Wire variables when enabling payment checkout/webhooks

The ChatGPT Vercel connector must be authorized for team scope `ssboroostore-6768` before it can inspect or modify these environment variables.
