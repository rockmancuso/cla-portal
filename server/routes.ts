import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertEventRegistrationSchema } from "@shared/schema";
import { z } from "zod";
import "./types";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateProfileSchema = insertUserSchema.partial();

const eventRegistrationSchema = z.object({
  eventId: z.number(),
  eventbriteOrderId: z.string().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
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
    try {
      const events = await storage.getUpcomingEvents();
      res.json({ events });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
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
    try {
      const eventbriteToken = process.env.EVENTBRITE_TOKEN || process.env.EVENTBRITE_API_KEY || "";
      if (!eventbriteToken) {
        return res.status(500).json({ message: "Eventbrite token not configured" });
      }

      // TODO: Implement real Eventbrite API integration
      // This would fetch events from Eventbrite
      
      const events = await storage.getAllEvents();
      res.json({ events });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Eventbrite events" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
