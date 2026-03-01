# CLA WordPress Plugin — Claude Code Context

## What This Plugin Does

This WordPress plugin extends The Events Calendar Pro (TEC) to integrate Eventbrite events into CLA's WordPress site. It is one piece of a larger event management system spanning Eventbrite, WordPress, HubSpot, and a member portal.

**The plugin's responsibilities:**
1. Add a meta box to TEC event pages for entering an Eventbrite Event ID
2. Auto-render the Eventbrite embedded checkout widget on event pages
3. Auto-apply member pricing (promo code) for logged-in CLA members
4. Expose the Eventbrite Event ID via TEC's REST API for external consumers
5. Add CORS headers so the member portal can call the TEC REST API

## System Architecture (Read This First)

```
ADMIN WORKFLOW:
  1. Create event in Eventbrite (title, dates, tickets, custom questions)
  2. Create TEC event in WordPress (title, dates, venue, organizer)
  3. Enter the Eventbrite Event ID in the CLA meta box
  4. Publish. Done. No HubDB, no HubSpot page, no embed code copy/paste.

USER FLOW:
  Member portal (member.laundryassociation.org)
    → Shows upcoming events from WordPress TEC REST API
    → "View Event" links to WordPress event page
    → WordPress event page renders Eventbrite checkout widget
    → Member pricing auto-applied via promo code

REGISTRATION SYNC (separate Lambda, NOT in this plugin):
  Eventbrite webhooks → AWS Lambda → HubSpot custom objects
  (The Lambda looks up WordPress event URLs via the REST API this plugin exposes)
```

### What This Plugin Does NOT Do
- It does NOT sync registrations. That's handled by a separate AWS Lambda (`eventbrite-sync`).
- It does NOT create or manage HubSpot records.
- It does NOT replace TEC. It extends TEC's existing `tribe_events` post type.
- It does NOT create a new custom post type. Use `tribe_events`.

## Key External Systems

### The Events Calendar Pro (TEC)
- Already installed and active on `laundryassociation.org`
- Post types: `tribe_events`, `tribe_venue`, `tribe_organizer`
- Taxonomy: `tribe_events_cat`
- REST API: `GET /wp-json/tribe/events/v1/events/`
- Template hooks: `tribe_events_single_event_after_the_content` (for rendering checkout widget)
- REST API filter: `tribe_rest_single_event_data` (for adding custom fields to API responses)
- TEC already stores: title, description, start/end dates, venue, organizer, categories, featured image

### Eventbrite
- Embedded checkout widget: `https://www.eventbrite.com/static/widgets/eb_widgets.js`
- Widget config requires the Eventbrite Event ID
- Member pricing works via a promo code that reveals a hidden "Member" ticket class
- The existing WIP plugin has promo code / embed logic — reuse and adapt it

### HubSpot (for member detection)
- The plugin needs to check if the current user is a CLA member to apply member pricing
- Member status is in HubSpot contact properties
- Detection method: cookie-based (HubSpot tracking cookie) + server-side HubSpot API call
- HubSpot Private App Access Token needed for server-side API calls
- Endpoint: `GET https://api.hubapi.com/crm/v3/objects/contacts/{email}?properties=member_status,membership_type`

### Member Portal
- Domain: `member.laundryassociation.org`
- Calls TEC REST API to get upcoming events
- Needs CORS headers on `/wp-json/` routes

## WordPress Post Meta (Added by This Plugin)

These are the ONLY fields this plugin adds to `tribe_events`. Everything else is handled by TEC.

| Meta Key | Type | Source | Notes |
|---|---|---|---|
| `_eventbrite_event_id` | string | Admin enters in meta box | **The key linking field** between WordPress and Eventbrite |
| `_eb_status` | string | Auto-fetched from EB API on save | `live`/`started`/`ended`/`canceled` |
| `_eb_is_free` | boolean | Auto-fetched from EB API on save | Whether event is free |
| `_eb_last_synced` | string (ISO 8601) | Auto-set on save | When metadata was last refreshed from EB |

## REST API Contract

The member portal expects the TEC REST API to return event data in this exact shape. The plugin MUST expose `eventbrite_event_id` on each event via the `tribe_rest_single_event_data` filter.

### Portal's API Call
```
GET https://laundryassociation.org/wp-json/tribe/events/v1/events/
  ?per_page=10&start_date=now&status=publish
```

