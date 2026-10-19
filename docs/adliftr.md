# AdLiftr connection bootstrap

Official references (checked 2026-10-19):
- https://adliftr.com/developers
- https://api.adliftr.com/developers
- https://adliftr.com/pricing

The public developer page documents a Bearer-authenticated v1 API with Meta,
TikTok, Google and Snapchat support. White-label resale and embedded customer
OAuth permission have not been established. This is not a Shown API.

## Implemented

Server-only `ADLIFTR_API_KEY` and an explicit `ADLIFTR_OPERATOR_USER_IDS` allowlist.
Authenticated requests use the existing `x-app-access-token` header.

- GET /ads/adliftr/status: configuration readiness, no network call.
- GET /ads/adliftr/workspaces: real read-only provider connection check.

Only explicitly allowlisted application users can inspect this shared provider
account, including its workspace list. Workspace owner/admin membership alone
does not grant access. Timeouts, non-JSON responses and upstream failures are
handled without echoing secrets or upstream error bodies. Writes are disabled.

## Remaining before campaign integration

1. Create an AdLiftr account; generate a Developer API key and install it in the
   backend environment, never in frontend variables or committed files.
2. Set the operator allowlist and verify workspaces using a real account.
3. Obtain the full OpenAPI schema (not accessible during implementation), verify
   account discovery, objectives, budget currency and campaign required fields.
4. Implement persisted application-workspace to provider-workspace/account
   ownership mappings before exposing any customer-facing provider data.
5. Implement paused campaign creation, idempotency and persisted campaign IDs;
   then verify performance/lifecycle operations with connected test accounts.
6. Enforce payment settlement, FX conversion and spend authorization before any
   activation. A paused campaign is still a real provider write, not a simulation.

Existing Shown preview flow is unchanged. This bootstrap does not claim campaign
launch, payment collection, automatic reporting or production connectivity.
