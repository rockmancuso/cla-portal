/**
 * Eventbrite ↔ HubSpot Sync Lambda
 *
 * Handles two entry points:
 * 1. Eventbrite webhooks (POST /eventbrite-webhook/{secret})
 *    - order.placed, attendee.updated, order.refunded, order.updated, event.updated
 * 2. Nightly reconciliation (EventBridge scheduled event)
 *
 * Environment variables:
 *   HUBSPOT_ACCESS_TOKEN   - HubSpot private app token
 *   EVENTBRITE_TOKEN       - Eventbrite private API token
 *   WEBHOOK_SECRET         - Secret path segment for webhook URL verification
 *   WP_API_BASE            - WordPress REST API base URL (e.g., https://laundryassociation.org/wp-json)
 *   EB_CUSTOM_Q_COMPANY    - Eventbrite question ID for "Company Name"
 *   EB_CUSTOM_Q_MOBILE     - Eventbrite question ID for "Mobile Number"
 *   EB_CUSTOM_Q_ADDRESS    - Eventbrite question ID for "Mailing Address"
 *   EB_CUSTOM_Q_INDIV_TYPE - Eventbrite question ID for "Individual Type"
 *   EVENTBRITE_ORG_ID      - Eventbrite organization ID
 */

const https = require("https");

// --- Configuration ---

const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const EB_TOKEN = process.env.EVENTBRITE_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "change-me";
const WP_API_BASE = process.env.WP_API_BASE || "https://laundryassociation.org/wp-json";
const EB_ORG_ID = process.env.EVENTBRITE_ORG_ID || "2140213592673";

// Eventbrite custom question IDs → HubSpot property names
const QUESTION_MAP = {
  [process.env.EB_CUSTOM_Q_COMPANY || "__company__"]: "eb_company_name",
  [process.env.EB_CUSTOM_Q_MOBILE || "__mobile__"]: "eb_mobile_number",
  [process.env.EB_CUSTOM_Q_ADDRESS || "__address__"]: "eb_mailing_address",
  [process.env.EB_CUSTOM_Q_INDIV_TYPE || "__indiv_type__"]: "eb_individual_type",
};

// HubSpot custom object config
const HS_PORTAL_ID = "19544225";
const HS_OBJECT_TYPE = `p${HS_PORTAL_ID}_eventbrite_registrations`;

// --- Entry Point ---

exports.handler = async (event) => {
  console.log("Event received:", JSON.stringify(event, null, 2));

  // Scheduled reconciliation (EventBridge)
  if (event.source === "aws.events" || event.action === "reconcile") {
    return handleReconciliation();
  }

  // Webhook from Eventbrite (API Gateway)
  if (event.httpMethod === "POST") {
    return handleWebhook(event);
  }

  // OPTIONS preflight
  if (event.httpMethod === "OPTIONS") {
    return respond(200, "");
  }

  return respond(400, { error: "Unsupported request" });
};

// --- Webhook Handler ---

async function handleWebhook(event) {
  // Verify webhook secret in URL path
  const pathSecret = event.pathParameters?.secret;
  if (pathSecret !== WEBHOOK_SECRET) {
    console.warn("Webhook secret mismatch");
    return respond(403, { error: "Forbidden" });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return respond(400, { error: "Invalid JSON body" });
  }

  const { api_url, config } = payload;
  const action = config?.action || "unknown";

  console.log(`Webhook action: ${action}, api_url: ${api_url}`);

  if (!api_url) {
    return respond(400, { error: "Missing api_url in webhook payload" });
  }

  try {
    switch (action) {
      case "order.placed":
        await handleOrderPlaced(api_url);
        break;
      case "order.updated":
        await handleOrderUpdated(api_url);
        break;
      case "order.refunded":
        await handleOrderRefunded(api_url);
        break;
      case "attendee.updated":
        await handleAttendeeUpdated(api_url);
        break;
      case "event.updated":
        await handleEventUpdated(api_url);
        break;
      default:
        console.log(`Unhandled webhook action: ${action}`);
    }

    return respond(200, { status: "ok", action });
  } catch (err) {
    console.error(`Error handling webhook ${action}:`, err);
    return respond(500, { error: "Internal error processing webhook" });
  }
}

// --- Webhook Action Handlers ---

