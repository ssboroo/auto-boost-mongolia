# BOOST.MN AI Marketing Suite

## Business AI Scanner

The scanner can combine three sources into one business profile:

1. Public website content
2. A Facebook Page connected through Meta OAuth
3. The Instagram professional account connected to that Page

The website is optional. A user can scan Facebook + Instagram without entering a website.

### Website scan

The backend fetches public HTML only and blocks localhost, private IP ranges, private redirects, non-HTTP protocols and oversized responses.

Extracted signals include:
- title and description
- headings and visible text
- category keywords
- offer/highlight candidates

### Facebook Page scan

The scanner uses the user's existing Meta connection. It reads managed Pages and keeps Page access tokens backend-only.

Signals include:
- Page name/category/about/description/website
- follower count when available
- recent Page posts and captions

### Instagram scan

For a connected Instagram professional account the scanner reads:
- username/name/bio/website
- follower/following/media counts when available
- recent media captions and media type

The OAuth request includes `instagram_basic` in addition to the existing Page and Ads scopes. Production access remains subject to Meta App Review and the permissions actually granted to the app/account.

## Unified scan result

Sources are merged into:
- business name
- detected category
- detected brand tone
- keywords
- content pillars
- offer/highlight candidates
- suggested campaign objective
- recommended channels
- starter audience
- campaign headline + primary text seed

The result is stored locally in the browser as `boost_business_scan` so the rest of the UI can work while durable database storage is unavailable.

## Scanner → Campaign

"Use in campaign" stores a one-time `boost_ai_campaign_seed` and opens `/campaigns/new`.

The campaign wizard pre-fills:
- channels
- objective
- destination URL
- headline
- primary text
- city
- age range
- interests

The seed is removed after it is applied.

## Other AI Studio modules

- Marketing Assistant
- Strategy Generator
- Creative Studio
- Optimization Center
- Asset Library
- Tracking Center

These modules currently use the local BOOST analysis engines and do not require Shown.

Live cross-channel campaign execution and automatic optimization remain disabled until approved provider credentials and endpoints are available.
