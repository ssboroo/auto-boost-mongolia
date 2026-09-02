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
6. Wire sends `payment_intent.succeeded` to the webhook.
7. Backend verifies `WirePayment-Signature` against the raw body.
8. Only a verified webhook marks the service fee paid.

Production webhook URL:

```text
https://auto-boost-mongolia.vercel.app/api/billing/wire/webhook
```

## Required backend env

```env
SERVICE_FEE_PERCENT=10
WIRE_API_KEY=sk_live_...
WIRE_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=...
USD_MNT_FALLBACK_RATE=3595.21
USD_MNT_FALLBACK_RATE_DATE=2026-09-01
```

`WIRE_API_KEY`, `WIRE_WEBHOOK_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY` are backend-only secrets and must never be committed or exposed through `NEXT_PUBLIC_*` variables.

## Wire setup

Create a separate Wire project such as `Auto Boost Service Fee`, connect that project to the fee settlement account, activate the desired payment operators, then create a live API key and webhook endpoint.

During development use `sk_test_...` and Wire sandbox. Production uses `sk_live_...` only after merchant/operator activation is complete.
