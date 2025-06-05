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

// PLACEHOLDER: Eventbrite functions - you'll need API credentials for these
export async function getEventbriteEvents(): Promise<EventbriteEventsResponse> {
  // TODO: Add your Eventbrite credentials
  // const EVENTBRITE_TOKEN = 'YOUR_EVENTBRITE_PERSONAL_ACCESS_TOKEN';
  // const EVENTBRITE_ORG_ID = 'YOUR_ORGANIZATION_ID';
  
  // For now, return mock data to stop the 404 errors
  return {
    events: [
      {
        id: "mock-1",
        name: "Sample CLA Event",
        description: "This is a sample event",
        url: "https://eventbrite.com/sample",
        startDate: "2025-07-01T10:00:00Z",
        endDate: "2025-07-01T12:00:00Z",
        status: "live",
        isFree: false,
        location: "Sample Location",
        venueName: "Sample Venue"
      }
    ],
    message: "Mock data - add Eventbrite credentials to load real events"
  };
}

export async function getMyRegisteredEventbriteEvents(): Promise<EventbriteEventsResponse> {
  // TODO: Implement user-specific registered events
  return {
    events: [],
    message: "User registration data not available"
  };
}

// NEW: Add missing API functions
export async function getUserProfile() {
  // Use HubSpot data that's already available
  const hubspotData = (window as any).hubspotPageData;
  
  return {
    user: {
      id: parseInt(hubspotData.contactId, 10) || 0, // Use HubSpot contactId as the user ID, ensure it's a number
      email: hubspotData.memberEmail || '',
      firstName: hubspotData.firstName || '',
      lastName: hubspotData.lastName || '',
      phone: hubspotData.phone || null,
      hubspotContactId: hubspotData.contactId || null,
      hubspotUserId: hubspotData.userId || null, // Assuming hubspotData might have a userId
      hubspotAccessToken: null, // Not typically available on frontend
      hubspotRefreshToken: null, // Not typically available on frontend
      companyName: hubspotData.companyName || null,
      companySector: hubspotData.companySector || null,
      locationCount: hubspotData.locationCount || null,
      createdAt: hubspotData.createdDate || new Date().toISOString(), // Or a relevant creation date from HubSpot
    },
    // This function primarily returns user profile, membership details are separate
  };
}

export async function getMembership() {
  const hubspotData = (window as any).hubspotPageData;
  
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
      id: parseInt(hubspotData.membershipId, 10) || parseInt(hubspotData.contactId, 10) || 0, // Use a membership specific ID or fallback
      userId: parseInt(hubspotData.contactId, 10) || 0,
      membershipId: hubspotData.membershipId || hubspotData.contactId || 'N/A', // A textual membership ID
      type: hubspotData.membershipType || 'N/A',
      status: hubspotData.memberStatus || 'N/A',
      joinDate: parsedJoinDate || new Date(),
      expiryDate: parsedExpiryDate || new Date(),
      hubspotDealId: hubspotData.dealId || null, // Assuming dealId might be available
      // Fields expected by MembershipSection component
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
  // This should call Eventbrite directly
  // For now, return mock data to stop the 404s
  return {
    events: [
      {
        id: 1,
        eventbriteId: "mock-event-1",
        title: "Sample CLA Event",
        description: "This is a sample event from the CLA",
        startDate: "2025-07-15T10:00:00Z",
        endDate: "2025-07-15T12:00:00Z",
        location: "Sample Venue, Chicago, IL",
        isVirtual: false,
        price: 5000, // $50.00 in cents
        maxAttendees: 100
      }
    ]
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