async function handleOrderPlaced(apiUrl) {
  const order = await fetchEventbrite(apiUrl + "?expand=attendees,event");
  if (!order?.attendees?.length) {
    console.log("No attendees in order");
    return;
  }

  for (const attendee of order.attendees) {
    await upsertRegistration(attendee, order.event, order);
  }
}

async function handleOrderUpdated(apiUrl) {
  // Same as order.placed — re-upsert all attendees in the order
  await handleOrderPlaced(apiUrl);
}

async function handleOrderRefunded(apiUrl) {
  const order = await fetchEventbrite(apiUrl + "?expand=attendees,event");
  if (!order?.attendees?.length) return;

  for (const attendee of order.attendees) {
    await upsertRegistration(attendee, order.event, order, "refunded");
  }
}

async function handleAttendeeUpdated(apiUrl) {
  const attendee = await fetchEventbrite(apiUrl + "?expand=answers,event");
  if (!attendee) return;

  // Determine status from attendee
  let status = "registered";
  if (attendee.checked_in) status = "checked_in";
  if (attendee.cancelled) status = "cancelled";
  if (attendee.refunded) status = "refunded";

  await upsertRegistration(attendee, attendee.event, null, status);
}

async function handleEventUpdated(apiUrl) {
  const eventData = await fetchEventbrite(apiUrl);
  if (!eventData) return;

  const eventId = eventData.id;
  console.log(`Event updated: ${eventId} - ${eventData.name?.text}`);

  // Find all HubSpot registrations for this event and update metadata
  const registrations = await searchHubSpotRegistrations(
    "eventbrite_event_id",
    eventId
  );

  for (const reg of registrations) {
    const updates = {
      event_name: eventData.name?.text || reg.properties.event_name,
      event_start_date: eventData.start?.utc || "",
      event_end_date: eventData.end?.utc || "",
      venue_name: eventData.venue?.name || "",
      event_location:
        eventData.venue?.address?.localized_address_display || "",
    };

    if (eventData.status === "canceled" || eventData.status === "cancelled") {
      updates.event_status = "cancelled";
    }

    await updateHubSpotObject(reg.id, updates);
  }
}

// --- Core Upsert Logic ---

async function upsertRegistration(attendee, eventData, order, statusOverride) {
  const attendeeId = String(attendee.id);
  const email = attendee.profile?.email;
  const eventId = String(eventData?.id || attendee.event_id || "");

  if (!email) {
    console.warn(`Attendee ${attendeeId} has no email, skipping`);
    return;
  }

  // Build properties
  const props = {
    event_name: eventData?.name?.text || "",
    eventbrite_event_id: eventId,
    eventbrite_attendee_id: attendeeId,
    eventbrite_order_id: String(attendee.order_id || order?.id || ""),
    attendee_number: attendeeId,
    eb_attendee_email: email,
    event_start_date: eventData?.start?.utc || "",
    event_end_date: eventData?.end?.utc || "",
    venue_name: eventData?.venue?.name || "",
    event_location:
      eventData?.venue?.address?.localized_address_display || "",
    is_free: String(eventData?.is_free || false),
    event_status: statusOverride || "registered",
    registration_date: order?.created || new Date().toISOString(),
    eb_order_date: order?.created || "",
    last_synced_at: new Date().toISOString(),
  };

  // Ticket details
  if (attendee.ticket_class_name) {
    props.eb_ticket_type = attendee.ticket_class_name;
  }
  if (attendee.costs?.gross?.major_value) {
    props.eb_ticket_price = attendee.costs.gross.major_value;
  }
  if (order?.costs?.gross?.major_value) {
    props.eb_purchase_amount = order.costs.gross.major_value;
  }

  // Opt-out
  if (attendee.profile?.opt_out !== undefined) {
    props.eb_opt_out = attendee.profile.opt_out ? "opted_out" : "";
  }

  // Custom question answers
  if (attendee.answers?.length) {
    for (const answer of attendee.answers) {
      const qId = answer.question_id;
      const hsProp = QUESTION_MAP[String(qId)];
      if (hsProp && answer.answer) {
        props[hsProp] = answer.answer;
      }
    }
  }

  // Look up WordPress event URL
  try {
    const wpUrl = await lookupWordPressEventUrl(eventId);
    if (wpUrl) {
      props.wordpress_event_url = wpUrl;
      props.event_url = wpUrl; // Also set event_url to WP URL
    } else {
      props.event_url = eventData?.url || "";
    }
  } catch (err) {
    console.warn("Failed to look up WordPress URL:", err.message);
    props.event_url = eventData?.url || "";
  }

  // Search for existing registration by attendee ID (idempotency)
  const existing = await searchHubSpotRegistrations(
    "eventbrite_attendee_id",
    attendeeId
  );

  if (existing.length > 0) {
    // UPDATE existing record
    console.log(
      `Updating existing registration ${existing[0].id} for attendee ${attendeeId}`
    );
    await updateHubSpotObject(existing[0].id, props);
  } else {
    // CREATE new record
    console.log(`Creating new registration for attendee ${attendeeId}`);
    const newReg = await createHubSpotObject(props);

    // Associate with contact
    if (newReg?.id) {
      const contactId = await findHubSpotContactByEmail(email);
      if (contactId) {
        await associateRegistrationWithContact(newReg.id, contactId);
      } else {
        console.warn(`No HubSpot contact found for ${email}`);
      }
    }
  }
}

