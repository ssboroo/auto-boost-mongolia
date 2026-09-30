# Multi-Channel Advertising Architecture

## Goal

BOOST.MN should not couple the product UI to one advertising network. The frontend submits a provider-neutral campaign model and the backend translates it through provider adapters.

## Channel model

Current provider-neutral IDs:

```text
facebook
instagram
google
youtube
tiktok
x
linkedin
microsoft
```

## Provider contract

The current Shown adapter exposes:

- capability/readiness status
- provider-neutral payload translation
- safe preview
- guarded live campaign submission

Additional adapters should follow the same pattern. Examples:

```text
AdsService
  ↓
Provider Router
  ├─ ShownProvider
  ├─ MetaDirectProvider      (future migration of existing Meta service)
  ├─ GoogleDirectProvider    (future)
  ├─ TikTokDirectProvider    (future)
  └─ MicrosoftDirectProvider (future)
```

The customer-facing wizard must not need to know which provider executes a campaign.

## Budget safety

A quote is not an authorization to spend.

Recommended production state machine:

```text
DRAFT
  ↓
PREVIEW_READY
  ↓
PAYMENT_PENDING
  ↓
FUNDS_CONFIRMED
  ↓
USER_CONFIRMED
  ↓
SUBMITTING
  ↓
PAUSED / PROVIDER_DRAFT
  ↓
ACTIVE
```

Never activate campaigns from a payment webhook alone. Payment confirms funds; an explicit campaign activation policy/user action should control spend.

## Provider capability checks

A channel should only be offered as live when:

1. Provider account is approved.
2. Required ad-network connection exists.
3. Required objective is supported.
4. Billing/spend model is configured.
5. Provider reports the integration healthy.

Until then it may remain selectable for preview with a clear readiness label.

## Reporting

Normalize provider metrics into a common model:

- spend
- impressions
- reach
- clicks
- ctr
- cpc
- cpm
- messages
- leads
- conversions
- revenue
- roas
- video_views

Store both normalized data and the raw provider payload for debugging/audit purposes.

## Mongolia-specific UX

Users should see:

- MNT first
- simple objectives rather than ad-network jargon
- channel toggles
- daily and total budget
- service fee separated from advertising spend
- clear provider/account connection state
- one combined dashboard plus per-channel drill-down

## Security

- provider secrets backend-only
- encrypted OAuth/token vault
- strict tenant isolation
- idempotent payment and campaign submissions
- webhook signature verification
- audit log for submit/activate/pause/refund/admin changes
- rate limiting
- no automatic live spend from unverified provider payloads
