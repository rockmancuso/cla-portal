# CLA HubSpot Member Portal

A member portal application with HubSpot and Eventbrite integration.

## Features

- Member dashboard with HubSpot data integration
- Eventbrite events display (organization events)
- HubSpot custom object integration for user event registrations
- Responsive design with Tailwind CSS

## Environment Configuration

Copy `.env.example` to `.env` and configure the following variables:

### Eventbrite API
- `VITE_EVENTBRITE_PRIVATE_TOKEN`: Your Eventbrite private API token
- `VITE_EVENTBRITE_ORGANIZATION_ID`: Your Eventbrite organization ID

### HubSpot API
- User eventbrite registrations are now fetched via AWS API Gateway (no frontend environment variables needed)
- Organization events continue to use direct Eventbrite API calls

## HubSpot Integration

### Eventbrite Registrations Custom Object

The application integrates with a HubSpot custom object called "eventbrite_registrations" to display user-specific event registrations.

**Custom Object Details:**
- Internal name: `eventbrite_registrations`
- Object type ID: `2-43504117`
- Association type ID: `95` (contact_to_eventbrite_registrations)

**Required Properties:**
- `event_name`: Name of the event
- `registration_date`: Date of registration
- `eb_attendee_email`: Email of the attendee (used for matching)
- `attendee_number`: Unique attendee identifier
- `event_start_date`: Event start date
- `event_end_date`: Event end date
- `event_url`: Link to the event
- `event_description`: Event description
- `event_location`: Event location
- `venue_name`: Venue name
- `is_free`: Whether the event is free
- `event_status`: Event status

### API Functions

The following functions have been implemented in `client/src/lib/api.ts`:

1. **`getHubSpotEventbriteRegistrations(contactId: string)`**
   - Queries the AWS API Gateway endpoint for eventbrite_registrations associated with a contact
   - Uses AWS API Gateway URL: `https://m7kj8ek8n3.execute-api.us-east-1.amazonaws.com/prod`
   - Avoids CORS issues by using server-side proxy to HubSpot API
   - Returns processed registration data from the backend

2. **`getMyRegisteredEventbriteEventsFromHubSpot()`**
   - Gets the current user's contact ID from HubSpot personalization tokens
   - Fetches associated registrations and transforms them to match the existing `EventbriteEventData` interface
   - Filters registrations by user email for security

3. **`getMyRegisteredEventbriteEvents()`** (Updated)
   - Now calls the HubSpot integration instead of the Eventbrite API
   - Maintains the same interface for frontend compatibility


---

## 🌐 High‑Level Architecture

| Layer              | Service / Technology                          | Purpose                                                                      |
| ------------------ | --------------------------------------------- | ---------------------------------------------------------------------------- |
| **Client**         | React (Vite + TS) · Tailwind · TanStack Query | Renders SPA, manages state, calls APIs.                                      |
| **Static Hosting** | S3 + CloudFront (OAI)                         | Global asset delivery with edge‑cached bundles.                              |
| **API Gateway**    | REST API (`tvs4suqkuh`)                       | Public entry‑point – forwards `/crm/*` to Lambda, injects CORS headers.      |
| **Lambda**         | `hubspot-proxy` (Node 18)                     | Signs outbound HubSpot requests with **private‑app token** and returns JSON. |
| **3rd‑Party APIs** | HubSpot · Eventbrite                          | Source of truth for contact, company and org‑wide event data.                |

```
 Browser ─▶ CloudFront ─▶ S3 (static)
            ║
            ╚═▶ /crm/* ─▶ API Gateway ─▶ Lambda  ─▶ HubSpot API
                               │
                               └──────────────▶ Eventbrite Public API
```

* **Auth model** – HubSpot CMS handles login. If a visitor can load the page they are an authenticated contact.
* **Data sourcing** – Basic contact/company fields via `window.hubspotPageData`; anything private (custom objects, writes) goes through the proxy.

---

## Current Capabilities

### Dashboard

* **Profile, Membership, Company** cards populated from HubSpot personalisation tokens.
* **My Events**  ⟶ lists Eventbrite registrations via the custom object ↔ contact association.
* **Org Events** ⟶ pulls upcoming public events directly from Eventbrite.

### Edit Profile (in‑progress)

