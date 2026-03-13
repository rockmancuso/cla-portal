# CLA WordPress Plugin — Implementation Plan

## Overview

Extend the existing CLA WordPress plugin to integrate Eventbrite events with The Events Calendar Pro (TEC). The plugin already has WIP code for Eventbrite embed generation and member pricing. The new work adapts this to TEC's template system and adds REST API extensions.

**Read `CLAUDE.md` first** — it contains the full system architecture context, REST API contracts, and data model.

---

## Task 1: Eventbrite Event ID Meta Box on TEC Events

**Goal:** Add a meta box to the `tribe_events` edit screen where admins enter the Eventbrite Event ID.

### Requirements
- Register a meta box on `tribe_events` post type (appears below the TEC editor)
- Meta box title: "Eventbrite Integration"
- Fields:
  - **Eventbrite Event ID** (`_eventbrite_event_id`) — text input, the primary field
  - **Status** (`_eb_status`) — read-only display, auto-populated
  - **Is Free** (`_eb_is_free`) — read-only display, auto-populated
  - **Last Synced** (`_eb_last_synced`) — read-only display, auto-populated
- On save (`save_post_tribe_events`):
  - Save `_eventbrite_event_id` from user input
  - If the Event ID changed or is new, validate it against the Eventbrite API:
    - `GET https://www.eventbriteapi.com/v3/events/{id}/`
    - If valid: save `_eb_status`, `_eb_is_free`, `_eb_last_synced`
    - If invalid: show admin notice "Invalid Eventbrite Event ID"
  - Eventbrite API token should be stored as a WordPress option or `wp-config.php` constant (`CLA_EVENTBRITE_TOKEN`), NOT hardcoded
- Use `wp_nonce_field` / `wp_verify_nonce` for the save handler
- Use `sanitize_text_field()` on all inputs

### Implementation Notes
```php
add_action('add_meta_boxes_tribe_events', 'cla_add_eventbrite_meta_box');
add_action('save_post_tribe_events', 'cla_save_eventbrite_meta', 10, 2);
```

The meta box should look clean and simple. The admin only needs to paste the Eventbrite Event ID (the numeric ID from the Eventbrite URL, e.g., `987654321` from `https://www.eventbrite.com/e/event-name-987654321`).

---

## Task 2: Auto-Render Eventbrite Checkout Widget on TEC Event Pages

**Goal:** When a TEC event has an Eventbrite Event ID, automatically render the Eventbrite embedded checkout widget below the event content.

