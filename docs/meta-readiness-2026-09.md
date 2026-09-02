# Meta ad readiness — 2026-09

Auto Boost onboarding flow:

1. Facebook OAuth connect.
2. Load ad accounts from `me/adaccounts`.
3. Check account status / disable reason and billing readiness.
4. If no ad account exists, guide the user to Meta Business/Ads Manager to create one.
5. If an ad account exists but billing cannot be confirmed, guide the user to Meta Billing & payments to add/verify a payment method.
6. Only show Boost-ready state when the account is active and billing readiness is confirmed by Meta data or the user explicitly confirms after completing Meta billing setup.

Important: Auto Boost never stores card details and never charges Meta ad spend. Meta charges the user's own Ad Account payment method. Campaign, ad set and ad creation remain PAUSED-first until explicit user activation.