// --- Reconciliation ---

async function handleReconciliation() {
  console.log("Starting nightly reconciliation...");

  // Fetch all live events from Eventbrite
  const events = await fetchEventbrite(
    `https://www.eventbriteapi.com/v3/organizations/${EB_ORG_ID}/events/?status=live,started&time_filter=current_future&order_by=start_asc`
  );

  if (!events?.events?.length) {
    console.log("No live events to reconcile");
    return respond(200, { status: "ok", events_reconciled: 0 });
  }

  let totalCreated = 0;
  let totalUpdated = 0;

  for (const event of events.events) {
    const eventId = event.id;
    console.log(`Reconciling event ${eventId}: ${event.name?.text}`);

    // Fetch all attendees from Eventbrite (paginated)
    const ebAttendees = await fetchAllEventbriteAttendees(eventId);

    // Fetch all HubSpot registrations for this event
    const hsRegistrations = await searchHubSpotRegistrations(
      "eventbrite_event_id",
      eventId
    );

    // Build lookup maps
    const hsMap = new Map();
    for (const reg of hsRegistrations) {
      const aId = reg.properties.eventbrite_attendee_id;
      if (aId) hsMap.set(aId, reg);
    }

    // Reconcile
    for (const attendee of ebAttendees) {
      const attendeeId = String(attendee.id);
      const existing = hsMap.get(attendeeId);

      if (!existing) {
        // Missing from HubSpot — create
        console.log(
          `Reconciliation: creating missing registration for attendee ${attendeeId}`
        );
        await upsertRegistration(attendee, event, null);
        totalCreated++;
      } else {
        // Check for status mismatch
        let expectedStatus = "registered";
        if (attendee.checked_in) expectedStatus = "checked_in";
        if (attendee.cancelled) expectedStatus = "cancelled";
        if (attendee.refunded) expectedStatus = "refunded";

        if (existing.properties.event_status !== expectedStatus) {
          console.log(
            `Reconciliation: status mismatch for attendee ${attendeeId}: HS=${existing.properties.event_status} EB=${expectedStatus}`
          );
          await updateHubSpotObject(existing.id, {
            event_status: expectedStatus,
            last_synced_at: new Date().toISOString(),
          });
          totalUpdated++;
        }

        hsMap.delete(attendeeId);
      }
    }

    // Remaining in hsMap are in HubSpot but not in Eventbrite
    for (const [attendeeId, reg] of hsMap) {
      if (
        reg.properties.event_status !== "cancelled" &&
        reg.properties.event_status !== "refunded"
      ) {
        console.warn(
          `Reconciliation: orphan registration ${reg.id} (attendee ${attendeeId}) - marking as cancelled`
        );
        await updateHubSpotObject(reg.id, {
          event_status: "cancelled",
          last_synced_at: new Date().toISOString(),
        });
        totalUpdated++;
      }
    }
  }

  console.log(
    `Reconciliation complete: ${totalCreated} created, ${totalUpdated} updated`
  );
  return respond(200, {
    status: "ok",
    events_reconciled: events.events.length,
    created: totalCreated,
    updated: totalUpdated,
  });
}

// --- Eventbrite API Helpers ---

