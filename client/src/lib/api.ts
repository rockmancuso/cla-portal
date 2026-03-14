import axios from "axios";
const BASE = import.meta.env.VITE_API_GATEWAY_URL;

// Define types for HubSpot data expected by the frontend
export interface HubSpotContactData {
  membership_type?: string | null;
  membership_paid_through__c?: string | null;
  current_term_start_date__c?: string | null;
  member_status?: string | null;
  activated_date__c?: string | null;
  email?: string;
  firstName?: string;
  lastName?: string;
  on_auto_renewal?: boolean | string | null;
  auto_renewal_request?: boolean | string | null;
  has_stored_payment_info?: boolean | string | null;
}

export interface HubSpotSubscriptionData {
  id: string;
  name?: string | null;
  // "active" | "past_due" | "canceled" | "expired" | "scheduled"
  status?: string | null;
  nextPaymentDate?: string | null;
  lastPaymentAmount?: number | null;
  billingFrequency?: string | null;
  currencyCode?: string | null;
  startDate?: string | null;
}

export interface HubSpotCompanyData {
  name?: string | null;
  membership_type?: string | null;
}

export interface HubSpotDashboardData {
  contact: HubSpotContactData | null;
  company: HubSpotCompanyData | null;
}

// Define types for Eventbrite data expected by the frontend
export interface EventbriteEventData {
  id: string;
  name: string;
  description?: string | null;
  url?: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  status?: string;
  isFree?: boolean;
  location?: string | null;
  venueName?: string | null;
}

export interface EventbriteEventsResponse {
  events: EventbriteEventData[];
  message?: string; // Optional message, e.g., for errors or API status
}

// WordPress / The Events Calendar types for portal event display
export interface WordPressEventVenue {
  venue: string;            // Venue name
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  url?: string;
  google_maps_link?: string;
}

export interface WordPressEventOrganizer {
  organizer: string;        // Organizer name
  phone?: string;
  email?: string;
  website?: string;
  url?: string;             // TEC organizer page URL
}

export interface WordPressEvent {
  id: number;
  slug: string;
  title: string;
  description: string;
  url: string;              // WordPress permalink (canonical event URL)
  startDate: string;        // ISO 8601
  endDate: string;          // ISO 8601
  startDateDetails: { year: string; month: string; day: string; hour: string; minutes: string };
  endDateDetails: { year: string; month: string; day: string; hour: string; minutes: string };
  utcStartDate: string;
  utcEndDate: string;
  imageUrl: string | null;
  venue: WordPressEventVenue | null;
  organizer: WordPressEventOrganizer | null;
  categories: string[];
  eventbriteId: string | null;  // Eventbrite Event ID from custom meta
  status: string;
}

// Registration record from HubSpot custom object (enriched with new sync properties)
export interface RegistrationRecord {
  id: string;
  properties: {
    event_name: string;
    registration_date?: string;
    event_start_date?: string;
    event_end_date?: string;
    event_url?: string;
    venue_name?: string;
    event_status?: string;     // registered | checked_in | cancelled | refunded
    is_free?: string | boolean;
    event_location?: string;
    eb_attendee_email?: string;
    attendee_number?: string;
    // New properties from sync Lambda
    eventbrite_event_id?: string;
    eventbrite_attendee_id?: string;
    wordpress_event_url?: string;
    eb_ticket_type?: string;
    eb_ticket_price?: string;
    eb_purchase_amount?: string;
    eb_quantity_purchased?: string;
    eb_order_date?: string;
  };
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const response = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`${response.status}: ${errorData}`);
  }

  return response;
}

