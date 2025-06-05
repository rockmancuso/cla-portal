// server/index.ts
import "dotenv/config";
import express2 from "express";
import session from "express-session";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  users;
  memberships;
  events;
  eventRegistrations;
  activities;
  currentUserId;
  currentMembershipId;
  currentEventId;
  currentRegistrationId;
  currentActivityId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.memberships = /* @__PURE__ */ new Map();
    this.events = /* @__PURE__ */ new Map();
    this.eventRegistrations = /* @__PURE__ */ new Map();
    this.activities = /* @__PURE__ */ new Map();
    this.currentUserId = 1;
    this.currentMembershipId = 1;
    this.currentEventId = 1;
    this.currentRegistrationId = 1;
    this.currentActivityId = 1;
    this.initializeData();
  }
  initializeData() {
    const user = {
      id: 1,
      email: "sarah.johnson@cleanpro.com",
      firstName: "Sarah",
      lastName: "Johnson",
      phone: "(555) 123-4567",
      hubspotContactId: "hubspot_contact_123",
      hubspotUserId: null,
      hubspotAccessToken: null,
      hubspotRefreshToken: null,
      companyName: "Clean Pro Laundromats",
      companySector: "Commercial Laundry",
      locationCount: 12,
      createdAt: /* @__PURE__ */ new Date("2020-01-15")
    };
    this.users.set(1, user);
    const membership = {
      id: 1,
      userId: 1,
      membershipId: "CLA-2020-0847",
      type: "Professional",
      status: "Active",
      joinDate: /* @__PURE__ */ new Date("2020-01-15"),
      expiryDate: /* @__PURE__ */ new Date("2024-12-31"),
      hubspotDealId: "hubspot_deal_456"
    };
    this.memberships.set(1, membership);
    const event1 = {
      id: 1,
      eventbriteId: "eventbrite_123",
      title: "2024 Annual Conference",
      description: "The premier event for laundry professionals",
      startDate: /* @__PURE__ */ new Date("2024-03-15"),
      endDate: /* @__PURE__ */ new Date("2024-03-17"),
      location: "Las Vegas, NV",
      isVirtual: false,
      price: 29500,
      // $295.00
      maxAttendees: 500
    };
    const event2 = {
      id: 2,
      eventbriteId: "eventbrite_124",
      title: "Regional Training Workshop",
      description: "Hands-on training for equipment maintenance",
      startDate: /* @__PURE__ */ new Date("2024-04-08"),
      endDate: /* @__PURE__ */ new Date("2024-04-08"),
      location: "Chicago, IL",
      isVirtual: false,
      price: 12500,
      // $125.00
      maxAttendees: 50
    };
    const event3 = {
      id: 3,
      eventbriteId: "eventbrite_125",
      title: "Equipment Safety Seminar",
      description: "Virtual seminar on safety protocols",
      startDate: /* @__PURE__ */ new Date("2024-05-12"),
      endDate: /* @__PURE__ */ new Date("2024-05-12"),
      location: "Virtual Event",
      isVirtual: true,
      price: 7500,
      // $75.00
      maxAttendees: 100
    };
    this.events.set(1, event1);
    this.events.set(2, event2);
    this.events.set(3, event3);
    const registration = {
      id: 1,
      userId: 1,
      eventId: 1,
      ticketNumber: "CLA2024-001234",
      registrationDate: /* @__PURE__ */ new Date("2024-03-01"),
      eventbriteOrderId: "eventbrite_order_789"
    };
    this.eventRegistrations.set(1, registration);
    const activities2 = [
      {
        id: 1,
        userId: 1,
        type: "registration",
        description: "Registration confirmed for 2024 Annual Conference",
        createdAt: /* @__PURE__ */ new Date("2024-03-01T10:32:00")
      },
      {
        id: 2,
        userId: 1,
        type: "profile_update",
        description: "Profile updated - Company information changed",
        createdAt: /* @__PURE__ */ new Date("2024-02-28T14:15:00")
      },
      {
        id: 3,
        userId: 1,
        type: "payment",
        description: "Payment processed for membership renewal",
        createdAt: /* @__PURE__ */ new Date("2024-02-25T09:45:00")
      }
    ];
    activities2.forEach((activity) => this.activities.set(activity.id, activity));
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByEmail(email) {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }
  async createUser(insertUser) {
    const id = this.currentUserId++;
    const user = {
      id,
      email: insertUser.email,
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      phone: insertUser.phone ?? null,
      hubspotContactId: insertUser.hubspotContactId ?? null,
      hubspotUserId: insertUser.hubspotUserId ?? null,
      hubspotAccessToken: insertUser.hubspotAccessToken ?? null,
      hubspotRefreshToken: insertUser.hubspotRefreshToken ?? null,
      companyName: insertUser.companyName ?? null,
      companySector: insertUser.companySector ?? null,
      locationCount: insertUser.locationCount ?? null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.users.set(id, user);
    return user;
  }
  async updateUser(id, updates) {
    const user = this.users.get(id);
    if (!user) return void 0;
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  async getMembershipByUserId(userId) {
    return Array.from(this.memberships.values()).find((membership) => membership.userId === userId);
  }
  async createMembership(insertMembership) {
    const id = this.currentMembershipId++;
    const membership = {
      id,
      userId: insertMembership.userId,
      membershipId: insertMembership.membershipId,
      type: insertMembership.type,
      status: insertMembership.status,
      joinDate: insertMembership.joinDate,
      expiryDate: insertMembership.expiryDate,
      hubspotDealId: insertMembership.hubspotDealId ?? null
    };
    this.memberships.set(id, membership);
    return membership;
  }
  async updateMembership(id, updates) {
    const membership = this.memberships.get(id);
    if (!membership) return void 0;
    const updatedMembership = { ...membership, ...updates };
    this.memberships.set(id, updatedMembership);
    return updatedMembership;
  }
  async getAllEvents() {
    return Array.from(this.events.values());
  }
  async getUpcomingEvents() {
    const now = /* @__PURE__ */ new Date();
    return Array.from(this.events.values()).filter((event) => event.startDate > now).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }
  async getEvent(id) {
    return this.events.get(id);
  }
  async createEvent(insertEvent) {
    const id = this.currentEventId++;
    const event = {
      id,
      eventbriteId: insertEvent.eventbriteId,
      title: insertEvent.title,
      description: insertEvent.description ?? null,
      startDate: insertEvent.startDate,
      endDate: insertEvent.endDate ?? null,
      location: insertEvent.location ?? null,
      isVirtual: insertEvent.isVirtual ?? false,
      price: insertEvent.price ?? null,
      maxAttendees: insertEvent.maxAttendees ?? null
    };
    this.events.set(id, event);
    return event;
  }
  async updateEvent(id, updates) {
    const event = this.events.get(id);
    if (!event) return void 0;
    const updatedEvent = {
      ...event,
      ...updates,
      // Ensure fields that might be null in InsertEvent but not in Event (if applicable) are handled
      // For example, if 'description' could be null in updates but shouldn't overwrite a non-null existing description unless explicitly set to null
      description: updates.description !== void 0 ? updates.description : event.description,
      endDate: updates.endDate !== void 0 ? updates.endDate : event.endDate,
      location: updates.location !== void 0 ? updates.location : event.location,
      isVirtual: updates.isVirtual !== void 0 ? updates.isVirtual : event.isVirtual,
      price: updates.price !== void 0 ? updates.price : event.price,
      maxAttendees: updates.maxAttendees !== void 0 ? updates.maxAttendees : event.maxAttendees
    };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }
  async getEventByEventbriteId(eventbriteId) {
    for (const event of Array.from(this.events.values())) {
      if (event.eventbriteId === eventbriteId) {
        return event;
      }
    }
    return void 0;
  }
  async getEventRegistrationsByUserId(userId) {
    const userRegistrations = Array.from(this.eventRegistrations.values()).filter((registration) => registration.userId === userId);
    return userRegistrations.map((registration) => {
      const event = this.events.get(registration.eventId);
      return { ...registration, event };
    }).filter((reg) => reg.event);
  }
  async createEventRegistration(insertRegistration) {
    const id = this.currentRegistrationId++;
    const registration = {
      id,
      userId: insertRegistration.userId,
      eventId: insertRegistration.eventId,
      ticketNumber: insertRegistration.ticketNumber,
      registrationDate: /* @__PURE__ */ new Date(),
      eventbriteOrderId: insertRegistration.eventbriteOrderId ?? null
    };
    this.eventRegistrations.set(id, registration);
    return registration;
  }
  async getEventRegistration(userId, eventId) {
    return Array.from(this.eventRegistrations.values()).find((registration) => registration.userId === userId && registration.eventId === eventId);
  }
  async getActivitiesByUserId(userId, limit = 10) {
    return Array.from(this.activities.values()).filter((activity) => activity.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
  }
  async createActivity(insertActivity) {
    const id = this.currentActivityId++;
    const activity = {
      id,
      userId: insertActivity.userId,
      type: insertActivity.type,
      description: insertActivity.description,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.activities.set(id, activity);
    return activity;
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  hubspotContactId: text("hubspot_contact_id"),
  hubspotUserId: text("hubspot_user_id"),
  hubspotAccessToken: text("hubspot_access_token"),
  hubspotRefreshToken: text("hubspot_refresh_token"),
  companyName: text("company_name"),
  companySector: text("company_sector"),
  locationCount: integer("location_count"),
  createdAt: timestamp("created_at").defaultNow()
});
var memberships = pgTable("memberships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  membershipId: text("membership_id").notNull().unique(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  joinDate: timestamp("join_date").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  hubspotDealId: text("hubspot_deal_id")
});
var events = pgTable("events", {
  id: serial("id").primaryKey(),
  eventbriteId: text("eventbrite_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  location: text("location"),
  isVirtual: boolean("is_virtual").default(false),
  price: integer("price"),
  // in cents
  maxAttendees: integer("max_attendees")
});
var eventRegistrations = pgTable("event_registrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  eventId: integer("event_id").notNull(),
  ticketNumber: text("ticket_number").notNull(),
  registrationDate: timestamp("registration_date").defaultNow(),
  eventbriteOrderId: text("eventbrite_order_id")
});
var activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});
var insertMembershipSchema = createInsertSchema(memberships).omit({
  id: true
});
var insertEventSchema = createInsertSchema(events).omit({
  id: true
});
var insertEventRegistrationSchema = createInsertSchema(eventRegistrations).omit({
  id: true,
  registrationDate: true
});
var insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true
});

