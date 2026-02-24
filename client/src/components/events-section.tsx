import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Globe, ExternalLink } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getEventbriteEvents, type EventbriteEventData, type EventbriteEventsResponse } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import RegistrationsSection from "@/components/registrations-section";

// Define types for internal events and registrations if not already globally available
// This helps in typing the data from useQuery
interface InternalEvent {
  id: number;
  title: string;
  startDate: string; // or Date
  endDate?: string | null; // or Date
  isVirtual: boolean;
  location: string | null;
  price?: number | null;
  description?: string | null;
  // Add other properties as defined by your /api/events endpoint
}

interface InternalEventsResponse {
  events: InternalEvent[];
}

interface InternalRegistration {
  id: number;
  eventId: number;
  ticketNumber: string;
  event: InternalEvent; // Assuming the registration includes event details
  // Add other properties as defined by your /api/events/registered endpoint
}

interface InternalRegistrationsResponse {
  registrations: InternalRegistration[];
}


export default function EventsSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const SHOW_UPCOMING = false;

  // (removed) Internal events query – not used

  // Query for internal registrations (existing) - This will be replaced by Eventbrite registered events
  // const { data: registrationsData } = useQuery<InternalRegistrationsResponse>({
  //   queryKey: ["/api/events/registered"],
  //   queryFn: () => apiRequest("GET", "/api/events/registered").then(res => res.json()),
  // });

  // (removed) Registered Eventbrite events query – handled in RegistrationsSection
  
  // Fetching general upcoming Eventbrite events
  const {
    data: eventbriteEventsData,
    isLoading: isLoadingEventbriteEvents,
    error: eventbriteEventsError
  } = useQuery<EventbriteEventsResponse>({
    queryKey: ["eventbriteEvents"],
    queryFn: getEventbriteEvents,
    enabled: SHOW_UPCOMING,
  });

  // (removed) Internal register mutation – not used in this component

  // (removed) Unused variables from removed queries
  
  // Filter events by date - show only upcoming events within the next 2 months
  const filterUpcomingEvents = (events: EventbriteEventData[]) => {
    const now = new Date();
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(now.getMonth() + 3);
    
    return events.filter(event => {
      if (!event.startDate) return false;
      const eventDate = new Date(event.startDate);
      return eventDate >= now && eventDate <= twoMonthsFromNow;
    });
  };
  
  const filteredUpcomingEvents = filterUpcomingEvents(eventbriteEventsData?.events || []);
  // Limit to 7 events for better UX
  const upcomingEventbriteEvents = filteredUpcomingEvents.slice(0, 5);


  // (removed) Unused handler for internal events

  // const formatInternalEventPrice = (price: number) => { // For internal events (if still used elsewhere)
  //   return (price / 100).toLocaleString('en-US', {
  //     style: 'currency',
  //     currency: 'USD',
  //   });
  // };
  
  const formatPriceDisplayForEventbrite = (event: EventbriteEventData) => {
    // The backend Event type has `price` in cents or null
    // EventbriteEventData has `isFree` (boolean) and we also get `price` from backend
    const priceInCents = (event as any).price; // Accessing the price from the backend Event type

    if (typeof priceInCents === 'number') {
      if (priceInCents === 0) return "Free";
      return (priceInCents / 100).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      });
    }
    if (event.isFree) { // Fallback if price not directly on event from API type
      return "Free";
    }
    return "Paid"; // General paid status if no specific price
  };

  const formatDateForDisplay = (dateString: string | undefined | null, includeTime = true) => {
    if (!dateString || dateString === 'null' || dateString === 'undefined') return "Date TBD";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Date TBD";
    
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    };
    if (includeTime) {
      options.hour = 'numeric';
      options.minute = '2-digit';
    }
    return date.toLocaleDateString('en-US', options);
  };

  const formatTimeForDisplay = (dateString: string | undefined | null) => {
    if (!dateString || dateString === 'null' || dateString === 'undefined') return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatEventDateRange = (startDate: string | undefined | null, endDate: string | undefined | null) => {
    if (!startDate || startDate === 'null' || startDate === 'undefined') return "Date TBD";
    
    // Convert dates to Date objects for comparison
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return "Date TBD";
    
    const end = endDate && endDate !== 'null' && endDate !== 'undefined' ? new Date(endDate) : null;
    if (end && isNaN(end.getTime())) return "Date TBD";
    
    // Check if dates are on the same day
    const isSameDay = end && 
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();

    if (!end || isSameDay) {
      // Same day event - only show date once
      const dateStr = formatDateForDisplay(startDate, false); // Don't include time in the date
      const startTime = formatTimeForDisplay(startDate);
      const endTime = formatTimeForDisplay(endDate);
      return `${dateStr} at ${startTime} - ${endTime}`;
    }
    
    // Multi-day event
    return `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}`;
  };

  // const isRegisteredForInternalEvent = (eventId: number) => { // No longer using internal registrations for this display
  //   return registrations.some(reg => reg.eventId === eventId);
  // };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold text-secondary">
          <CalendarDays className="h-5 w-5 text-primary mr-3" />
          My Events
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-2">
      <RegistrationsSection />

        {SHOW_UPCOMING && (
        <div>
          <h4 className="font-semibold text-muted-foreground mb-3">
            Upcoming Events (Next 2 Months)
          </h4>
          {isLoadingEventbriteEvents && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-border rounded-lg p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-1" />
                  <Skeleton className="h-3 w-1/3 mb-1" />
                  <Skeleton className="h-3 w-1/4 mb-3" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          )}
          {eventbriteEventsError && (
             <Alert variant="destructive">
              <AlertTitle>Error Fetching Events</AlertTitle>
              <AlertDescription>
                Could not load upcoming events from Eventbrite. Please try again later.
                {(eventbriteEventsError as Error)?.message && <p className="text-xs mt-1">Details: {(eventbriteEventsError as Error).message}</p>}
              </AlertDescription>
            </Alert>
          )}
          {!isLoadingEventbriteEvents && !eventbriteEventsError && (
            <div className="space-y-4">
              {upcomingEventbriteEvents.length > 0 ? (
                <>
                  {filteredUpcomingEvents.length > 7 && (
                    <div className="text-xs text-muted-foreground mb-4 p-3 bg-muted rounded-lg">
                      Showing {upcomingEventbriteEvents.length} of {filteredUpcomingEvents.length} upcoming events
                    </div>
                  )}
                  {upcomingEventbriteEvents.map((event: EventbriteEventData) => (
                    <div
                      key={event.id}
                      className="border border-border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm font-medium text-foreground line-clamp-2">
                          {event.name}
                        </h3>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center">
                          <CalendarDays className="h-3 w-3 mr-2" />
                          {formatEventDateRange(event.startDate, event.endDate)}
                        </div>
                        <div className="flex items-center">
                          {event.location?.toLowerCase() === "online" ? (
                            <Globe className="h-3 w-3 mr-2" />
                          ) : (
                            <MapPin className="h-3 w-3 mr-2" />
                          )}
                          {event.venueName && event.location?.toLowerCase() !== "online"
                            ? `${event.venueName}`
                            : event.location || "Location TBD"}
                        </div>
                      </div>
                      
                      {event.url && (
                        <Button
                          size="sm"
                          className="mt-3 w-full text-xs font-medium bg-accent hover:bg-accent/90 text-accent-foreground transition-colors"
                          onClick={() => window.open(event.url, "_blank")}
                        >
                          View on Eventbrite <ExternalLink className="h-3 w-3 ml-2" />
                        </Button>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No upcoming events found in the next 2 months.
                </p>
              )}
            </div>
          )}
        </div>
        )}
        
        {/* The "View All Events" button might need to point to an internal page or Eventbrite org page */}
        <div className="mt-6 pt-4 border-t border-border">
          <Button className="w-full btn-primary" onClick={() => {
            const eventbriteOrgId = import.meta.env.VITE_EVENTBRITE_ORGANIZATION_ID;
            if (eventbriteOrgId) {
                 window.open(`https://laundryassociation.org/events-calendar/`, "_blank");
            } else {
                 toast({ title: "Cannot open Eventbrite page", description: "Eventbrite Organization ID not configured in environment variables (VITE_EVENTBRITE_ORGANIZATION_ID)."});
            }
          }}>
            View All Events on Eventbrite
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