// NEW: Get HubSpot data from personalization tokens instead of backend API
export async function getHubSpotDashboardData(): Promise<HubSpotDashboardData> {
  // Use data already available from HubSpot personalization tokens
  const hubspotData = (window as any).hubspotPageData;
  
  // If no HubSpot data available (local dev), return mock data
  if (!hubspotData || !hubspotData.memberEmail) {
    const mockPaidThrough = new Date();
    
    // 🧪 TEST SCENARIOS - Uncomment one of these to test different renewal scenarios:
    
    // Scenario 1: Member needs renewal (15 days left) - should show amber renewal reminder
    //mockPaidThrough.setDate(mockPaidThrough.getDate() + 15);
    
    // Scenario 2: Member needs renewal with auto-renewal enabled - should show green confirmation
     mockPaidThrough.setDate(mockPaidThrough.getDate() + 15);
    
    // Scenario 3: Member has plenty of time (60 days left) - should show no reminder
    // mockPaidThrough.setDate(mockPaidThrough.getDate() + 60);
    
    // Scenario 4: Member is already expired (-5 days) - should show renewal reminder
    // mockPaidThrough.setDate(mockPaidThrough.getDate() - 5);
    
    const mockStartDate = new Date();
    mockStartDate.setFullYear(mockStartDate.getFullYear() - 1);
    const mockActivatedDate = new Date();
    mockActivatedDate.setFullYear(mockActivatedDate.getFullYear() - 2);
    
    return {
      contact: {
        membership_type: 'Premium',
        membership_paid_through__c: mockPaidThrough.toISOString(),
        current_term_start_date__c: mockStartDate.toISOString(),
        member_status: 'Active',
        activated_date__c: mockActivatedDate.toISOString(),
        email: 'demo@example.com',
        firstName: 'Demo',
        lastName: 'User',
        // 🧪 AUTO-RENEWAL TEST - Change this to test auto-renewal scenarios:
        on_auto_renewal: false, // Set to true, "true", or "Yes" to test active auto-renewal
        auto_renewal_request: false, // Mock: no request submitted
        has_stored_payment_info: false, // Set to true to test immediate eligibility
      },
      company: {
        name: 'Demo Company',
        membership_type: 'Premium',
      }
    };
  }
  
  return {
    contact: {
      membership_type: hubspotData.membershipType || null,
      membership_paid_through__c: hubspotData.membershipPaidThrough || null,
      current_term_start_date__c: hubspotData.currentTermStartDate || null,
      member_status: hubspotData.memberStatus || null,
      activated_date__c: hubspotData.activatedDate || null,
      email: hubspotData.memberEmail,
      firstName: hubspotData.firstName,
      lastName: hubspotData.lastName,
      on_auto_renewal: hubspotData.onAutoRenewal ?? hubspotData.on_auto_renewal ?? null,
      auto_renewal_request: hubspotData.autoRenewingRequest || null,
      has_stored_payment_info: hubspotData.hasStoredPaymentInfo ?? hubspotData.has_stored_payment_info ?? null,
    },
    company: {
      name: hubspotData.companyName || null,
      membership_type: hubspotData.companyMembershipType || null,
    }
  };
}

// WordPress / The Events Calendar REST API integration
// Fetches upcoming events from WordPress (the canonical event source)
const WP_API_BASE = import.meta.env.VITE_WP_API_BASE || 'https://laundryassociation.org/wp-json';

