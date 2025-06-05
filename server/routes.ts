import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertEventRegistrationSchema, type InsertUser, type Event } from "@shared/schema";
import { z } from "zod";
import "./types";
import { AuthorizationCode } from 'simple-oauth2';
import fetch from 'node-fetch'; // Or use axios or another http client
import axios from 'axios'; // As requested, though simple-oauth2 handles token exchange

// HubSpot API Interfaces for Dashboard
interface HubSpotContactProperties {
  membership_type?: string | null;
  membership_paid_through__c?: string | null; // "Valid Through" AND "Paid Through"
  current_term_start_date__c?: string | null; // Current Term Start Date
  member_status?: string | null; // Membership Status
  activated_date__c?: string | null; // Member Since
  associatedcompanyid?: string | null; // To get the company ID
  // Other potential properties if needed from contact
  email?: string;
  firstname?: string;
  lastname?: string;
}

interface HubSpotCompanyProperties {
  name?: string | null; // Company Name
  membership_type?: string | null; // Membership Type (Company Level)
}

interface HubSpotContactResponse {
  id: string;
  properties: HubSpotContactProperties;
  archived: boolean;
  // Add other fields from HubSpot contact API response if needed
}

interface HubSpotCompanyResponse {
  id: string;
  properties: HubSpotCompanyProperties;
  archived: boolean;
  // Add other fields from HubSpot company API response if needed
}

interface HubSpotSearchRequest {
  filterGroups: Array<{
    filters: Array<{
      propertyName: string;
      operator: 'EQ' | 'NEQ' | 'LT' | 'LTE' | 'GT' | 'GTE' | 'BETWEEN' | 'IN' | 'NOT_IN' | 'HAS_PROPERTY' | 'NOT_HAS_PROPERTY' | 'CONTAINS_TOKEN' | 'NOT_CONTAINS_TOKEN';
      value: string | number | boolean | Array<string | number | boolean>;
    }>;
  }>;
  properties: string[];
  limit?: number;
  after?: string;
}

interface HubSpotSearchResults<T> {
  total: number;
  results: T[];
  paging?: {
    next?: {
      after: string;
      link?: string;
    };
  };
}

// HubSpot Eventbrite Registration Custom Object
interface HubSpotEventbriteRegistrationProperties {
  attendee_number?: string | null; // Eventbrite Attendee ID
  // Add other properties if needed from this custom object
}

interface HubSpotEventbriteRegistrationObject {
  id: string;
  properties: HubSpotEventbriteRegistrationProperties;
  archived: boolean;
  // associations?: any; // If you need to inspect associations directly
}

// Eventbrite API Interfaces
interface EventbriteAttendeeResponse {
  id: string; // Attendee ID
  event_id: string; // The crucial Event ID we need
  order_id: string;
  // Add other attendee properties if needed
  // e.g., profile, costs, barcoces, answers, team, etc.
}

interface EventbriteMinimumTicketPrice {
  value: number; // in cents
  currency: string;
  major_value: string;
  display: string;
}

interface EventbriteTicketAvailability {
  has_available_tickets?: boolean;
  is_sold_out?: boolean;
  minimum_ticket_price?: EventbriteMinimumTicketPrice | null;
  maximum_ticket_price?: EventbriteMinimumTicketPrice | null;
}

interface EventbriteAddress {
  address_1?: string | null;
  address_2?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  country?: string | null;
  localized_address_display?: string | null;
}

interface EventbriteVenue {
  id?: string;
  name?: string | null;
  address?: EventbriteAddress | null;
}

interface EventbriteTextHtml {
  text: string | null;
  html: string | null;
}

interface EventbriteDateTime {
  timezone: string;
  local: string;
  utc: string;
}

interface EventbriteEvent {
  id: string;
  name: EventbriteTextHtml;
  description: EventbriteTextHtml;
  url?: string;
  start: EventbriteDateTime;
  end: EventbriteDateTime;
  organization_id?: string;
  created?: string;
  changed?: string;
  capacity: number | null;
  status?: string;
  currency?: string;
  listed?: boolean;
  shareable?: boolean;
  online_event: boolean;
  is_free?: boolean;
  venue_id?: string | null;
  organizer_id?: string | null;
  format_id?: string | null;
  category_id?: string | null;
  subcategory_id?: string | null;
  ticket_availability?: EventbriteTicketAvailability | null;
  venue?: EventbriteVenue | null;
}

