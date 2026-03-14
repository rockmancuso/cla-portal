# CLA Member Portal

React/Vite single-page application for authenticated CLA members. The portal is embedded in the CLA HubSpot member experience and surfaces membership data, renewal status, profile management, support links, and event activity sourced from HubSpot, WordPress, and the Eventbrite sync pipeline.

## What the Portal Does

- Authenticates users through HubSpot CMS membership access. If a visitor can load the protected page and `window.hubspotPageData` is present, the SPA treats them as signed in.
- Shows a personalized dashboard with membership status, paid-through date, current term start, and member-since date.
- Differentiates active members from non-members using HubSpot `member_status`.
- Lets members update profile/contact details directly in HubSpot.
- Shows each member's registered events from HubSpot custom objects synced from Eventbrite.
- Shows upcoming public CLA events from WordPress / The Events Calendar.
- Links users directly to the canonical WordPress event page instead of keeping Eventbrite as the primary destination.
- Provides membership support shortcuts and links into the broader CLA member site.

## Recent Updates

### Auto-Renewal and Membership Billing

Recent changes expanded membership renewal handling from a simple reminder into a fuller HubSpot-backed auto-renewal experience:

- The UI now reads three HubSpot-backed renewal signals:
  - `on_auto_renewal`
  - `auto_renewal_request`
  - `has_stored_payment_info`
- Members with an active subscription see subscription details including status, next billing date, amount, and billing frequency.
- Members without auto-renewal can submit an auto-renewal request directly from the portal.
- If payment information is not yet stored, the portal still accepts the request and explains that auto-renewal will activate after the next payment.
- Members with active auto-renewal can open a preferences dialog and cancel the HubSpot subscription at the next renewal date.
- Renewal messaging now changes based on real state:
  - expiring soon and not enrolled
  - expiring soon and already on auto-renewal
  - request submitted but pending activation

Important deployment note:

- Renewal UI is controlled by `VITE_HIDE_RENEWAL_UI`.
- The current `deploy.sh` builds production with `VITE_HIDE_RENEWAL_UI=true`, so renewal controls are currently suppressed unless that build behavior is changed.

### Enhanced Events Integration

The events area was significantly reworked:

- Upcoming events now come from WordPress / The Events Calendar REST API, not directly from Eventbrite.
- The portal filters to events in the next 3 months and shows up to 5 in the dashboard.
- Registered events still come from HubSpot custom object records populated by the Eventbrite sync Lambda.
- Registration cards now prefer `wordpress_event_url` and otherwise fall back to `event_url`, so users are sent straight to the WordPress event page whenever a mapped WP event exists.
- The Eventbrite sync Lambda now looks up the matching WordPress event URL and writes it back into HubSpot registration records.
- Registration cards include richer synced metadata such as status, ticket type, order date, attendee IDs, and canonical event URLs.
- Cancelled and refunded registrations are visually distinguished in the UI.

## Functional Overview

### Dashboard Experience

- Hero section with profile update and sign-out actions.
- Summary cards for:
  - membership status
  - paid through
  - current term start
  - member since
- Priority membership state messaging based on expiration timing.
- Separate member and non-member experiences.

### Membership Section

- Active members see:
  - membership type
  - member since
  - company name
  - renewal information from HubSpot
  - auto-renewal/subscription controls when enabled
- Non-members see:
  - join CTA
  - benefits overview
  - links to join and review benefits
- Membership health is derived from `membership_paid_through__c`.
- Active member detection uses a strict allowlist in code: HubSpot `member_status = current`.

### Profile Editing

The profile modal updates HubSpot contact properties directly through the proxy API.

Supported fields include:

- first name
- last name
- email
- total laundries
- work phone
- mobile phone
- SMS consent
- address
- address line 2
- city
- country
- state / province
- postal code

### Events Area

- `My Registered Events`
  - Loaded from HubSpot custom object `p19544225_eventbrite_registrations`
  - Queried by contact email -> contact ID -> registration associations -> batch read
  - Displays status badges such as Registered, Attended, Cancelled, and Refunded
- `Upcoming Events`
  - Loaded from WordPress `wp-json/tribe/events/v1/events`
  - Uses WordPress as the canonical event source for the public events list
- `View All Events`
  - Opens `https://laundryassociation.org/events/`

### Navigation and Support

- Member content nav links to CLA pages like profile, store, resources, CLAdvantage Rewards, and CLA Business Solutions.
- Quick Support card includes:
  - email support
  - call support
  - subscription preferences

## Architecture

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui primitives
- TanStack Query

### Primary Data Sources

- HubSpot personalization tokens via `window.hubspotPageData`
- HubSpot CRM API through AWS API Gateway + Lambda proxy
- WordPress / The Events Calendar REST API
- Eventbrite API, primarily through the sync Lambda

### Supporting AWS Components