// server/routes.ts
import { z } from "zod";

// server/types.ts
import "express-session";

// server/routes.ts
import { AuthorizationCode } from "simple-oauth2";
import fetch from "node-fetch";
var loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
var updateProfileSchema = insertUserSchema.partial();
var eventRegistrationSchema = z.object({
  eventId: z.number(),
  eventbriteOrderId: z.string().optional()
});
async function registerRoutes(app2) {
  const hubspotOauth2ClientConfig = {
    client: {
      id: process.env.HUBSPOT_CLIENT_ID,
      // Ensure these are set
      secret: process.env.HUBSPOT_CLIENT_SECRET
      // Ensure these are set
    },
    auth: {
      tokenHost: "https://api.hubapi.com",
      tokenPath: "/oauth/v1/token",
      authorizeHost: "https://app.hubspot.com",
      authorizePath: "/oauth/authorize"
    },
    options: {
      authorizationMethod: "body"
    }
  };
  const hubspotOAuth2 = new AuthorizationCode(hubspotOauth2ClientConfig);
  const HUBSPOT_REDIRECT_URI = "http://localhost:5001/auth/hubspot/callback";
  const HUBSPOT_SCOPES = "oauth crm.objects.contacts.read";
  const oldHubspotOauth2 = new AuthorizationCode({
    client: {
      id: process.env.HUBSPOT_CLIENT_ID || "YOUR_HUBSPOT_CLIENT_ID_OLD",
      // Use different placeholders if needed
      secret: process.env.HUBSPOT_CLIENT_SECRET || "YOUR_HUBSPOT_CLIENT_SECRET_OLD"
    },
    auth: {
      tokenHost: "https://api.hubapi.com",
      tokenPath: "/oauth/v1/token",
      authorizePath: "/oauth/authorize"
    },
    options: {
      authorizationMethod: "body"
      // HubSpot expects client_id and client_secret in the body
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.userId = user.id;
      res.json({ user });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });
  app2.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  });
  app2.post("/api/auth/establish-hubspot-session", async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Email is required in the request body." });
    }
    try {
      req.session.isAuthenticated = true;
      req.session.hubspotContactEmail = email;
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
  app2.get("/api/user/profile", async (req, res) => {
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
  app2.patch("/api/user/profile", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const updates = updateProfileSchema.parse(req.body);
      const updatedUser = await storage.updateUser(req.session.userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.createActivity({
        userId: req.session.userId,
        type: "profile_update",
        description: "Profile updated - Personal information changed"
      });
      res.json({ user: updatedUser });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });
  app2.get("/api/membership", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const membership = await storage.getMembershipByUserId(req.session.userId);
      if (!membership) {
        return res.status(404).json({ message: "Membership not found" });
      }
      const now = /* @__PURE__ */ new Date();
      const expiryDate = new Date(membership.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1e3 * 60 * 60 * 24));
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
  app2.get("/api/events", async (req, res) => {
    const organizationId = process.env.EVENTBRITE_ORGANIZATION_ID;
    const privateToken = process.env.EVENTBRITE_PRIVATE_TOKEN;
    if (!organizationId || !privateToken) {
      console.error("Eventbrite API credentials (EVENTBRITE_ORGANIZATION_ID or EVENTBRITE_PRIVATE_TOKEN) are not configured.");
      return res.json({ events: [] });
    }
    const eventbriteApiUrl = `https://www.eventbriteapi.com/v3/organizations/${organizationId}/events/?status=live&order_by=start_asc`;
    try {
      const response = await fetch(eventbriteApiUrl, {
        headers: {
          "Authorization": `Bearer ${privateToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Eventbrite API error: ${response.status} ${response.statusText}`, errorBody);
        return res.json({ events: [] });
      }
      const eventbriteData = await response.json();
      const storedEvents = [];
      for (const ebEvent of eventbriteData.events) {
        const priceInCents = ebEvent.ticket_availability?.minimum_ticket_price?.value ?? null;
        let locationString = null;
        if (ebEvent.venue?.address?.localized_address_display) {
          locationString = ebEvent.venue.address.localized_address_display;
        } else if (ebEvent.online_event) {
          locationString = "Online";
        }
        const eventDataToStore = {
          // This aligns with InsertEvent
          eventbriteId: ebEvent.id,
          title: ebEvent.name?.text || "Untitled Event",
          description: ebEvent.description?.text || null,
          startDate: new Date(ebEvent.start.utc),
          endDate: new Date(ebEvent.end.utc),
          location: locationString,
          isVirtual: ebEvent.online_event || false,
          price: priceInCents,
          maxAttendees: ebEvent.capacity ?? null
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
      res.json({ events: [] });
    }
  });
  app2.get("/api/eventbrite/my-registered-events", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY || "pat-na1-a8161b60-cc83-472d-b73a-82dd2426c114";
    const EVENTBRITE_PRIVATE_TOKEN = process.env.EVENTBRITE_PRIVATE_TOKEN || "WK5XGDSSSF47G64OHA";
    const EVENTBRITE_REGISTRATION_OBJECT_ID = "2-43504117";
    const CONTACT_TO_EVENTBRITE_REG_ASSOC_ID = "1-95";
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || !user.email) {
        return res.status(404).json({ message: "User not found or email missing" });
      }
      let hubspotContactId = user.hubspotContactId;
      if (!hubspotContactId) {
        const searchPayload = {
          filterGroups: [{
            filters: [{ propertyName: "email", operator: "EQ", value: user.email }]
          }],
          properties: ["hs_object_id", "email"],
          // hs_object_id is the contact ID
          limit: 1
        };
        const contactSearchResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/search`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${HUBSPOT_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(searchPayload)
        });
        if (!contactSearchResponse.ok) {
          const errorBody = await contactSearchResponse.text();
          console.error("HubSpot Contact Search API error:", contactSearchResponse.status, errorBody);
          return res.status(500).json({ message: "Failed to search HubSpot contact" });
        }
        const contactSearchResult = await contactSearchResponse.json();
        if (contactSearchResult.total > 0 && contactSearchResult.results[0]) {
          hubspotContactId = contactSearchResult.results[0].id;
          await storage.updateUser(user.id, { hubspotContactId });
        } else {
          return res.status(404).json({ message: "HubSpot contact not found for user's email." });
        }
      }
      const associatedRegistrationsUrl = `https://api.hubapi.com/crm/v3/objects/${EVENTBRITE_REGISTRATION_OBJECT_ID}/search`;
      const searchAssociatedObjectsPayload = {
        filterGroups: [{
          filters: [{
            propertyName: "associations.contact",
            // This assumes a standard association naming. Might need adjustment.
            // Or more robustly, use the association type ID if the API supports it in search.
            // The v4 associations API is more direct:
            // /crm/v4/objects/contact/{contactId}/associations/{toCustomObjectTypeId}
            // Let's try the v4 associations endpoint first as it's cleaner.
            operator: "EQ",
            value: hubspotContactId
          }]
        }],
        properties: ["attendee_number", "hs_object_id"],
        // Fetch attendee_number and the custom object's own ID
        limit: 100
        // Assuming a user won't have more than 100s of registrations
      };
      const v4AssociationsUrl = `https://api.hubapi.com/crm/v4/objects/contacts/${hubspotContactId}/associations/${EVENTBRITE_REGISTRATION_OBJECT_ID}`;
      const hubspotRegistrationsResponse = await fetch(v4AssociationsUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${HUBSPOT_API_KEY}`,
          "Content-Type": "application/json"
        }
      });
      if (!hubspotRegistrationsResponse.ok) {
        const errorBody = await hubspotRegistrationsResponse.text();
        console.error("HubSpot Get Associated Custom Objects API error:", hubspotRegistrationsResponse.status, errorBody);
        return res.status(500).json({ message: "Failed to fetch associated Eventbrite registrations from HubSpot" });
      }
      const associationResults = await hubspotRegistrationsResponse.json();
      const customObjectIds = associationResults.results.filter((assoc) => assoc.associationTypes.some((at) => at.typeId === CONTACT_TO_EVENTBRITE_REG_ASSOC_ID)).map((assoc) => assoc.toObjectId);
      if (customObjectIds.length === 0) {
        return res.json({ events: [] });
      }
      const batchReadPayload = {
        inputs: customObjectIds.map((id) => ({ id })),
        properties: ["attendee_number"]
      };
      const batchReadUrl = `https://api.hubapi.com/crm/v3/objects/${EVENTBRITE_REGISTRATION_OBJECT_ID}/batch/read`;
      const batchReadResponse = await fetch(batchReadUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HUBSPOT_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(batchReadPayload)
      });
      if (!batchReadResponse.ok) {
        const errorBody = await batchReadResponse.text();
        console.error("HubSpot Batch Read Custom Objects API error:", batchReadResponse.status, errorBody);
        return res.status(500).json({ message: "Failed to batch read Eventbrite registration details from HubSpot" });
      }
      const batchReadResult = await batchReadResponse.json();
      const attendeeIds = batchReadResult.results.map((reg) => reg.properties.attendee_number).filter((id) => !!id);
      if (attendeeIds.length === 0) {
        return res.json({ events: [] });
      }
      const eventbriteEventIds = [];
      for (const attendeeId of attendeeIds) {
        try {
          const attendeeApiUrl = `https://www.eventbriteapi.com/v3/attendees/${attendeeId}/`;
          const ebAttendeeResponse = await fetch(attendeeApiUrl, {
            headers: { "Authorization": `Bearer ${EVENTBRITE_PRIVATE_TOKEN}` }
          });
          if (ebAttendeeResponse.ok) {
            const attendeeData = await ebAttendeeResponse.json();
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
      const fetchedEvents = [];
      for (const eventId of uniqueEventbriteEventIds) {
        const eventApiUrl = `https://www.eventbriteapi.com/v3/events/${eventId}/?expand=venue`;
        try {
          const ebEventResponse = await fetch(eventApiUrl, {
            headers: { "Authorization": `Bearer ${EVENTBRITE_PRIVATE_TOKEN}` }
          });
          if (ebEventResponse.ok) {
            const ebEventData = await ebEventResponse.json();
            let locationString = null;
            if (ebEventData.venue?.address?.localized_address_display) {
              locationString = ebEventData.venue.address.localized_address_display;
            } else if (ebEventData.online_event) {
              locationString = "Online";
            }
            const transformedEvent = {
              // Match local Event schema, id will be assigned by storage if created
              eventbriteId: ebEventData.id,
              title: ebEventData.name?.text || "Untitled Event",
              description: ebEventData.description?.text || null,
              startDate: new Date(ebEventData.start.utc),
              endDate: new Date(ebEventData.end.utc),
              location: locationString,
              isVirtual: ebEventData.online_event || false,
              price: ebEventData.ticket_availability?.minimum_ticket_price?.value ?? null,
              maxAttendees: ebEventData.capacity ?? null
            };
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
  app2.get("/api/events/registered", async (req, res) => {
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
  app2.post("/api/events/:eventId/register", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const eventId = parseInt(req.params.eventId);
      const { eventbriteOrderId } = eventRegistrationSchema.parse(req.body);
      const existingRegistration = await storage.getEventRegistration(req.session.userId, eventId);
      if (existingRegistration) {
        return res.status(400).json({ message: "Already registered for this event" });
      }
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      const ticketNumber = `CLA${(/* @__PURE__ */ new Date()).getFullYear()}-${String(Date.now()).slice(-6)}`;
      const registration = await storage.createEventRegistration({
        userId: req.session.userId,
        eventId,
        ticketNumber,
        eventbriteOrderId: eventbriteOrderId || `eventbrite_${Date.now()}`
      });
      await storage.createActivity({
        userId: req.session.userId,
        type: "registration",
        description: `Registration confirmed for ${event.title}`
      });
      res.json({ registration });
    } catch (error) {
      res.status(400).json({ message: "Failed to register for event" });
    }
  });
  app2.get("/api/activities", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const activities2 = await storage.getActivitiesByUserId(req.session.userId, limit);
      res.json({ activities: activities2 });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });
  app2.get("/api/hubspot/dashboard-data", async (req, res) => {
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
        "email",
        "firstname",
        "lastname",
        // Basic info
        "membership_type",
        "membership_paid_through__c",
        "current_term_start_date__c",
        "member_status",
        "activated_date__c",
        "associatedcompanyid"
      ];
      const companyPropertiesToFetch = ["name", "membership_type"];
      const searchPayload = {
        filterGroups: [{
          filters: [{ propertyName: "email", operator: "EQ", value: email }]
        }],
        properties: contactPropertiesToFetch,
        limit: 1
      };
      const contactSearchResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/search`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hubspotAccessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(searchPayload)
      });
      if (!contactSearchResponse.ok) {
        const errorBody = await contactSearchResponse.text();
        console.error("HubSpot API error (contact search):", contactSearchResponse.status, errorBody);
        return res.status(contactSearchResponse.status).json({ message: `Failed to search HubSpot contact: ${errorBody}` });
      }
      const contactSearchResult = await contactSearchResponse.json();
      if (!contactSearchResult.results || contactSearchResult.results.length === 0) {
        return res.status(404).json({ message: "HubSpot contact not found for this email." });
      }
      const contactData = contactSearchResult.results[0];
      const contactProperties = contactData.properties;
      let companyProperties = null;
      const associatedCompanyId = contactProperties.associatedcompanyid;
      if (associatedCompanyId) {
        const companyResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/companies/${associatedCompanyId}?properties=${companyPropertiesToFetch.join(",")}`, {
          headers: {
            Authorization: `Bearer ${hubspotAccessToken}`
          }
        });
        if (companyResponse.ok) {
          const companyData = await companyResponse.json();
          companyProperties = companyData.properties;
        } else {
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
          lastName: contactProperties.lastname
        },
        company: companyProperties ? {
          name: companyProperties.name,
          membership_type: companyProperties.membership_type
        } : null
      });
    } catch (error) {
      console.error("Error fetching HubSpot dashboard data:", error);
      if (error instanceof Error) {
        return res.status(500).json({ message: `Internal server error: ${error.message}` });
      }
      return res.status(500).json({ message: "An unknown error occurred while fetching HubSpot data." });
    }
  });
  app2.post("/api/hubspot/sync", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const hubspotApiKey = process.env.HUBSPOT_API_KEY || process.env.HUBSPOT_KEY || "";
      if (!hubspotApiKey) {
        return res.status(500).json({ message: "HubSpot API key not configured" });
      }
      res.json({ message: "HubSpot sync completed" });
    } catch (error) {
      res.status(500).json({ message: "HubSpot sync failed" });
    }
  });
  app2.get("/api/eventbrite/events", async (req, res) => {
    const organizationId = process.env.EVENTBRITE_ORGANIZATION_ID;
    const privateToken = process.env.EVENTBRITE_PRIVATE_TOKEN;
    if (!organizationId || !privateToken) {
      console.error("Eventbrite API credentials (EVENTBRITE_ORGANIZATION_ID or EVENTBRITE_PRIVATE_TOKEN) are not configured for /api/eventbrite/events.");
      return res.status(503).json({ message: "Eventbrite API not configured.", events: [] });
    }
    const eventbriteApiUrl = `https://www.eventbriteapi.com/v3/organizations/${organizationId}/events/?status=live&order_by=start_asc&expand=venue,ticket_availability`;
    try {
      const response = await fetch(eventbriteApiUrl, {
        headers: {
          "Authorization": `Bearer ${privateToken}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Eventbrite API error for /api/eventbrite/events: ${response.status} ${response.statusText}`, errorBody);
        return res.status(response.status).json({ message: `Failed to fetch events from Eventbrite: ${response.statusText}`, events: [] });
      }
      const eventbriteData = await response.json();
      const transformedEvents = eventbriteData.events.map((ebEvent) => {
        let locationString = null;
        if (ebEvent.venue?.address?.localized_address_display) {
          locationString = ebEvent.venue.address.localized_address_display;
        } else if (ebEvent.online_event) {
          locationString = "Online";
        }
        return {
          id: ebEvent.id,
          // Eventbrite's own ID for the event
          name: ebEvent.name?.text || "Untitled Event",
          description: ebEvent.description?.text || null,
          url: ebEvent.url,
          startDate: ebEvent.start.utc,
          endDate: ebEvent.end.utc,
          status: ebEvent.status,
          isFree: ebEvent.is_free ?? ebEvent.ticket_availability?.minimum_ticket_price?.value === 0,
          location: locationString,
          venueName: ebEvent.venue?.name || null
          // Consider adding ticket_availability details if useful for the frontend
          // e.g., ebEvent.ticket_availability?.has_available_tickets
        };
      });
      res.json({ events: transformedEvents });
    } catch (error) {
      console.error("Error fetching or processing events from Eventbrite for /api/eventbrite/events:", error);
      res.status(500).json({ message: "Failed to fetch or process events for dashboard", events: [] });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || "cla-dev-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1e3
    // 24 hours
  }
}));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = process.env.PORT || 5001;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
