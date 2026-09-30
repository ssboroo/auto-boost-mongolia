# BOOST.MN UI/UX System

## Design
- White + blue visual system for light mode
- Deep navy + blue visual system for dark mode
- Responsive sidebar/header, cards, tables, forms and campaign wizard
- Shared CSS tokens in `frontend/app/globals.css`

## Language
- Mongolian and English switch available globally
- Preference persists in localStorage
- Core user flows use explicit bilingual copy
- Legacy technical screens use a translation bridge until every backend-origin message is localized

## Theme
- Light and dark mode switch available in the app shell, login and public legal pages
- Preference persists in localStorage
- All shared management UI uses theme variables

## Core flows ready without Shown
- Auth / workspace
- Dashboard
- 8-channel campaign builder
- Budget quote in MNT
- Safe campaign preview
- Local preview recovery
- Direct Meta OAuth/readiness/campaign management
- Meta analytics
- Platform fee checkout
- Transactions and receipts
- Connections readiness page
- Admin / prelaunch checks
- Privacy / Terms / Data deletion

## External dependencies
The UI and provider-neutral workflow do not require Shown to run in preview mode.

Live non-Meta campaign submission still requires an approved provider API credential/endpoint and the final provider media-spend settlement agreement.

The connected Supabase project should be active before database-backed persistence or schema changes are verified.