- S3 for static hosting
- CloudFront for CDN delivery
- API Gateway for HubSpot proxy and Eventbrite webhook entrypoint
- `hubspot-proxy` Lambda for HubSpot API access
- `eventbrite-sync` Lambda for Eventbrite -> HubSpot synchronization and nightly reconciliation

## Integration Details

### HubSpot

HubSpot is the source of truth for:

- member identity in the protected CMS context
- membership fields
- company fields
- profile updates
- subscription records
- synced registration custom objects

Core contact fields currently used by the portal:

- `membership_type`
- `membership_paid_through__c`
- `current_term_start_date__c`
- `member_status`
- `activated_date__c`
- `on_auto_renewal`
- `auto_renewal_request`
- `has_stored_payment_info`

### WordPress Events API

The portal reads upcoming events from:

- `https://laundryassociation.org/wp-json/tribe/events/v1/events`

Expected event data includes:

- title
- canonical WordPress URL
- start/end dates
- venue
- organizer
- categories
- optional mapped Eventbrite ID

### Eventbrite Sync Lambda

`eventbrite-sync/index.js` handles:

- Eventbrite webhooks:
  - `order.placed`
  - `order.updated`
  - `order.refunded`
  - `attendee.updated`
  - `event.updated`
- nightly reconciliation via EventBridge
- upserting HubSpot custom object registrations
- matching registrations to HubSpot contacts by attendee email
- enriching records with ticket/order metadata
- resolving and persisting `wordpress_event_url`

## Local Development

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Run

```bash
npm run dev
```

The app runs with Vite and will use mock/fallback data when HubSpot CMS context is unavailable.

### Type Check

```bash
npm run check
```

## Environment Variables

Frontend variables:

```env
VITE_API_GATEWAY_URL=https://tvs4suqkuh.execute-api.us-east-1.amazonaws.com/prod
VITE_WP_API_BASE=https://laundryassociation.org/wp-json
VITE_EVENTBRITE_PRIVATE_TOKEN=
VITE_EVENTBRITE_ORGANIZATION_ID=2140213592673
VITE_HIDE_RENEWAL_UI=false
```

Notes:

- `VITE_API_GATEWAY_URL` is required for HubSpot proxy calls.
- `VITE_WP_API_BASE` controls the WordPress events source.
- Direct Eventbrite frontend access is now legacy/backward-compatibility behavior; WordPress is the primary source for upcoming events.
- `VITE_HIDE_RENEWAL_UI` is a build-time feature flag.

Lambda-side variables:

### `hubspot-proxy`

- `HUBSPOT_ACCESS_TOKEN`

### `eventbrite-sync`

- `HUBSPOT_ACCESS_TOKEN`
- `EVENTBRITE_TOKEN`
- `WEBHOOK_SECRET`
- `WP_API_BASE`
- `EVENTBRITE_ORG_ID`
- `EB_CUSTOM_Q_COMPANY`
- `EB_CUSTOM_Q_MOBILE`
- `EB_CUSTOM_Q_ADDRESS`
- `EB_CUSTOM_Q_INDIV_TYPE`

## Deployment

### Frontend

`deploy.sh` currently:

1. deletes the previous `dist/`
2. builds the app with Vite
3. syncs the built assets to `s3://cla-member-portal/`
4. invalidates CloudFront distribution `E3EFOG0IGJZ6AI`
5. optionally updates the `hubspot-proxy` Lambda zip

Current caveat:

- The script uses `VITE_HIDE_RENEWAL_UI=true npx vite build`, so production deploys from this script hide renewal UI unless the script is changed.

### Infrastructure Templates

- `hubspot-proxy.yaml`
- `eventbrite-sync.yaml`

These define the proxy Lambda/API Gateway resources and the Eventbrite sync Lambda/webhook/reconciliation resources.

## Important Files

- `client/src/pages/dashboard.tsx` - main portal shell
- `client/src/components/membership-section.tsx` - membership, renewal, and auto-renewal UI
- `client/src/components/events-section.tsx` - upcoming WordPress events
- `client/src/components/registrations-section.tsx` - member registrations from HubSpot sync records
- `client/src/components/profile-edit-modal.tsx` - profile editing modal
- `client/src/lib/api.ts` - all frontend API and data-mapping logic
- `client/src/lib/utils.ts` - member status and HubSpot checkbox parsing helpers
- `hubspot-proxy/index.js` - HubSpot API proxy Lambda
- `eventbrite-sync/index.js` - Eventbrite sync and reconciliation Lambda

## Current Caveats

- `handleRenewal()` in the membership UI is still a placeholder, so the reminder CTA does not yet launch a real renewal checkout flow.
- The renewal UI may be intentionally hidden in production depending on the build flag.
- Some local-dev behavior uses mock data when HubSpot personalization tokens are absent.
- Legacy Eventbrite API helpers remain in the codebase for compatibility, but WordPress is now the intended source for upcoming event display.