interface EventbriteEventsResponse {
  pagination?: {
    object_count: number;
    page_number: number;
    page_size: number;
    page_count: number;
    has_more_items: boolean;
  };
  events: EventbriteEvent[];
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateProfileSchema = insertUserSchema.partial();

const eventRegistrationSchema = z.object({
  eventId: z.number(),
  eventbriteOrderId: z.string().optional(),
});

interface HubSpotOwnerInfo {
  id: string | number; // HubSpot IDs can sometimes be numbers
  email: string;
  firstName?: string;
  lastName?: string;
  userId?: number; // This is the HubSpot user ID, distinct from your app's user ID
  // Add other fields you might expect from the /crm/v3/owners/{ownerId} endpoint
}

export async function registerRoutes(app: Express): Promise<Server> {

  const hubspotOauth2ClientConfig = {
    client: {
      id: process.env.HUBSPOT_CLIENT_ID!, // Ensure these are set
      secret: process.env.HUBSPOT_CLIENT_SECRET!, // Ensure these are set
    },
    auth: {
      tokenHost: 'https://api.hubapi.com',
      tokenPath: '/oauth/v1/token',
authorizeHost: 'https://app.hubspot.com',
      authorizePath: '/oauth/authorize',
    },
    options: {
      authorizationMethod: 'body' as const,
    },
  };

  const hubspotOAuth2 = new AuthorizationCode(hubspotOauth2ClientConfig);

  const HUBSPOT_REDIRECT_URI = 'http://localhost:5001/auth/hubspot/callback';
  const HUBSPOT_SCOPES = 'oauth crm.objects.contacts.read';

  // New HubSpot OAuth Routes (These are for a different OAuth flow, not member login)
  // Commenting out as per instructions for member portal flow, can be re-enabled if needed for admin login.
  /*
  app.get("/auth/hubspot", (req, res) => {
    const authorizationUri = hubspotOAuth2.authorizeURL({
      redirect_uri: HUBSPOT_REDIRECT_URI,
      scope: HUBSPOT_SCOPES,
    });
    res.redirect(authorizationUri);
  });

  app.get("/auth/hubspot/callback", async (req, res) => {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      console.error("HubSpot OAuth callback error: Authorization code missing or invalid.");
      return res.status(400).send("Authorization code missing or invalid. Please try logging in again.");
    }

    const tokenParams = {
      code,
      redirect_uri: HUBSPOT_REDIRECT_URI,
      // grant_type: 'authorization_code' is added by simple-oauth2
      // client_id and client_secret are also added by simple-oauth2 from its config
    };

    try {
      const accessToken = await hubspotOAuth2.getToken(tokenParams);
      // accessToken.token contains access_token, refresh_token, expires_in, etc.
      const { access_token, refresh_token } = accessToken.token;

      if (!access_token) {
        console.error("HubSpot OAuth callback error: Access token not received.");
        return res.status(500).send("Failed to obtain HubSpot access token. Please try again.");
      }

      // Integrate with Express Session
      req.session.hubspotAccessToken = access_token;
      if (refresh_token) { // Store refresh token if available
        req.session.hubspotRefreshToken = refresh_token;
      }
      req.session.isAuthenticated = true;

      // Save the session before redirecting
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          // Handle error, perhaps redirect to an error page or send a 500 response
          return res.status(500).send("Failed to save session. Please try again.");
        }
        // Redirect the user to the frontend dashboard
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`);
      });

    } catch (error: any) {
      console.error("HubSpot OAuth Callback Error:", error.message);
      if (error.data?.payload) {
        console.error("OAuth Error Details:", error.data.payload);
        return res.status(500).send(`HubSpot authentication failed: ${error.data.payload.error_description || error.message}. Please try again.`);
      }
      return res.status(500).send(`HubSpot authentication failed: ${error.message}. Please try again.`);
    }
  });
  */

  // Existing hubspotOauth2 instance, potentially for other flows or to be deprecated
  const oldHubspotOauth2 = new AuthorizationCode({
    client: {
      id: process.env.HUBSPOT_CLIENT_ID || 'YOUR_HUBSPOT_CLIENT_ID_OLD', // Use different placeholders if needed
      secret: process.env.HUBSPOT_CLIENT_SECRET || 'YOUR_HUBSPOT_CLIENT_SECRET_OLD',
    },
    auth: {
      tokenHost: 'https://api.hubapi.com',
      tokenPath: '/oauth/v1/token',
      authorizePath: '/oauth/authorize',
    },
    options: {
      authorizationMethod: 'body', // HubSpot expects client_id and client_secret in the body
    },
  });

  // Authentication endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // In a real app, verify password hash
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session (simplified for demo)
      req.session.userId = user.id;
      
      res.json({ user });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  });

  // New endpoint to establish session based on HubSpot member email
  app.post("/api/auth/establish-hubspot-session", async (req, res) => {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: "Email is required in the request body." });
    }

    try {
      req.session.isAuthenticated = true;
      req.session.hubspotContactEmail = email;
      // Optional: Future logic to look up/create local portal user
      // req.session.portalUserId = ...;

      req.session.save((err) => {
        if (err) {
          console.error("Session save error on /api/auth/establish-hubspot-session:", err);
          return res.status(500).json({ message: "Failed to save session." });
        }
        res.status(200).json({ message: "Session established successfully." });
      });
    } catch (error) {
      console.error("Error in /api/auth/establish-hubspot-session:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  });

  // HubSpot OAuth (Existing - to be reviewed/deprecated if new routes cover all needs)
  // Note: The new routes /auth/hubspot and /auth/hubspot/callback are implemented above as per instructions.
  // This existing section might need to be removed or updated.
  /*
  app.get("/api/auth/hubspot", (req, res) => {
    const authorizationUri = oldHubspotOauth2.authorizeURL({ // Using oldHubspotOauth2 instance
      redirect_uri: process.env.HUBSPOT_REDIRECT_URI || 'http://localhost:5000/api/auth/hubspot/callback', // Old redirect URI
      scope: 'oauth crm.objects.contacts.read crm.objects.contacts.write',
      // Add any other HubSpot specific parameters if needed
    });
    res.redirect(authorizationUri);
  });

  app.get("/api/auth/hubspot/callback", async (req, res) => {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ message: "Authorization code missing or invalid." });
    }

    const tokenParams = {
      code,
      redirect_uri: process.env.HUBSPOT_REDIRECT_URI || 'http://localhost:5000/api/auth/hubspot/callback', // Old redirect URI
    };

    try {
      const accessToken = await oldHubspotOauth2.getToken(tokenParams); // Using oldHubspotOauth2 instance
      const { token } = accessToken;

      // Existing logic for fetching user, creating/updating user, session etc.
      // This part is different from the new /auth/hubspot/callback which just sets a cookie.
      const hubspotUserResponse = await fetch(`https://api.hubapi.com/crm/v3/owners/${token.user_id}?idProperty=id&archived=false`, {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      });
      
      if (!hubspotUserResponse.ok) {
        const errorBody = await hubspotUserResponse.text();
        console.error("HubSpot API error (user info):", hubspotUserResponse.status, errorBody);
        throw new Error(`Failed to fetch HubSpot user info: ${hubspotUserResponse.status}`);
      }

      const hubspotUser = await hubspotUserResponse.json() as HubSpotOwnerInfo;
      const email = hubspotUser.email;
      const firstName = hubspotUser.firstName;
      const lastName = hubspotUser.lastName;
      const hubspotUserId = hubspotUser.id.toString();

      if (!email) {
        console.error("HubSpot user email not found in API response:", hubspotUser);
        return res.status(500).json({ message: "HubSpot user email not found." });
      }

      let user = await storage.getUserByEmail(email);

      if (user) {
        req.session.userId = user.id;
        await storage.updateUser(user.id, {
          hubspotUserId: hubspotUserId,
          hubspotAccessToken: token.access_token as string,
          hubspotRefreshToken: token.refresh_token as string,
        });
      } else {
        const newUserPayload: InsertUser = {
          email,
          firstName: firstName || 'HubSpot User',
          lastName: lastName || '',
          hubspotUserId: hubspotUserId,
          hubspotAccessToken: token.access_token as string,
          hubspotRefreshToken: token.refresh_token as string,
        };
        const newUser = await storage.createUser(newUserPayload);
        req.session.userId = newUser.id;
      }

      res.redirect("/");
    } catch (error: any) { // Added type annotation for error
      console.error("HubSpot OAuth Callback Error (old /api/auth/hubspot/callback):", error.message);
      if (error.data?.payload) {
        console.error("OAuth Error Details:", error.data.payload);
        return res.status(500).json({ message: "HubSpot authentication failed.", details: error.data.payload });
      }
      return res.status(500).json({ message: "HubSpot authentication failed." });
    }
  });
  */
  // User profile endpoints
  app.get("/api/user/profile", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const membership = await storage.getMembershipByUserId(user.id);
      
      res.json({ user, membership });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.patch("/api/user/profile", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const updates = updateProfileSchema.parse(req.body);
      const updatedUser = await storage.updateUser(req.session.userId, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Log activity
      await storage.createActivity({
        userId: req.session.userId,
        type: "profile_update",
        description: "Profile updated - Personal information changed",
      });

      res.json({ user: updatedUser });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Membership endpoints
  app.get("/api/membership", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const membership = await storage.getMembershipByUserId(req.session.userId);
      if (!membership) {
        return res.status(404).json({ message: "Membership not found" });
      }

      // Check if renewal is needed (within 60 days)
      const now = new Date();
      const expiryDate = new Date(membership.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const renewalNeeded = daysUntilExpiry <= 60;

      res.json({ 
        membership: {
          ...membership,
          daysUntilExpiry,
          renewalNeeded
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch membership" });
    }
  });

  // Events endpoints
  app.get("/api/events", async (req, res) => {
    const organizationId = process.env.EVENTBRITE_ORGANIZATION_ID;
    const privateToken = process.env.EVENTBRITE_PRIVATE_TOKEN;

    if (!organizationId || !privateToken) {
      console.error("Eventbrite API credentials (EVENTBRITE_ORGANIZATION_ID or EVENTBRITE_PRIVATE_TOKEN) are not configured.");
      return res.json({ events: [] }); // Return empty list as per requirement
    }

    const eventbriteApiUrl = `https://www.eventbriteapi.com/v3/organizations/${organizationId}/events/?status=live&order_by=start_asc`;

    try {
      const response = await fetch(eventbriteApiUrl, {
        headers: {
          "Authorization": `Bearer ${privateToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Eventbrite API error: ${response.status} ${response.statusText}`, errorBody);
        // Return empty list on API error as per softer error handling approach
        return res.json({ events: [] });
      }

      const eventbriteData = await response.json() as EventbriteEventsResponse;
      const storedEvents: Event[] = [];

      for (const ebEvent of eventbriteData.events) {
        const priceInCents = ebEvent.ticket_availability?.minimum_ticket_price?.value ?? null;
        
        let locationString: string | null = null;
        if (ebEvent.venue?.address?.localized_address_display) {
          locationString = ebEvent.venue.address.localized_address_display;
        } else if (ebEvent.online_event) {
          locationString = "Online";
        }

        const eventDataToStore: Omit<Event, 'id'> = { // This aligns with InsertEvent
          eventbriteId: ebEvent.id,
          title: ebEvent.name?.text || "Untitled Event",
          description: ebEvent.description?.text || null,
          startDate: new Date(ebEvent.start.utc),
          endDate: new Date(ebEvent.end.utc),
          location: locationString,
          isVirtual: ebEvent.online_event || false,
          price: priceInCents,
          maxAttendees: ebEvent.capacity ?? null,
        };

        const existingEvent = await storage.getEventByEventbriteId(ebEvent.id);

        if (existingEvent) {
          const updatedEvent = await storage.updateEvent(existingEvent.id, eventDataToStore);
          if (updatedEvent) {
            storedEvents.push(updatedEvent);
          }
        } else {
          const newEvent = await storage.createEvent(eventDataToStore);
          storedEvents.push(newEvent);
        }
      }
 
      res.json({ events: storedEvents });
 
    } catch (error) {
      console.error("Failed to fetch or process events from Eventbrite:", error);
      // Return 503 or empty list based on requirements. Task says "empty array ... or an appropriate error response"
      // For now, sticking to empty array for consistency with missing keys, but logging the error.
      // If a 503 is preferred, change `res.json({ events: [] })` to `res.status(503).json({ message: "Service unavailable" })`
      res.json({ events: [] }); // Defaulting to empty list on other errors too
    }
  });

  app.get("/api/eventbrite/my-registered-events", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY || 'pat-na1-a8161b60-cc83-472d-b73a-82dd2426c114'; // Use provided key
    const EVENTBRITE_PRIVATE_TOKEN = process.env.EVENTBRITE_PRIVATE_TOKEN || 'WK5XGDSSSF47G64OHA'; // Use provided key
    const EVENTBRITE_REGISTRATION_OBJECT_ID = '2-43504117';
    const CONTACT_TO_EVENTBRITE_REG_ASSOC_ID = '1-95'; // As per user: "contact_to_eventbrite_registrations" association type ID

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || !user.email) { // Also check for email as it's crucial
        return res.status(404).json({ message: "User not found or email missing" });
      }

      let hubspotContactId = user.hubspotContactId;

      // 1. Get HubSpot Contact ID if not already stored
      if (!hubspotContactId) {
        const searchPayload: HubSpotSearchRequest = {
          filterGroups: [{
            filters: [{ propertyName: "email", operator: "EQ", value: user.email }]
          }],
          properties: ["hs_object_id", "email"], // hs_object_id is the contact ID
          limit: 1
        };
        const contactSearchResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/search`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(searchPayload)
        });

        if (!contactSearchResponse.ok) {
          const errorBody = await contactSearchResponse.text();
          console.error("HubSpot Contact Search API error:", contactSearchResponse.status, errorBody);
          return res.status(500).json({ message: "Failed to search HubSpot contact" });
        }
        const contactSearchResult = await contactSearchResponse.json() as HubSpotSearchResults<HubSpotContactResponse>;
        if (contactSearchResult.total > 0 && contactSearchResult.results[0]) {
          hubspotContactId = contactSearchResult.results[0].id;
          // Optionally, update this hubspotContactId in your local user storage
          await storage.updateUser(user.id, { hubspotContactId });
        } else {
          return res.status(404).json({ message: "HubSpot contact not found for user's email." });
        }
      }

      // 2. Fetch associated "Eventbrite Registration" custom objects
      // GET /crm/v4/objects/contact/{contactId}/associations/{toObjectType}
      // toObjectType for Eventbrite Registrations is EVENTBRITE_REGISTRATION_OBJECT_ID
      // The API returns a list of associated object IDs. We need their properties.
      // So, it's better to fetch the custom objects associated with the contact.
      // This requires knowing the association definition ID from Contact TO CustomObject.
      // The user provided: "fromObjectTypeId": "2-43504117" (Custom Obj), "toObjectTypeId": "0-1" (Contact)
      // This means we query custom objects and see which are associated TO the contact.
      // OR, query contact and ask for associations TO custom object.
      // Let's try: GET /crm/v4/objects/contacts/{contactId}/associations/{customObjectTypeId}
      // The association type ID given (1-95) is for "contact_to_eventbrite_registrations"
      // fromObjectTypeId: 2-43504117 (custom obj), toObjectTypeId: 0-1 (contact)
      // This means on the custom object, there's an association to contact.
      // So we should search custom objects filtered by association to our contactId.

      const associatedRegistrationsUrl = `https://api.hubapi.com/crm/v3/objects/${EVENTBRITE_REGISTRATION_OBJECT_ID}/search`;
      const searchAssociatedObjectsPayload = {
        filterGroups: [{
          filters: [{
            propertyName: "associations.contact", // This assumes a standard association naming. Might need adjustment.
                                                  // Or more robustly, use the association type ID if the API supports it in search.
                                                  // The v4 associations API is more direct:
                                                  // /crm/v4/objects/contact/{contactId}/associations/{toCustomObjectTypeId}
                                                  // Let's try the v4 associations endpoint first as it's cleaner.
            operator: "EQ",
            value: hubspotContactId
          }]
        }],
        properties: ["attendee_number", "hs_object_id"], // Fetch attendee_number and the custom object's own ID
        limit: 100 // Assuming a user won't have more than 100s of registrations
      };
      
      // Using v4 associations endpoint:
      // GET /crm/v4/objects/contact/{contactId}/associations/{toObjectType}
      // where toObjectType is EVENTBRITE_REGISTRATION_OBJECT_ID
      const v4AssociationsUrl = `https://api.hubapi.com/crm/v4/objects/contacts/${hubspotContactId}/associations/${EVENTBRITE_REGISTRATION_OBJECT_ID}`;

      const hubspotRegistrationsResponse = await fetch(v4AssociationsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!hubspotRegistrationsResponse.ok) {
        const errorBody = await hubspotRegistrationsResponse.text();
        console.error("HubSpot Get Associated Custom Objects API error:", hubspotRegistrationsResponse.status, errorBody);
        return res.status(500).json({ message: "Failed to fetch associated Eventbrite registrations from HubSpot" });
      }

      const associationResults = await hubspotRegistrationsResponse.json() as { results: Array<{ toObjectId: string, associationTypes: Array<{ typeId: string, category: string, programaticName: string }> }> };
      
      const customObjectIds = associationResults.results
        .filter(assoc => assoc.associationTypes.some(at => at.typeId === CONTACT_TO_EVENTBRITE_REG_ASSOC_ID)) // Ensure correct association type
        .map(assoc => assoc.toObjectId);

      if (customObjectIds.length === 0) {
        return res.json({ events: [] }); // No registrations found
      }

      // 3. Batch fetch properties for these custom object IDs
      const batchReadPayload = {
        inputs: customObjectIds.map(id => ({ id })),
        properties: ["attendee_number"]
      };
      const batchReadUrl = `https://api.hubapi.com/crm/v3/objects/${EVENTBRITE_REGISTRATION_OBJECT_ID}/batch/read`;
      const batchReadResponse = await fetch(batchReadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(batchReadPayload)
      });

      if (!batchReadResponse.ok) {
        const errorBody = await batchReadResponse.text();
        console.error("HubSpot Batch Read Custom Objects API error:", batchReadResponse.status, errorBody);
        return res.status(500).json({ message: "Failed to batch read Eventbrite registration details from HubSpot" });
      }
      const batchReadResult = await batchReadResponse.json() as HubSpotSearchResults<HubSpotEventbriteRegistrationObject>;
      
      const attendeeIds: string[] = batchReadResult.results
        .map(reg => reg.properties.attendee_number)
        .filter((id): id is string => !!id);

      if (attendeeIds.length === 0) {
        return res.json({ events: [] }); // No attendee numbers found
      }

      // 4. Fetch Eventbrite Event IDs using Attendee IDs
      const eventbriteEventIds: string[] = [];
      for (const attendeeId of attendeeIds) {
        try {
          const attendeeApiUrl = `https://www.eventbriteapi.com/v3/attendees/${attendeeId}/`;
          const ebAttendeeResponse = await fetch(attendeeApiUrl, {
            headers: { "Authorization": `Bearer ${EVENTBRITE_PRIVATE_TOKEN}` }
          });
          if (ebAttendeeResponse.ok) {
            const attendeeData = await ebAttendeeResponse.json() as EventbriteAttendeeResponse;
            if (attendeeData.event_id) {
              eventbriteEventIds.push(attendeeData.event_id);
            }
          } else {
            console.warn(`Failed to fetch Eventbrite attendee ${attendeeId}: ${ebAttendeeResponse.status}`);
          }
        } catch (e) {
          console.warn(`Error fetching Eventbrite attendee ${attendeeId}:`, e);
        }
      }

      const uniqueEventbriteEventIds = Array.from(new Set(eventbriteEventIds));
      if (uniqueEventbriteEventIds.length === 0) {
        return res.json({ events: [] });
      }

      // 5. Fetch full Eventbrite event details for each unique event ID
      const fetchedEvents: Event[] = [];
      for (const eventId of uniqueEventbriteEventIds) {
        // Check if event already exists in local DB to avoid redundant API calls if desired,
        // or just fetch fresh from Eventbrite. For now, fetching fresh.
        const eventApiUrl = `https://www.eventbriteapi.com/v3/events/${eventId}/?expand=venue`; // expand venue for location
        try {
          const ebEventResponse = await fetch(eventApiUrl, {
            headers: { "Authorization": `Bearer ${EVENTBRITE_PRIVATE_TOKEN}` }
          });
          if (ebEventResponse.ok) {
            const ebEventData = await ebEventResponse.json() as EventbriteEvent; // Using existing interface
            
            // Transform EventbriteEvent to local Event schema
            let locationString: string | null = null;
            if (ebEventData.venue?.address?.localized_address_display) {
              locationString = ebEventData.venue.address.localized_address_display;
            } else if (ebEventData.online_event) {
              locationString = "Online";
            }

            const transformedEvent: Omit<Event, 'id'> = { // Match local Event schema, id will be assigned by storage if created
              eventbriteId: ebEventData.id,
              title: ebEventData.name?.text || "Untitled Event",
              description: ebEventData.description?.text || null,
              startDate: new Date(ebEventData.start.utc),
              endDate: new Date(ebEventData.end.utc),
              location: locationString,
              isVirtual: ebEventData.online_event || false,
              price: ebEventData.ticket_availability?.minimum_ticket_price?.value ?? null,
              maxAttendees: ebEventData.capacity ?? null,
            };
            
            // Upsert into local storage (optional, but good for caching/consistency)
            let localEvent = await storage.getEventByEventbriteId(transformedEvent.eventbriteId);
            if (localEvent) {
              const updated = await storage.updateEvent(localEvent.id, transformedEvent);
              if (updated) fetchedEvents.push(updated);
            } else {
              const created = await storage.createEvent(transformedEvent);
              fetchedEvents.push(created);
            }
          } else {
            console.warn(`Failed to fetch Eventbrite event ${eventId}: ${ebEventResponse.status}`);
          }
        } catch (e) {
          console.warn(`Error fetching Eventbrite event ${eventId}:`, e);
        }
      }
      
      res.json({ events: fetchedEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) });

    } catch (error) {
      console.error("Failed to fetch user's registered events:", error);
      res.status(500).json({ message: "Failed to fetch user's registered events" });
    }
  });

  app.get("/api/events/registered", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const registrations = await storage.getEventRegistrationsByUserId(req.session.userId);
      res.json({ registrations });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  app.post("/api/events/:eventId/register", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const eventId = parseInt(req.params.eventId);
      const { eventbriteOrderId } = eventRegistrationSchema.parse(req.body);

      // Check if already registered
      const existingRegistration = await storage.getEventRegistration(req.session.userId, eventId);
      if (existingRegistration) {
        return res.status(400).json({ message: "Already registered for this event" });
      }

      // Get event details
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Generate ticket number
      const ticketNumber = `CLA${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      // Create registration
      const registration = await storage.createEventRegistration({
        userId: req.session.userId,
        eventId,
        ticketNumber,
        eventbriteOrderId: eventbriteOrderId || `eventbrite_${Date.now()}`,
      });

      // Log activity
      await storage.createActivity({
        userId: req.session.userId,
        type: "registration",
        description: `Registration confirmed for ${event.title}`,
      });

      res.json({ registration });
    } catch (error) {
      res.status(400).json({ message: "Failed to register for event" });
    }
  });

  // Activities endpoint
  app.get("/api/activities", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getActivitiesByUserId(req.session.userId, limit);
      res.json({ activities });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // HubSpot Data Endpoint for Dashboard
  app.get("/api/hubspot/dashboard-data", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || !user.email || !user.hubspotAccessToken) {
        return res.status(403).json({ message: "User data or HubSpot token missing." });
      }

      const { email, hubspotAccessToken } = user;
      const contactPropertiesToFetch = [
        "email", "firstname", "lastname", // Basic info
        "membership_type", "membership_paid_through__c", "current_term_start_date__c",
        "member_status", "activated_date__c", "associatedcompanyid"
      ];
      const companyPropertiesToFetch = ["name", "membership_type"];

      // 1. Search for HubSpot contact by email
      const searchPayload: HubSpotSearchRequest = {
        filterGroups: [{
          filters: [{ propertyName: "email", operator: "EQ", value: email }]
        }],
        properties: contactPropertiesToFetch,
        limit: 1
      };

      const contactSearchResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/search`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hubspotAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchPayload),
      });

      if (!contactSearchResponse.ok) {
        const errorBody = await contactSearchResponse.text();
        console.error("HubSpot API error (contact search):", contactSearchResponse.status, errorBody);
        return res.status(contactSearchResponse.status).json({ message: `Failed to search HubSpot contact: ${errorBody}` });
      }

      const contactSearchResult = await contactSearchResponse.json() as HubSpotSearchResults<HubSpotContactResponse>;

      if (!contactSearchResult.results || contactSearchResult.results.length === 0) {
        return res.status(404).json({ message: "HubSpot contact not found for this email." });
      }

      const contactData = contactSearchResult.results[0];
      const contactProperties = contactData.properties;

      let companyProperties: HubSpotCompanyProperties | null = null;
      const associatedCompanyId = contactProperties.associatedcompanyid;

      // 2. If company ID exists, fetch company data
      if (associatedCompanyId) {
        const companyResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/companies/${associatedCompanyId}?properties=${companyPropertiesToFetch.join(',')}`, {
          headers: {
            Authorization: `Bearer ${hubspotAccessToken}`,
          },
        });

        if (companyResponse.ok) {
          const companyData = await companyResponse.json() as HubSpotCompanyResponse;
          companyProperties = companyData.properties;
        } else {
          // Log error but don't fail the whole request if company fetch fails
          const errorBody = await companyResponse.text();
          console.warn(`Failed to fetch HubSpot company ${associatedCompanyId}: ${companyResponse.status} - ${errorBody}`);
        }
      }

      res.json({
        contact: {
          membership_type: contactProperties.membership_type,
          membership_paid_through__c: contactProperties.membership_paid_through__c,
          current_term_start_date__c: contactProperties.current_term_start_date__c,
          member_status: contactProperties.member_status,
          activated_date__c: contactProperties.activated_date__c,
          // Include other relevant contact details if needed by frontend
          email: contactProperties.email,
          firstName: contactProperties.firstname,
          lastName: contactProperties.lastname,
        },
        company: companyProperties ? {
          name: companyProperties.name,
          membership_type: companyProperties.membership_type,
        } : null,
      });

    } catch (error) {
      console.error("Error fetching HubSpot dashboard data:", error);
      if (error instanceof Error) {
        return res.status(500).json({ message: `Internal server error: ${error.message}` });
      }
      return res.status(500).json({ message: "An unknown error occurred while fetching HubSpot data." });
    }
  });

  // HubSpot integration endpoints (placeholder for real implementation)
  app.post("/api/hubspot/sync", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const hubspotApiKey = process.env.HUBSPOT_API_KEY || process.env.HUBSPOT_KEY || "";
      if (!hubspotApiKey) {
        return res.status(500).json({ message: "HubSpot API key not configured" });
      }

      // TODO: Implement real HubSpot API integration
      // This would sync user data with HubSpot contacts and deals
      
      res.json({ message: "HubSpot sync completed" });
    } catch (error) {
      res.status(500).json({ message: "HubSpot sync failed" });
    }
  });

  // Eventbrite integration endpoints (placeholder for real implementation)
  app.get("/api/eventbrite/events", async (req, res) => {
    const organizationId = process.env.EVENTBRITE_ORGANIZATION_ID;
    const privateToken = process.env.EVENTBRITE_PRIVATE_TOKEN;

    if (!organizationId || !privateToken) {
      console.error("Eventbrite API credentials (EVENTBRITE_ORGANIZATION_ID or EVENTBRITE_PRIVATE_TOKEN) are not configured for /api/eventbrite/events.");
      return res.status(503).json({ message: "Eventbrite API not configured.", events: [] });
    }

    // Fetch live and upcoming events, ordered by start date, and expand venue and ticket_availability
    const eventbriteApiUrl = `https://www.eventbriteapi.com/v3/organizations/${organizationId}/events/?status=live&order_by=start_asc&expand=venue,ticket_availability`;

    try {
      const response = await fetch(eventbriteApiUrl, {
        headers: {
          "Authorization": `Bearer ${privateToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Eventbrite API error for /api/eventbrite/events: ${response.status} ${response.statusText}`, errorBody);
        return res.status(response.status).json({ message: `Failed to fetch events from Eventbrite: ${response.statusText}`, events: [] });
      }

      const eventbriteData = await response.json() as EventbriteEventsResponse;

      const transformedEvents = eventbriteData.events.map(ebEvent => {
        let locationString: string | null = null;
        if (ebEvent.venue?.address?.localized_address_display) {
          locationString = ebEvent.venue.address.localized_address_display;
        } else if (ebEvent.online_event) {
          locationString = "Online";
        }

        return {
          id: ebEvent.id, // Eventbrite's own ID for the event
          name: ebEvent.name?.text || "Untitled Event",
          description: ebEvent.description?.text || null,
          url: ebEvent.url,
          startDate: ebEvent.start.utc,
          endDate: ebEvent.end.utc,
          status: ebEvent.status,
          isFree: ebEvent.is_free ?? (ebEvent.ticket_availability?.minimum_ticket_price?.value === 0),
          location: locationString,
          venueName: ebEvent.venue?.name || null,
          // Consider adding ticket_availability details if useful for the frontend
          // e.g., ebEvent.ticket_availability?.has_available_tickets
        };
      });

      res.json({ events: transformedEvents });

    } catch (error) {
      console.error("Error fetching or processing events from Eventbrite for /api/eventbrite/events:", error);
      // It's generally better to provide a more specific error status if possible,
      // but 500 is a safe default for unexpected server-side issues.
      res.status(500).json({ message: "Failed to fetch or process events for dashboard", events: [] });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
