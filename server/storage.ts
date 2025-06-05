import { 
  users, 
  memberships, 
  events, 
  eventRegistrations, 
  activities,
  type User, 
  type InsertUser, 
  type Membership, 
  type InsertMembership,
  type Event,
  type InsertEvent,
  type EventRegistration,
  type InsertEventRegistration,
  type Activity,
  type InsertActivity
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Membership methods
  getMembershipByUserId(userId: number): Promise<Membership | undefined>;
  createMembership(membership: InsertMembership): Promise<Membership>;
  updateMembership(id: number, updates: Partial<InsertMembership>): Promise<Membership | undefined>;

  // Event methods
  getAllEvents(): Promise<Event[]>;
  getUpcomingEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, updates: Partial<InsertEvent>): Promise<Event | undefined>;
  getEventByEventbriteId(eventbriteId: string): Promise<Event | undefined>;

  // Event registration methods
  getEventRegistrationsByUserId(userId: number): Promise<(EventRegistration & { event: Event })[]>;
  createEventRegistration(registration: InsertEventRegistration): Promise<EventRegistration>;
  getEventRegistration(userId: number, eventId: number): Promise<EventRegistration | undefined>;

  // Activity methods
  getActivitiesByUserId(userId: number, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private memberships: Map<number, Membership>;
  private events: Map<number, Event>;
  private eventRegistrations: Map<number, EventRegistration>;
  private activities: Map<number, Activity>;
  private currentUserId: number;
  private currentMembershipId: number;
  private currentEventId: number;
  private currentRegistrationId: number;
  private currentActivityId: number;

  constructor() {
    this.users = new Map();
    this.memberships = new Map();
    this.events = new Map();
    this.eventRegistrations = new Map();
    this.activities = new Map();
    this.currentUserId = 1;
    this.currentMembershipId = 1;
    this.currentEventId = 1;
    this.currentRegistrationId = 1;
    this.currentActivityId = 1;

    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Create sample user
    const user: User = {
      id: 1,
      email: 'sarah.johnson@cleanpro.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '(555) 123-4567',
      hubspotContactId: 'hubspot_contact_123',
      hubspotUserId: null,
      hubspotAccessToken: null,
      hubspotRefreshToken: null,
      companyName: 'Clean Pro Laundromats',
      companySector: 'Commercial Laundry',
      locationCount: 12,
      createdAt: new Date('2020-01-15'),
    };
    this.users.set(1, user);

    // Create sample membership
    const membership: Membership = {
      id: 1,
      userId: 1,
      membershipId: 'CLA-2020-0847',
      type: 'Professional',
      status: 'Active',
      joinDate: new Date('2020-01-15'),
      expiryDate: new Date('2024-12-31'),
      hubspotDealId: 'hubspot_deal_456',
    };
    this.memberships.set(1, membership);

    // Create sample events
    const event1: Event = {
      id: 1,
      eventbriteId: 'eventbrite_123',
      title: '2024 Annual Conference',
      description: 'The premier event for laundry professionals',
      startDate: new Date('2024-03-15'),
      endDate: new Date('2024-03-17'),
      location: 'Las Vegas, NV',
      isVirtual: false,
      price: 29500, // $295.00
      maxAttendees: 500,
    };
    
    const event2: Event = {
      id: 2,
      eventbriteId: 'eventbrite_124',
      title: 'Regional Training Workshop',
      description: 'Hands-on training for equipment maintenance',
      startDate: new Date('2024-04-08'),
      endDate: new Date('2024-04-08'),
      location: 'Chicago, IL',
      isVirtual: false,
      price: 12500, // $125.00
      maxAttendees: 50,
    };

    const event3: Event = {
      id: 3,
      eventbriteId: 'eventbrite_125',
      title: 'Equipment Safety Seminar',
      description: 'Virtual seminar on safety protocols',
      startDate: new Date('2024-05-12'),
      endDate: new Date('2024-05-12'),
      location: 'Virtual Event',
      isVirtual: true,
      price: 7500, // $75.00
      maxAttendees: 100,
    };

    this.events.set(1, event1);
    this.events.set(2, event2);
    this.events.set(3, event3);

    // Create sample registration
    const registration: EventRegistration = {
      id: 1,
      userId: 1,
      eventId: 1,
      ticketNumber: 'CLA2024-001234',
      registrationDate: new Date('2024-03-01'),
      eventbriteOrderId: 'eventbrite_order_789',
    };
    this.eventRegistrations.set(1, registration);

    // Create sample activities
    const activities = [
      {
        id: 1,
        userId: 1,
        type: 'registration',
        description: 'Registration confirmed for 2024 Annual Conference',
        createdAt: new Date('2024-03-01T10:32:00'),
      },
      {
        id: 2,
        userId: 1,
        type: 'profile_update',
        description: 'Profile updated - Company information changed',
        createdAt: new Date('2024-02-28T14:15:00'),
      },
      {
        id: 3,
        userId: 1,
        type: 'payment',
        description: 'Payment processed for membership renewal',
        createdAt: new Date('2024-02-25T09:45:00'),
      },
    ];

    activities.forEach(activity => this.activities.set(activity.id, activity));
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
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
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getMembershipByUserId(userId: number): Promise<Membership | undefined> {
    return Array.from(this.memberships.values()).find(membership => membership.userId === userId);
  }

  async createMembership(insertMembership: InsertMembership): Promise<Membership> {
    const id = this.currentMembershipId++;
    const membership: Membership = {
      id,
      userId: insertMembership.userId,
      membershipId: insertMembership.membershipId,
      type: insertMembership.type,
      status: insertMembership.status,
      joinDate: insertMembership.joinDate,
      expiryDate: insertMembership.expiryDate,
      hubspotDealId: insertMembership.hubspotDealId ?? null,
    };
    this.memberships.set(id, membership);
    return membership;
  }

  async updateMembership(id: number, updates: Partial<InsertMembership>): Promise<Membership | undefined> {
    const membership = this.memberships.get(id);
    if (!membership) return undefined;
    
    const updatedMembership = { ...membership, ...updates };
    this.memberships.set(id, updatedMembership);
    return updatedMembership;
  }

  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  async getUpcomingEvents(): Promise<Event[]> {
    const now = new Date();
    return Array.from(this.events.values())
      .filter(event => event.startDate > now)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.currentEventId++;
    const event: Event = {
      id,
      eventbriteId: insertEvent.eventbriteId,
      title: insertEvent.title,
      description: insertEvent.description ?? null,
      startDate: insertEvent.startDate,
      endDate: insertEvent.endDate ?? null,
      location: insertEvent.location ?? null,
      isVirtual: insertEvent.isVirtual ?? false,
      price: insertEvent.price ?? null,
      maxAttendees: insertEvent.maxAttendees ?? null,
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: number, updates: Partial<InsertEvent>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;

    // Merge existing event data with updates
    // Ensure all fields from Event are considered, and optional fields from InsertEvent are handled
    const updatedEvent: Event = {
      ...event,
      ...updates,
      // Ensure fields that might be null in InsertEvent but not in Event (if applicable) are handled
      // For example, if 'description' could be null in updates but shouldn't overwrite a non-null existing description unless explicitly set to null
      description: updates.description !== undefined ? updates.description : event.description,
      endDate: updates.endDate !== undefined ? updates.endDate : event.endDate,
      location: updates.location !== undefined ? updates.location : event.location,
      isVirtual: updates.isVirtual !== undefined ? updates.isVirtual : event.isVirtual,
      price: updates.price !== undefined ? updates.price : event.price,
      maxAttendees: updates.maxAttendees !== undefined ? updates.maxAttendees : event.maxAttendees,
    };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async getEventByEventbriteId(eventbriteId: string): Promise<Event | undefined> {
    for (const event of Array.from(this.events.values())) {
      if (event.eventbriteId === eventbriteId) {
        return event;
      }
    }
    return undefined;
  }
 
  async getEventRegistrationsByUserId(userId: number): Promise<(EventRegistration & { event: Event })[]> {
    const userRegistrations = Array.from(this.eventRegistrations.values())
      .filter(registration => registration.userId === userId);
    
    return userRegistrations.map(registration => {
      const event = this.events.get(registration.eventId);
      return { ...registration, event: event! };
    }).filter(reg => reg.event);
  }

  async createEventRegistration(insertRegistration: InsertEventRegistration): Promise<EventRegistration> {
    const id = this.currentRegistrationId++;
    const registration: EventRegistration = {
      id,
      userId: insertRegistration.userId,
      eventId: insertRegistration.eventId,
      ticketNumber: insertRegistration.ticketNumber,
      registrationDate: new Date(),
      eventbriteOrderId: insertRegistration.eventbriteOrderId ?? null,
    };
    this.eventRegistrations.set(id, registration);
    return registration;
  }

  async getEventRegistration(userId: number, eventId: number): Promise<EventRegistration | undefined> {
    return Array.from(this.eventRegistrations.values())
      .find(registration => registration.userId === userId && registration.eventId === eventId);
  }

  async getActivitiesByUserId(userId: number, limit: number = 10): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(0, limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const activity: Activity = {
      id,
      userId: insertActivity.userId,
      type: insertActivity.type,
      description: insertActivity.description,
      createdAt: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }
}

export const storage = new MemStorage();