export async function getUpcomingEvents(): Promise<WordPressEvent[]> {
  try {
    const response = await fetch(
      `${WP_API_BASE}/tribe/events/v1/events/?per_page=10&start_date=now&status=publish`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const events: WordPressEvent[] = (data.events || []).map((event: any) => ({
      id: event.id,
      slug: event.slug || '',
      title: event.title || 'Untitled Event',
      description: event.excerpt || event.description || '',
      url: event.url || '',
      startDate: event.start_date || '',
      endDate: event.end_date || '',
      startDateDetails: event.start_date_details || {},
      endDateDetails: event.end_date_details || {},
      utcStartDate: event.utc_start_date || event.start_date || '',
      utcEndDate: event.utc_end_date || event.end_date || '',
      imageUrl: event.image?.url || null,
      venue: event.venue ? {
        venue: event.venue.venue || '',
        address: event.venue.address || '',
        city: event.venue.city || '',
        state: event.venue.state || '',
        zip: event.venue.zip || '',
        country: event.venue.country || '',
        url: event.venue.url || undefined,
        google_maps_link: event.venue.google_maps_link || undefined,
      } : null,
      organizer: event.organizer?.[0] ? {
        organizer: event.organizer[0].organizer || '',
        phone: event.organizer[0].phone || undefined,
        email: event.organizer[0].email || undefined,
        website: event.organizer[0].website || undefined,
        url: event.organizer[0].url || undefined,
      } : null,
      categories: (event.categories || []).map((c: any) => c.name || c),
      eventbriteId: event.eventbrite_event_id || null,
      status: event.status || 'publish',
    }));

    return events;
  } catch (error) {
    console.error('Error fetching events from WordPress:', error);
    return [];
  }
}

// Legacy Eventbrite API integration (kept for backward compatibility during migration)
// TODO: Remove after WordPress REST API is fully configured with CORS
export async function getEventbriteEvents(): Promise<EventbriteEventsResponse> {
  const EVENTBRITE_TOKEN = import.meta.env.VITE_EVENTBRITE_PRIVATE_TOKEN;
  const EVENTBRITE_ORG_ID = import.meta.env.VITE_EVENTBRITE_ORGANIZATION_ID || '2140213592673';

  if (!EVENTBRITE_TOKEN) {
    console.warn('Eventbrite token not configured. Use getUpcomingEvents() (WordPress API) instead.');
    return { events: [], message: 'Eventbrite token not configured' };
  }

  try {
    const response = await fetch(
      `https://www.eventbriteapi.com/v3/organizations/${EVENTBRITE_ORG_ID}/events/?status=live&time_filter=current_future&order_by=start_asc&expand=venue`,
      {
        headers: {
          'Authorization': `Bearer ${EVENTBRITE_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Eventbrite API Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Eventbrite API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    const events: EventbriteEventData[] = data.events?.map((event: any) => ({
      id: event.id,
      name: event.name?.text || event.name || 'Untitled Event',
      description: event.summary || event.description?.text || null,
      url: event.url,
      startDate: event.start?.utc || event.start,
      endDate: event.end?.utc || event.end,
      status: event.status,
      isFree: event.is_free || false,
      location: event.venue?.address?.localized_address_display || null,
      venueName: event.venue?.name || null,
    })) || [];

    return {
      events,
      message: events.length > 0 ? undefined : "No upcoming events found"
    };
  } catch (error) {
    console.error('Error fetching Eventbrite events:', error);
    return {
      events: [],
      message: `Error loading events: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// HubSpot API integration for Eventbrite registrations via AWS API Gateway
export async function getHubSpotEventbriteRegistrations(contactId: string): Promise<any[]> {
  const API_GATEWAY_URL = 'https://tvs4suqkuh.execute-api.us-east-1.amazonaws.com/prod';
  
  try {
    // Step 1: Get the contact with Eventbrite associations
    const contactUrl = `${API_GATEWAY_URL}/crm/v3/objects/contacts/${contactId}?associations=p19544225_eventbrite_registrations`;
    
    const contactResponse = await fetch(contactUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!contactResponse.ok) {
      const errorText = await contactResponse.text();
      console.error('API Gateway Contact Response:', {
        status: contactResponse.status,
        statusText: contactResponse.statusText,
        body: errorText
      });
      throw new Error(`Failed to fetch contact: ${contactResponse.status} ${contactResponse.statusText}`);
    }

    const contactData = await contactResponse.json();
    console.log('Contact data with associations:', contactData);

    // Step 2: Check if contact has Eventbrite registrations
    const eventbriteAssociations = contactData.associations?.p19544225_eventbrite_registrations?.results;
    
    if (!eventbriteAssociations || eventbriteAssociations.length === 0) {
      console.log('No Eventbrite registrations found for this contact');
      return [];
    }

    // Step 3: Fetch all Eventbrite registration details
    const eventbritePromises = eventbriteAssociations.map(async (assoc: any) => {
      const eventbriteUrl = `${API_GATEWAY_URL}/crm/v3/objects/p19544225_eventbrite_registrations/${assoc.id}`;
      
      const eventbriteResponse = await fetch(eventbriteUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!eventbriteResponse.ok) {
        console.error(`Failed to fetch Eventbrite registration ${assoc.id}:`, eventbriteResponse.status);
        return null;
      }

      return await eventbriteResponse.json();
    });

    const allEventbriteRegistrations = await Promise.all(eventbritePromises);
    
    // Filter out any failed requests (null values)
    const validRegistrations = allEventbriteRegistrations.filter(reg => reg !== null);
    
    console.log('Fetched Eventbrite registrations:', validRegistrations);
    return validRegistrations;

  } catch (error) {
    console.error('Error fetching HubSpot Eventbrite registrations via API Gateway:', error);
    throw error;
  }
}

export async function getMyRegisteredEventbriteEventsFromHubSpot(): Promise<EventbriteEventsResponse> {
  try {
    // Get current user's contact ID from HubSpot personalization tokens
    const hubspotData = (window as any).hubspotPageData;
    const contactId = hubspotData?.contactId;
    const userEmail = hubspotData?.memberEmail;

    if (!contactId) {
      // If no contact ID available (local dev), return empty array
      return {
        events: [],
        message: "No contact ID available for fetching registrations"
      };
    }

    // Get registrations from HubSpot
    const registrations = await getHubSpotEventbriteRegistrations(contactId);

    // Filter registrations by user email if available
    const filteredRegistrations = userEmail
      ? registrations.filter(reg =>
          reg.properties?.eb_attendee_email === userEmail
        )
      : registrations;

    // Transform HubSpot custom object data to EventbriteEventData interface
    const events: EventbriteEventData[] = filteredRegistrations.map((registration: any) => {
      const props = registration.properties || {};
      
      return {
        id: props.attendee_number || registration.id,
        name: props.event_name || 'Untitled Event',
        description: props.event_description || null,
        url: props.event_url || null,
        startDate: props.event_start_date || props.registration_date || new Date().toISOString(),
        endDate: props.event_end_date || props.event_start_date || new Date().toISOString(),
        status: props.event_status || 'live',
        isFree: props.is_free === 'true' || props.is_free === true,
        location: props.event_location || null,
        venueName: props.venue_name || null,
      };
    });

    return {
      events,
      message: events.length > 0 ? undefined : "No registered events found"
    };
  } catch (error) {
    console.error('Error fetching registered Eventbrite events from HubSpot:', error);
    
    // Return empty array on error with fallback message
    return {
      events: [],
      message: `Unable to load registered events: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function getMyRegisteredEventbriteEvents(): Promise<EventbriteEventsResponse> {
  // Replace Eventbrite API implementation with HubSpot custom object integration
  return getMyRegisteredEventbriteEventsFromHubSpot();
}

// NEW: Add missing API functions
export async function getUserProfile() {
  // Check if we're in a local development environment
  const hubspotData = (window as any).hubspotPageData;
  
  // If no HubSpot data available (local dev), return mock data
  if (!hubspotData || !hubspotData.memberEmail) {
    return {
      user: {
        id: 1,
        email: 'demo@example.com',
        firstName: 'Demo',
        lastName: 'User',
        phone: null,
        hubspotContactId: null,
        hubspotUserId: null,
        hubspotAccessToken: null,
        hubspotRefreshToken: null,
        companyName: 'Demo Company',
        companySector: 'Laundry Services',
        locationCount: 1,
        createdAt: new Date().toISOString(),
      },
    };
  }
  
  return {
    user: {
      id: parseInt(hubspotData.contactId, 10) || 0,
      email: hubspotData.memberEmail || '',
      firstName: hubspotData.firstName || '',
      lastName: hubspotData.lastName || '',
      phone: hubspotData.phone || null,
      hubspotContactId: hubspotData.contactId || null,
      hubspotUserId: hubspotData.userId || null,
      hubspotAccessToken: null,
      hubspotRefreshToken: null,
      companyName: hubspotData.companyName || null,
      companySector: hubspotData.companySector || null,
      locationCount: hubspotData.locationCount || null,
      createdAt: hubspotData.createdDate || new Date().toISOString(),
    },
  };
}

export async function getMembership() {
  const hubspotData = (window as any).hubspotPageData;
  
  // If no HubSpot data available (local dev), return mock data
  if (!hubspotData || !hubspotData.memberEmail) {
    const mockExpiryDate = new Date();
    mockExpiryDate.setFullYear(mockExpiryDate.getFullYear() + 1); // 1 year from now
    const mockJoinDate = new Date();
    mockJoinDate.setFullYear(mockJoinDate.getFullYear() - 2); // 2 years ago
    
    return {
      membership: {
        id: 1,
        userId: 1,
        membershipId: 'DEMO-001',
        type: 'Premium',
        status: 'Active',
        joinDate: mockJoinDate,
        expiryDate: mockExpiryDate,
        hubspotDealId: null,
        daysUntilExpiry: 365,
        renewalNeeded: false,
      }
    };
  }
  
  let daysUntilExpiry = null;
  let renewalNeeded = false;
  let parsedExpiryDate = null;
  let parsedJoinDate = null;

  if (hubspotData.membershipPaidThrough && hubspotData.membershipPaidThrough !== 'null') {
    parsedExpiryDate = new Date(hubspotData.membershipPaidThrough);
    const now = new Date();
    daysUntilExpiry = Math.ceil((parsedExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    renewalNeeded = daysUntilExpiry <= 60;
  }

  if (hubspotData.activatedDate && hubspotData.activatedDate !== 'null') {
    parsedJoinDate = new Date(hubspotData.activatedDate);
  }
  
  return {
    membership: {
      id: parseInt(hubspotData.membershipId, 10) || parseInt(hubspotData.contactId, 10) || 0,
      userId: parseInt(hubspotData.contactId, 10) || 0,
      membershipId: hubspotData.membershipId || hubspotData.contactId || 'N/A',
      type: hubspotData.membershipType || 'N/A',
      status: hubspotData.memberStatus || 'N/A',
      joinDate: parsedJoinDate || new Date(),
      expiryDate: parsedExpiryDate || new Date(),
      hubspotDealId: hubspotData.dealId || null,
      daysUntilExpiry,
      renewalNeeded,
    }
  };
}

export async function getActivities() {
  // For now, return mock activity data
  // You could enhance this to call HubSpot's timeline API or other sources
  return {
    activities: [
      {
        id: 1,
        type: "profile_update",
        description: "Profile information updated",
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        type: "membership_renewal",
        description: "Membership renewed for another year",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      }
    ]
  };
}

export async function getEvents() {
  // Internal events are now handled by Eventbrite API directly
  // Return empty array since we're using Eventbrite events
  return {
    events: []
  };
}
export async function getAuthMe() {
  // In HubSpot environment, user is already authenticated
  // Use the available HubSpot data to simulate auth response
  const hubspotData = (window as any).hubspotPageData;
  
  // In development, provide mock data
  if (process.env.NODE_ENV === 'development') {
    return {
      user: {
        id: 1,
        email: 'demo@example.com',
        firstName: 'Demo',
        lastName: 'User',
      }
    };
  }
  
  // Check if we have valid HubSpot data (user is authenticated)
  if (!hubspotData || !hubspotData.memberEmail || hubspotData.memberEmail === 'not_available') {
    throw new Error('Not authenticated');
  }
  
  return {
    user: {
      id: hubspotData.contactId,
      email: hubspotData.memberEmail,
      firstName: hubspotData.firstName,
      lastName: hubspotData.lastName,
    }
  };
}

// --- Update HubSpot User Profile ---

export async function updateUserProfile(contactId: string, updates: Record<string, string>) {
  const url = `${BASE}/crm/v3/objects/contacts/${contactId}`;
  const body = {
    properties: updates
  };
  const { data } = await axios.patch(url, body);
  return data;
}

// --- Update Auto-Renewal Request ---

export async function updateAutoRenewalRequest(contactId: string, autoRenewalRequest: boolean) {
  const url = `${BASE}/crm/v3/objects/contacts/${contactId}`;
  const body = {
    properties: {
      auto_renewal_request: autoRenewalRequest.toString()
    }
  };
  const { data } = await axios.patch(url, body);
  return data;
}

// --- Eventbrite Registration Helpers ---

export async function fetchContactId(email: string) {
  const url = `${BASE}/crm/v3/objects/contacts/search`;
  const body = {
    filterGroups: [
      {
        filters: [{ propertyName: "email", operator: "EQ", value: email }]
      }
    ],
    properties: ["id"],
    limit: 1
  };

  const { data } = await axios.post(url, body);
  return data.results?.[0]?.id as string | undefined;
}

export async function fetchRegistrationIds(contactId: string) {
  const url = `${BASE}/crm/v3/objects/contacts/${contactId}/associations/p19544225_eventbrite_registrations`;
  const { data } = await axios.get(url, { params: { limit: 20 } });
  return data.results.map((r: { id: string }) => r.id) as string[];
}

export async function fetchRegistrations(ids: string[]): Promise<RegistrationRecord[]> {
  if (!ids.length) return [];
  const url = `${BASE}/crm/v3/objects/p19544225_eventbrite_registrations/batch/read`;
  const body = {
    inputs: ids.map((id) => ({ id })),
    properties: [
      "event_name",
      "registration_date",
      "event_start_date",
      "event_end_date",
      "event_url",
      "venue_name",
      "event_status",
      "is_free",
      "event_location",
      "eb_attendee_email",
      "attendee_number",
      // New properties from sync Lambda
      "eventbrite_event_id",
      "eventbrite_attendee_id",
      "wordpress_event_url",
      "eb_ticket_type",
      "eb_ticket_price",
      "eb_purchase_amount",
      "eb_quantity_purchased",
      "eb_order_date",
    ]
  };
  const { data } = await axios.post(url, body);
  return data.results;
}

// --- HubSpot Subscription API ---

const SUBSCRIPTION_PROPERTIES = [
  "hs_name",
  "hs_status",
  "hs_next_payment_due_date",
  "hs_last_payment_amount",
  "hs_recurring_billing_frequency",
  "hs_currency_code",
  "hs_recurring_billing_start_date",
].join(",");

function mapSubscription(raw: any): HubSpotSubscriptionData {
  const p = raw.properties || {};
  return {
    id: raw.id,
    name: p.hs_name || null,
    status: p.hs_status || null,
    nextPaymentDate: p.hs_next_payment_due_date || null,
    lastPaymentAmount: p.hs_last_payment_amount != null
      ? parseFloat(p.hs_last_payment_amount)
      : null,
    billingFrequency: p.hs_recurring_billing_frequency || null,
    currencyCode: p.hs_currency_code || null,
    startDate: p.hs_recurring_billing_start_date || null,
  };
}

export async function getContactSubscriptions(contactId: string): Promise<HubSpotSubscriptionData[]> {
  // Step 1: get subscription IDs associated with this contact
  const assocUrl = `${BASE}/crm/v3/objects/contacts/${contactId}/associations/subscriptions`;
  const assocRes = await axios.get(assocUrl);
  const results: Array<{ id: string }> = assocRes.data?.results ?? [];

  if (results.length === 0) return [];

  // Step 2: batch-read subscription details
  const batchUrl = `${BASE}/crm/v3/objects/subscriptions/batch/read`;
  const body = {
    inputs: results.map((r) => ({ id: r.id })),
    properties: SUBSCRIPTION_PROPERTIES.split(","),
  };
  const batchRes = await axios.post(batchUrl, body);
  return (batchRes.data?.results ?? []).map(mapSubscription);
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  // HubSpot cancel endpoint — cancels at next renewal, not immediately
  await axios.post(`${BASE}/crm/v3/objects/subscriptions/${subscriptionId}/cancel`);
}

// Mock subscriptions for local development (no HubSpot context)
export function getMockSubscriptions(): HubSpotSubscriptionData[] {
  const nextBilling = new Date();
  nextBilling.setFullYear(nextBilling.getFullYear() + 1);
  return [
    {
      id: "mock-sub-001",
      name: "Annual Membership",
      status: "active",
      nextPaymentDate: nextBilling.toISOString(),
      lastPaymentAmount: 250.00,
      billingFrequency: "annually",
      currencyCode: "USD",
      startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}