### Expected Response Shape (per event in `data.events[]`)
TEC provides all of these natively EXCEPT `eventbrite_event_id`:

```json
{
  "id": 12345,
  "slug": "fall-conference-2026",
  "title": "CLA Fall Conference 2026",
  "description": "<p>Full HTML description</p>",
  "excerpt": "Short excerpt text",
  "url": "https://laundryassociation.org/event/fall-conference-2026/",
  "status": "publish",
  "start_date": "2026-09-15 09:00:00",
  "end_date": "2026-09-17 17:00:00",
  "utc_start_date": "2026-09-15 14:00:00",
  "utc_end_date": "2026-09-17 22:00:00",
  "start_date_details": { "year": "2026", "month": "09", "day": "15", "hour": "09", "minutes": "00" },
  "end_date_details": { "year": "2026", "month": "09", "day": "17", "hour": "17", "minutes": "00" },
  "image": { "url": "https://laundryassociation.org/wp-content/uploads/event-image.jpg" },
  "venue": {
    "venue": "McCormick Place",
    "address": "2301 S Lake Shore Dr",
    "city": "Chicago",
    "state": "Illinois",
    "zip": "60616",
    "country": "United States",
    "url": "https://laundryassociation.org/venue/mccormick-place/",
    "google_maps_link": "https://maps.google.com/..."
  },
  "organizer": [{
    "organizer": "Coin Laundry Association",
    "phone": "800-570-5629",
    "email": "info@coinlaundry.org",
    "website": "https://laundryassociation.org",
    "url": "https://laundryassociation.org/organizer/cla/"
  }],
  "categories": [{ "name": "Conference", "slug": "conference" }],
  "eventbrite_event_id": "987654321"
}
```

The portal maps this to its TypeScript types as follows:
- `event.venue.venue` → venue name
- `event.organizer[0].organizer` → organizer name (note: array, take first)
- `event.image.url` → featured image
- `event.categories[].name` → category labels
- `event.eventbrite_event_id` → links to Eventbrite (THIS IS WHAT THE PLUGIN ADDS)

### Lambda's API Call (for WordPress URL lookup)
The `eventbrite-sync` Lambda also calls the REST API to find WordPress URLs by Eventbrite Event ID:
```
GET https://laundryassociation.org/wp-json/tribe/events/v1/events/
  ?per_page=1&meta_key=_eventbrite_event_id&meta_value={eventbriteEventId}
```
This requires that `_eventbrite_event_id` is queryable via meta_key/meta_value in TEC's REST API. If TEC doesn't support this natively, the plugin should add a custom REST API endpoint or extend TEC's query handling.

## CORS Requirements

The member portal at `member.laundryassociation.org` needs to make cross-origin requests to the WordPress REST API. The plugin must add CORS headers for `/wp-json/` routes:

```
Access-Control-Allow-Origin: https://member.laundryassociation.org
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, Accept
```

This can be done via a WordPress filter (`rest_pre_serve_request`) or in `.htaccess`. The filter approach is preferred since it's self-contained in the plugin.

## Member Pricing Logic

The existing WIP plugin already has logic for:
1. Detecting if the current user is a CLA member
2. Generating a promo code
3. Embedding the Eventbrite checkout widget with the promo code auto-applied

**How member pricing works:**
- In Eventbrite, events have a hidden "Member" ticket class with discounted pricing
- A promo code (configured per-event or globally) reveals this hidden ticket class
- The WP plugin detects membership status and auto-applies the promo code in the checkout widget
- Non-members see only the standard ticket classes

**The new work** is adapting this logic to work within TEC's template system instead of requiring manual embed code copy/paste.

## Coding Conventions
- WordPress coding standards (WPCS)
- Use WordPress hooks/filters, not direct template overrides
- Prefix all functions, classes, and hooks with `cla_` to avoid conflicts
- Use `wp_enqueue_script` / `wp_enqueue_style` for assets
- Sanitize all inputs, escape all outputs
- Use `wp_nonce_field` / `wp_verify_nonce` for form submissions
- Store API tokens in `wp_options` or constants defined in `wp-config.php`, never hardcoded
- Use `wp_remote_get` / `wp_remote_post` for HTTP requests (not `file_get_contents` or cURL directly)