* Modal form (`ProfileEditModal`) lets members update Firstname, Lastname, phones, address, etc.
* Uses new helper `updateUserProfile(contactId, properties)`  → PATCH via Lambda to HubSpot.
* Local + admin testing supported via `?email=test@example.com` URL param (dev or admin only).

### Dev Quality‑of‑Life

* **Vite Hot Reload** with Tailwind JIT.
* Mock fallbacks for Eventbrite + HubSpot so the SPA boots with no secrets in local dev.
* One‑command deploy: `deploy.sh` (build → sync to S3 → invalidate CloudFront).

---

## 💾 Environment Variables (`.env`)

```env
# Eventbrite
VITE_EVENTBRITE_PRIVATE_TOKEN=
VITE_EVENTBRITE_ORGANIZATION_ID=

# AWS / Proxy
VITE_API_GATEWAY_URL=https://tvs4suqkuh.execute-api.us-east-1.amazonaws.com/prod

# Local testing helpers
VITE_DEFAULT_TEST_EMAIL=test@example.com  # optional – used when ?email= not supplied
```

*No HubSpot secret is exposed to the browser – it lives as `HUBSPOT_ACCESS_TOKEN` in the Lambda environment.*

### UI Feature Flags

- `VITE_HIDE_RENEWAL_UI` (default: not set)
  - When set to `true`, hides all membership renewal and auto‑renewal notices/buttons in the UI.
  - This is a build‑time flag (Vite). Make sure it is set in the environment for the client build.

Examples:

```bash
# Local dev (one‑off)
VITE_HIDE_RENEWAL_UI=true pnpm dev

# Local dev (persistent)
echo "VITE_HIDE_RENEWAL_UI=true" >> client/.env.local

# CI / deploy build (inline)
VITE_HIDE_RENEWAL_UI=true pnpm build

# Our deploy script usage (inside deploy.sh)
VITE_HIDE_RENEWAL_UI=true npx vite build
```

---

## 🗂️ Code Map (client/src)

| Path                                | Notes                                                          |
| ----------------------------------- | -------------------------------------------------------------- |
| `main.tsx`                          | React root – adds `QueryClientProvider` + Router.              |
| `pages/dashboard.tsx`               | Shell layout & card composition.                               |
| `components/events-section.tsx`     | Org events + My registrations sub‑sections.                    |
| `components/profile-edit-modal.tsx` | Inline edit modal (uses `updateUserProfile`).                  |
| `hooks/use-registrations.ts`        | React‑Query hook; respects `?email=` override.                 |
| `lib/api.ts`                        | **All** remote I/O – Eventbrite, proxy’d HubSpot reads/writes. |

---

## 🔄 Data Flow – *My Registered Events*

1. **Contact email** read from `hubspotPageData` **or** `?email=` override.
2. `useRegistrations` → `getHubSpotEventbriteRegistrations(contactId)`
3. API Gateway `/crm/v3/objects/contacts/{id}` `?associations=eventbrite_registrations`
4. Lambda adds auth header → HubSpot returns custom object records.
5. Client maps to `EventbriteEventData` → renders in Events section.

---

## 🚧 In‑Progress / Backlog

| ID             | Task                                                                   | Status                                                |
| -------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| **#EP‑1**      | **Finish Edit Profile** (PATCH contact + validation + success banner)  | 70% – PATCH works, need full field list and UI polish |
| **#EV‑cache**  | Cache org‑wide Eventbrite list in Edge @ CloudFront to cut cold starts | Not started                                           |
| **#Analytics** | Add PostHog for portal usage metrics                                   | Not started – blocked on budget OK                    |
| **#Docs**      | Keep README synced with infra/code – this doc                          | **✅ Up to date (Jun 16 2025)**                        |

---

## 🛠  Running Locally

```bash
pnpm install          # or npm / yarn
pnpm dev              # http://localhost:5173

# test another user
open "http://localhost:5173?email=someone@laundryassociation.org"
```

---

## 🚀 Deployment Workflow

1. `pnpm build` – Vite → `/dist`
2. `./deploy.sh` – Upload to S3, invalidate CloudFront.
3. Lambda + API Gateway are pre‑packaged in `hubspot-proxy.yaml` (SAM).
   `sam deploy --guided` when infra changes.

---

### Contributors / Contact

* Rob (@rockmancuso) – Front‑end & AWS
* CLA Staff – Domain experts, data mapping
* PRs welcome → open an issue first for discussion.
