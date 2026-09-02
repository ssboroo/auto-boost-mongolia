# Auto Boost Mongolia — MNT pricing + Wire.mn

## Pricing model

Meta ad budget is entered in USD. The UI converts it to MNT using the Bank of Mongolia published USD/MNT reference rate and shows the rate date/source.

Example formula:

```text
Meta budget MNT = Meta budget USD × USD/MNT rate
Service fee MNT = Meta budget MNT × SERVICE_FEE_PERCENT / 100
Display total MNT = Meta budget MNT + Service fee MNT
```

Important: the Meta ad spend is **not** collected by Wire. It is charged by Meta using the Ad Account's own payment method. Wire collects only the Auto Boost service fee.

## Wire architecture

Use a dedicated Wire project for Auto Boost service fees. Connect that Wire project to the separate settlement/bank account intended for service-fee income.

Backend flow:

1. `GET /billing/quote?usd=35`
2. `POST /billing/fee-checkout`
3. Backend creates Wire `PaymentIntent` in MNT minor units.
4. Backend creates a hosted checkout session.
5. Browser redirects to `pay.wire.mn`.
6. Wire sends webhook events to the backend.
7. Backend first requires source IP `65.109.117.186`.
8. Backend validates `WirePayment-Signature: t=<unix>,v1=<hex>` using HMAC-SHA256 over `<t>.<rawBody>`.
9. Webhooks older than 5 minutes are rejected.
10. `endpoint.verification` returns HTTP 2xx so a pending endpoint can be activated.
11. Only a valid `payment_intent.succeeded` event marks the service fee paid.

Production webhook URL:

```text
https://auto-boost-mongolia.vercel.app/api/billing/wire/webhook
```

## Required backend env

```env
SERVICE_FEE_PERCENT=10
WIRE_API_KEY=sk_live_...
WIRE_WEBHOOK_SECRET=<signing-secret-shown-once-by-Wire>
WIRE_WEBHOOK_IP=65.109.117.186
WIRE_FALLBACK_PAYMENT_LINK=https://pay.wire.mn/link/plink_dkhdqwogskwyws4rtzk6f5s5lq
SUPABASE_SERVICE_ROLE_KEY=...
USD_MNT_FALLBACK_RATE=3595.21
USD_MNT_FALLBACK_RATE_DATE=2026-09-01
```

`WIRE_API_KEY`, `WIRE_WEBHOOK_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY` are backend-only secrets and must never be committed or exposed through `NEXT_PUBLIC_*` variables.

A live API key that has been pasted into chat, source code, logs, screenshots, or another public location must be revoked/rotated before production use.

## Wire endpoint activation

Create the endpoint in Wire with:

```text
https://auto-boost-mongolia.vercel.app/api/billing/wire/webhook
```

Save the signing secret immediately in the backend secret store. Wire only shows it once. When the endpoint is `pending`, press **Баталгаажуулах** in Wire. Wire sends a signed `endpoint.verification` ping. Auto Boost verifies IP + HMAC + timestamp and returns a 2xx response, allowing Wire to activate the endpoint.

## Payment link

The provided `pay.wire.mn/link/...` page is kept only as an optional manual/fallback payment link. It is **not** the primary dynamic fee flow because Auto Boost service fees change with the user's USD boost budget and current USD/MNT rate. Dynamic fees use a PaymentIntent and hosted checkout session generated for the exact MNT amount.