### Requirements
- Hook into `tribe_events_single_event_after_the_content` (TEC's template action)
- Only render if `_eventbrite_event_id` meta exists and is non-empty for the current event
- Enqueue the Eventbrite widget JS: `https://www.eventbrite.com/static/widgets/eb_widgets.js`
- Render a container `<div id="eventbrite-widget-container-{event_id}"></div>`
- Initialize the widget via inline JS after the page loads

### Widget Initialization
```javascript
window.EBWidgets.createWidget({
    widgetType: 'checkout',
    eventId: '{EVENTBRITE_EVENT_ID}',
    iframeContainerId: 'eventbrite-widget-container-{EVENTBRITE_EVENT_ID}',
    iframeContainerHeight: 500,
    // If member pricing applies:
    promoCode: '{PROMO_CODE_IF_MEMBER}'
});
```

### Member Pricing Integration
- Check if the current user is a CLA member (see Task 4)
- If member: include `promoCode` parameter in widget config
- The promo code reveals a hidden "Member" ticket class with discounted pricing
- Promo code should be configurable:
  - Per-event: check `_eventbrite_promo_code` post meta (add to meta box if needed)
  - Global fallback: `CLA_MEMBER_PROMO_CODE` option or constant
- Non-members see only standard ticket classes (no promo code passed)

### Implementation Notes
```php
add_action('tribe_events_single_event_after_the_content', 'cla_render_eventbrite_checkout');

function cla_render_eventbrite_checkout() {
    $eb_id = get_post_meta(get_the_ID(), '_eventbrite_event_id', true);
    if (!$eb_id) return;

    $is_member = cla_is_current_user_member(); // See Task 4
    $promo_code = '';
    if ($is_member) {
        // Per-event promo code takes precedence
        $promo_code = get_post_meta(get_the_ID(), '_eventbrite_promo_code', true);
        if (!$promo_code) {
            $promo_code = defined('CLA_MEMBER_PROMO_CODE')
                ? CLA_MEMBER_PROMO_CODE
                : get_option('cla_member_promo_code', '');
        }
    }

    wp_enqueue_script('eb-widgets', 'https://www.eventbrite.com/static/widgets/eb_widgets.js', [], null, true);

    // Render container + init script
    // ...
}
```

**Important:** Only enqueue the EB widgets script on single event pages that have an Eventbrite ID. Don't load it globally.

### Existing WIP Code
The existing plugin likely has embed/checkout widget generation code. Find it and adapt it rather than rewriting from scratch. The key change is: instead of generating embed code for the admin to copy/paste, the plugin now auto-renders the widget via the TEC template hook.

---

## Task 3: Expose Eventbrite Event ID in TEC REST API

**Goal:** Add `eventbrite_event_id` to every event in TEC's REST API response so the member portal and sync Lambda can read it.

### Requirements

#### 3A: Add to REST API Response
```php
add_filter('tribe_rest_single_event_data', 'cla_add_eventbrite_id_to_rest', 10, 2);

function cla_add_eventbrite_id_to_rest($data, $event_id) {
    $data['eventbrite_event_id'] = get_post_meta($event_id, '_eventbrite_event_id', true) ?: null;
    return $data;
}
```

This ensures every event returned by `/wp-json/tribe/events/v1/events/` includes the Eventbrite Event ID.

#### 3B: Support Querying by Eventbrite Event ID
The sync Lambda needs to look up WordPress events by their Eventbrite Event ID:
```
GET /wp-json/tribe/events/v1/events/?meta_key=_eventbrite_event_id&meta_value=987654321
```

TEC may or may not support `meta_key`/`meta_value` query params natively. If it doesn't, add a custom REST API endpoint:

```php
// Option A: Extend TEC's query (preferred if TEC supports it)
// Test this first — try the meta_key/meta_value params on TEC's endpoint

// Option B: Custom endpoint (if TEC doesn't support meta queries)
add_action('rest_api_init', function() {
    register_rest_route('cla/v1', '/events/by-eventbrite-id/(?P<eb_id>\d+)', [
        'methods' => 'GET',
        'callback' => 'cla_get_event_by_eventbrite_id',
        'permission_callback' => '__return_true',
        'args' => [
            'eb_id' => [
                'required' => true,
                'validate_callback' => function($param) {
                    return is_numeric($param);
                },
            ],
        ],
    ]);
});

function cla_get_event_by_eventbrite_id($request) {
    $eb_id = $request['eb_id'];
    $query = new WP_Query([
        'post_type' => 'tribe_events',
        'meta_key' => '_eventbrite_event_id',
        'meta_value' => $eb_id,
        'posts_per_page' => 1,
    ]);

    if (!$query->have_posts()) {
        return new WP_REST_Response(['event' => null], 200);
    }

    $post = $query->posts[0];
    return new WP_REST_Response([
        'event' => [
            'id' => $post->ID,
            'url' => get_permalink($post->ID),
            'title' => $post->post_title,
        ],
    ], 200);
}
```

**Important:** If you use Option B (custom endpoint), update the Lambda's lookup URL. Currently the Lambda calls:
```
GET {WP_API_BASE}/tribe/events/v1/events/?per_page=1&meta_key=_eventbrite_event_id&meta_value={id}
```
If that doesn't work with TEC, the Lambda would need to call:
```
GET {WP_API_BASE}/cla/v1/events/by-eventbrite-id/{id}
```
Document whichever approach you use so the Lambda can be updated if needed.

---

## Task 4: Member Detection for Pricing

**Goal:** Determine if the current WordPress visitor is a CLA member so the checkout widget can apply the member promo code.

### Approach: HubSpot Cookie + Server-Side API Check

1. Check for HubSpot tracking cookie (`hubspotutk`) — this identifies the visitor
2. If cookie present, call HubSpot API server-side to get contact properties:
   ```
   GET https://api.hubapi.com/contacts/v1/contact/utk/{hutk}/profile
   ```
   Or by email if the user is logged into WordPress:
   ```
   GET https://api.hubapi.com/crm/v3/objects/contacts/{email}?properties=member_status,membership_type
   ```
3. Check `member_status` property — if "Active", apply member pricing

### Requirements
- Create a helper function `cla_is_current_user_member(): bool`
- Cache the result in a transient or session to avoid repeated API calls per page load
  - Transient key: `cla_member_{user_identifier}` with 15-minute TTL
- HubSpot API token stored as `CLA_HUBSPOT_TOKEN` constant or `cla_hubspot_token` option
- Graceful fallback: if HubSpot API is down or cookie is missing, assume non-member (don't break the page)
- Use `wp_remote_get()` for the API call

### Security Notes
- The promo code is applied server-side in the widget config, but the Eventbrite widget loads in an iframe. The promo code will be visible in page source to anyone who inspects it. This is acceptable because:
  - The promo code only reveals the member ticket class, it doesn't bypass payment
  - Eventbrite still processes the actual payment
  - Non-members using the promo code would pay the member price (a business risk, not a security risk)
- If stricter protection is needed in the future, consider a server-side Eventbrite API call to generate a single-use discount code per session

### Existing Logic
The existing WIP plugin already has member detection logic. Find it and reuse/adapt it rather than rewriting. The key change: it needs to work on TEC event pages, not just the old custom page template.

---

## Task 5: CORS Headers for Member Portal

**Goal:** Allow the member portal (`member.laundryassociation.org`) to make cross-origin GET requests to the WordPress REST API.

### Requirements
```php
add_action('rest_api_init', function() {
    // Remove default CORS handling to add our own
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');

    add_filter('rest_pre_serve_request', function($value) {
        $origin = get_http_origin();
        $allowed_origins = [
            'https://member.laundryassociation.org',
        ];

        // Allow localhost for development
        if (defined('WP_DEBUG') && WP_DEBUG) {
            $allowed_origins[] = 'http://localhost:5173';
            $allowed_origins[] = 'http://localhost:3000';
        }

        if (in_array($origin, $allowed_origins, true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Methods: GET, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Accept');
            header('Access-Control-Allow-Credentials: true');
        }

        return $value;
    });
}, 15);
```

### Important
- Only allow GET and OPTIONS methods (the portal only reads data)
- Only allow the specific portal domain, not `*`
- Include `Access-Control-Allow-Credentials: true` in case cookies are needed
- Add localhost origins when `WP_DEBUG` is true for development
- Handle preflight OPTIONS requests properly

---

## Task 6: Plugin Settings Page (Optional but Recommended)

**Goal:** Admin settings page for API tokens and global configuration.

### Settings
| Setting | Key | Description |
|---|---|---|
| Eventbrite API Token | `cla_eventbrite_token` | For validating Event IDs on save |
| HubSpot API Token | `cla_hubspot_token` | For member detection |
| Default Member Promo Code | `cla_member_promo_code` | Global fallback promo code |
| Portal Domain | `cla_portal_domain` | For CORS (default: `member.laundryassociation.org`) |

### Implementation Notes
- Use WordPress Settings API (`register_setting`, `add_settings_section`, `add_settings_field`)
- Add under Settings → CLA Events or as a submenu under Events (TEC's menu)
- API tokens should use `type="password"` inputs
- Alternatively, tokens can be defined as constants in `wp-config.php`:
  ```php
  define('CLA_EVENTBRITE_TOKEN', 'your-token-here');
  define('CLA_HUBSPOT_TOKEN', 'your-token-here');
  define('CLA_MEMBER_PROMO_CODE', 'MEMBER2026');
  ```
  The settings page should check for constants first and show "Defined in wp-config.php" if set.

---

## Implementation Order

1. **Task 5 (CORS)** — Quick win, unblocks portal development/testing
2. **Task 1 (Meta Box)** — Foundation for everything else
3. **Task 3 (REST API)** — Unblocks portal and Lambda integration
4. **Task 4 (Member Detection)** — Needed for checkout widget
5. **Task 2 (Checkout Widget)** — Depends on Tasks 1 + 4
6. **Task 6 (Settings Page)** — Nice to have, can use constants initially

## Testing Checklist

After implementation, verify:

- [ ] TEC event edit screen shows "Eventbrite Integration" meta box
- [ ] Saving a valid Eventbrite Event ID populates `_eb_status` and `_eb_is_free`
- [ ] Saving an invalid Event ID shows an error notice
- [ ] Single event page with EB ID renders the checkout widget
- [ ] Member user sees member ticket class (promo code applied)
- [ ] Non-member user sees only standard ticket classes
- [ ] Event without EB ID shows no checkout widget
- [ ] `GET /wp-json/tribe/events/v1/events/` includes `eventbrite_event_id` on each event
- [ ] Looking up an event by Eventbrite Event ID via REST API works
- [ ] Portal at `member.laundryassociation.org` can fetch events without CORS errors
- [ ] `localhost:5173` can fetch events in dev mode (when `WP_DEBUG` is true)

## Files You'll Likely Create or Modify

This depends on the existing plugin structure. Common patterns:

```
cla-eventbrite/                    (or whatever the plugin directory is called)
├── cla-eventbrite.php             Main plugin file (hooks, activation)
├── includes/
│   ├── class-meta-box.php         Task 1: Meta box registration + save
│   ├── class-checkout-widget.php  Task 2: Widget rendering on TEC pages
│   ├── class-rest-api.php         Task 3: REST API extensions
│   ├── class-member-detection.php Task 4: HubSpot member check
│   ├── class-cors.php             Task 5: CORS headers
│   └── class-settings.php         Task 6: Settings page
├── assets/
│   ├── css/
│   │   └── checkout-widget.css    Styling for checkout widget container
│   └── js/
│       └── checkout-widget.js     Widget initialization script
└── readme.txt
```

Explore the existing plugin structure first and adapt to match. Don't create new files unnecessarily if the existing structure can accommodate the changes.
