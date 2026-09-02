# Meta Direct Integration

Auto Boost Mongolia нь Windsor ашиглахгүй. Backend нь Meta Graph / Marketing API-тай шууд холбогдоно.

## Production OAuth flow

1. Browser `https://auto-boost-mongolia.vercel.app/facebook` дэлгэцийг нээнэ.
2. Frontend `GET /api/meta/status` болон `GET /api/meta/session` хүсэлт илгээнэ.
3. Vercel frontend rewrite `/api/*` хүсэлтийг `https://auto-boost-api.vercel.app/*` рүү proxy хийнэ.
4. `Facebook Ads холбох` дарахад backend cryptographically random OAuth `state` үүсгэн HttpOnly cookie-д хадгална.
5. Хэрэглэгч Facebook-ийн албан ёсны OAuth dialog дээр permissions зөвшөөрнө.
6. Meta callback URL:
   `https://auto-boost-mongolia.vercel.app/api/meta/auth/callback`
7. Backend callback нь OAuth `state`-ийг cookie-тэй timing-safe байдлаар шалгана.
8. Authorization code-ийг Meta access token-р сольж, боломжтой бол long-lived token болгож upgrade хийнэ.
9. Access token-ийг AES-256-GCM-р `SESSION_SECRET` ашиглан encrypt хийж HttpOnly cookie-д хадгална.
10. Raw access token frontend JavaScript-д буцаахгүй.

## Production env

```env
META_APP_ID=
META_APP_SECRET=
META_GRAPH_VERSION=v25.0
SESSION_SECRET=<long-random-secret>
FRONTEND_ORIGIN=https://auto-boost-mongolia.vercel.app
META_REDIRECT_URI=https://auto-boost-mongolia.vercel.app/api/meta/auth/callback
```

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

`ACTIVE` болгох нь тусдаа explicit `/meta/objects/:objectId/status` action-аар хийгдэнэ. UI дээр хэрэглэгч яг ямар entity, ямар төсөвтэйгээр идэвхжүүлэхээ хараад батална.

## Current token storage vs full multi-tenant SaaS

Одоогийн encrypted HttpOnly cookie session нь secure single-browser MVP flow-д тохиромжтой. Олон байгууллага / хэрэглэгчтэй production SaaS дээр:

- app user authentication,
- organization/workspace ownership,
- database-backed encrypted token vault,
- token expiry/refresh metadata,
- audit log,
- account disconnect/deletion,
- access control

нэмэх шаардлагатай.
