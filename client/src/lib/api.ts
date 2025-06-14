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
    mockPaidThrough.setFullYear(mockPaidThrough.getFullYear() + 1);
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
    },
    company: {
      name: hubspotData.companyName || null,
      membership_type: hubspotData.companyMembershipType || null,
    }
  };
}

// Eventbrite API integration
export async function getEventbriteEvents(): Promise<EventbriteEventsResponse> {
  const EVENTBRITE_TOKEN = import.meta.env.VITE_EVENTBRITE_PRIVATE_TOKEN || '2YLXYH56CRFQHC36DIPU';
  const EVENTBRITE_ORG_ID = import.meta.env.VITE_EVENTBRITE_ORGANIZATION_ID || '2140213592673';
  
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
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      throw new Error(`Eventbrite API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    // Transform Eventbrite API response to match our EventbriteEventData interface
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
    
    // Return empty array on error since direct API calls are working
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