async function fetchEventbrite(url) {
  if (!url.startsWith("http")) {
    url = `https://www.eventbriteapi.com/v3/${url}`;
  }
  const data = await httpRequest(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${EB_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
  return JSON.parse(data.body);
}

async function fetchAllEventbriteAttendees(eventId) {
  const attendees = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `https://www.eventbriteapi.com/v3/events/${eventId}/attendees/?page=${page}&expand=answers`;
    const data = await fetchEventbrite(url);

    if (data?.attendees) {
      attendees.push(...data.attendees);
    }

    hasMore = data?.pagination?.has_more_items || false;
    page++;

    // Rate limit protection
    if (page > 50) {
      console.warn(`Stopping pagination at page ${page} for event ${eventId}`);
      break;
    }
  }

  return attendees;
}

// --- HubSpot API Helpers ---

async function searchHubSpotRegistrations(propertyName, value) {
  const url = `https://api.hubapi.com/crm/v3/objects/${HS_OBJECT_TYPE}/search`;
  const body = JSON.stringify({
    filterGroups: [
      {
        filters: [
          { propertyName, operator: "EQ", value: String(value) },
        ],
      },
    ],
    properties: [
      "event_name",
      "eventbrite_event_id",
      "eventbrite_attendee_id",
      "event_status",
      "eb_attendee_email",
    ],
    limit: 100,
  });

  const data = await hubspotRequest("POST", url, body);
  return data?.results || [];
}

async function createHubSpotObject(properties) {
  const url = `https://api.hubapi.com/crm/v3/objects/${HS_OBJECT_TYPE}`;
  const body = JSON.stringify({ properties });
  return await hubspotRequest("POST", url, body);
}

async function updateHubSpotObject(objectId, properties) {
  const url = `https://api.hubapi.com/crm/v3/objects/${HS_OBJECT_TYPE}/${objectId}`;
  const body = JSON.stringify({ properties });
  return await hubspotRequest("PATCH", url, body);
}

async function findHubSpotContactByEmail(email) {
  const url =
    "https://api.hubapi.com/crm/v3/objects/contacts/search";
  const body = JSON.stringify({
    filterGroups: [
      {
        filters: [
          { propertyName: "email", operator: "EQ", value: email },
        ],
      },
    ],
    properties: ["id"],
    limit: 1,
  });

  const data = await hubspotRequest("POST", url, body);
  return data?.results?.[0]?.id || null;
}

async function associateRegistrationWithContact(registrationId, contactId) {
  // Association type 95 = contact_to_eventbrite_registrations
  const url = `https://api.hubapi.com/crm/v4/objects/${HS_OBJECT_TYPE}/${registrationId}/associations/contacts/${contactId}`;
  const body = JSON.stringify([
    { associationCategory: "USER_DEFINED", associationTypeId: 95 },
  ]);
  return await hubspotRequest("PUT", url, body);
}

async function hubspotRequest(method, url, body) {
  const result = await httpRequest(url, {
    method,
    headers: {
      Authorization: `Bearer ${HUBSPOT_TOKEN}`,
      "Content-Type": "application/json",
    },
  }, body);

  if (result.statusCode >= 400) {
    console.error(
      `HubSpot API error (${result.statusCode}):`,
      result.body.substring(0, 500)
    );
    throw new Error(`HubSpot API error: ${result.statusCode}`);
  }

  return result.body ? JSON.parse(result.body) : null;
}

// --- WordPress API Helper ---

async function lookupWordPressEventUrl(eventbriteEventId) {
  if (!eventbriteEventId) return null;

  // Search for tribe_events with matching _eventbrite_event_id meta
  const url = `${WP_API_BASE}/tribe/events/v1/events/?per_page=1&meta_key=_eventbrite_event_id&meta_value=${eventbriteEventId}`;

  try {
    const result = await httpRequest(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (result.statusCode === 200) {
      const data = JSON.parse(result.body);
      if (data?.events?.[0]?.url) {
        return data.events[0].url;
      }
    }
  } catch (err) {
    console.warn("WordPress API lookup failed:", err.message);
  }

  return null;
}

// --- HTTP Utilities ---

function httpRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method,
      headers: options.headers,
    };

    const req = https.request(requestOptions, (res) => {
      let responseBody = "";
      res.on("data", (chunk) => (responseBody += chunk));
      res.on("end", () =>
        resolve({ statusCode: res.statusCode, body: responseBody })
      );
    });

    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function respond(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  };
}
