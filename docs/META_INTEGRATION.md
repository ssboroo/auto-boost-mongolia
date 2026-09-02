# Meta Direct Integration

Auto Boost Mongolia нь Windsor ашиглахгүй. Backend нь Meta Graph / Marketing API-тай шууд холбогдоно.

## Production OAuth flow

1. Хэрэглэгч Supabase Auth-аар Auto Boost-д нэвтэрнэ.
2. Browser `https://auto-boost-mongolia.vercel.app/facebook` дэлгэцийг нээнэ.
3. Frontend `GET /api/meta/status` болон `GET /api/meta/session` хүсэлт илгээнэ. Supabase access token нь `x-app-access-token` header-аар backend рүү дамжина.
4. Vercel frontend rewrite `/api/*` хүсэлтийг `https://auto-boost-api.vercel.app/*` рүү proxy хийнэ.
5. `Facebook Ads холбох` дарахад backend Auto Boost хэрэглэгчийг баталгаажуулж, cryptographically random OAuth `state` үүсгэн богино хугацаатай HttpOnly cookie-д хадгална.
6. Хэрэглэгч Facebook-ийн албан ёсны OAuth dialog дээр permissions зөвшөөрнө.
7. Meta callback URL:
   `https://auto-boost-mongolia.vercel.app/api/meta/auth/callback`
8. Backend callback нь OAuth `state`, хугацаа, Auto Boost user session-ийг timing-safe байдлаар шалгана.
9. Authorization code-ийг Meta access token-р сольж, боломжтой бол long-lived token болгож upgrade хийнэ.
10. Meta profile-ийг уншаад тухайн хэрэглэгчийн workspace-тай холбоно.
11. Meta access token-ийг `SESSION_SECRET`-ээс үүсгэсэн AES-256-GCM key-р encrypt хийж Supabase `meta_connections` table-д хадгална.
12. Raw Meta access token browser JavaScript-д хэзээ ч буцаахгүй.

## Multi-tenant data model

Supabase дээр:

- `profiles` — app user profile
- `workspaces` — tenant/workspace
- `workspace_members` — owner/admin/member membership
- `meta_connections` — workspace бүрийн encrypted Meta token vault
- `ad_drafts` — Meta руу publish хийхээс өмнөх draft payload
- `audit_logs` — sensitive create/status/connect/disconnect үйлдлийн audit trail

Бүх tenant table дээр Row Level Security асаалттай. Workspace membership helper нь exposed `public` schema биш `private` schema-д байрлана.

## Production env

Backend:

```env
META_APP_ID=
META_APP_SECRET=
META_GRAPH_VERSION=v25.0
SESSION_SECRET=<long-random-secret>
SUPABASE_URL=https://rnujhqmtusuddxygarto.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_OXj1FlWu2QkUM9A2XSIR1Q_ZYcSJ3ob
FRONTEND_ORIGIN=https://auto-boost-mongolia.vercel.app
META_REDIRECT_URI=https://auto-boost-mongolia.vercel.app/api/meta/auth/callback
```

Frontend production нь `/api` same-origin proxy ашиглана. Supabase URL болон publishable key нь public client configuration тул secret биш.

## Requested Meta permissions

- `ads_read`
- `ads_management`
- `business_management`
- `pages_show_list`
- `pages_read_engagement`
- `pages_read_user_content`
- `pages_manage_ads`

Public хэрэглэгчдэд ашиглуулахын өмнө Meta-ийн шаарддаг permissions дээр App Review болон шаардлагатай тохиолдолд Business Verification хийнэ.

## Spend safety

Create operations:

- Campaign
- Ad Set
- Ad

эдгээр нь backend дээр **заавал `PAUSED`** төлөвөөр үүснэ. Frontend input дотор `ACTIVE` ирсэн ч create method ignore хийнэ.

`ACTIVE` болгох нь тусдаа explicit `/meta/objects/:objectId/status` action-аар хийгдэнэ. Үйлдэл audit log-д бүртгэгдэнэ.

## API protection

Backend дээр global request throttling ажиллана. Meta API алдааг normalize хийж frontend-д хэрэгтэй message/status/code хэмжээнд буцаана. Meta App Secret болон encrypted token vault-ийн secret frontend bundle-д орохгүй.
