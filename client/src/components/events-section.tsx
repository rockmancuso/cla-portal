import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, DollarSign, Globe, ExternalLink } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getEventbriteEvents, getMyRegisteredEventbriteEvents, getEvents, type EventbriteEventData, type EventbriteEventsResponse } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  // Query for internal events (existing)
  const { data: internalEventsData } = useQuery<Awaited<ReturnType<typeof getEvents>>>({
    queryKey: ["internalEvents"],
    queryFn: getEvents,
  });

  // Query for internal registrations (existing) - This will be replaced by Eventbrite registered events
  // const { data: registrationsData } = useQuery<InternalRegistrationsResponse>({
  //   queryKey: ["/api/events/registered"],
  //   queryFn: () => apiRequest("GET", "/api/events/registered").then(res => res.json()),
  // });

  // Fetching User's Registered Eventbrite Events
  const {
    data: myEventbriteRegistrationsData,
    isLoading: isLoadingMyEventbriteRegistrations,
    error: myEventbriteRegistrationsError,
  } = useQuery<EventbriteEventsResponse>({ // Assuming EventbriteEventsResponse { events: Event[] }
    queryKey: ["myEventbriteRegisteredEvents"],
    queryFn: getMyRegisteredEventbriteEvents,
  });
  
  // Fetching general upcoming Eventbrite events
  const {
    data: eventbriteEventsData,
    isLoading: isLoadingEventbriteEvents,
    error: eventbriteEventsError
  } = useQuery<EventbriteEventsResponse>({
    queryKey: ["eventbriteEvents"],
    queryFn: getEventbriteEvents,
  });

  const registerMutation = useMutation({
    mutationFn: (eventId: number) => // Assuming internal event ID
      apiRequest("POST", `/api/events/${eventId}/register`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/registered"] });
      toast({
        title: "Registration successful",
        description: "You have been registered for the event",
      });
    },
    onError: () => {
      toast({
        title: "Registration failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    },
  });

  const internalEvents = internalEventsData?.events || [];
  // const registrations = registrationsData?.registrations || []; // Replaced by myEventbriteRegisteredEvents
  const myRegisteredEvents = myEventbriteRegistrationsData?.events || [];
  
  // Filter events by date - show only upcoming events within the next 2 months
  const filterUpcomingEvents = (events: EventbriteEventData[]) => {
    const now = new Date();
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(now.getMonth() + 4);
    
    return events.filter(event => {
      if (!event.startDate) return false;
      const eventDate = new Date(event.startDate);
      return eventDate >= now && eventDate <= twoMonthsFromNow;
    });
  };
  
  const filteredUpcomingEvents = filterUpcomingEvents(eventbriteEventsData?.events || []);
  // Limit to 12 events for better UX (3 rows of 4 or 4 rows of 3)
  const upcomingEventbriteEvents = filteredUpcomingEvents.slice(0, 12);


  const handleRegister = (eventId: number) => { // For internal events (if still used elsewhere)
    registerMutation.mutate(eventId);
  };

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
    if (!dateString) return "Date TBD";
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    };
    if (includeTime) {
      options.hour = 'numeric';
      options.minute = '2-digit';
      // options.timeZoneName = 'short'; // Consider if timezone is needed and available
    }
    return new Date(dateString).toLocaleDateString('en-US', options);
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
      <CardContent className="p-6">
        {/* Registered Eventbrite Events */}
        <div className="mb-8">
          <h4 className="font-semibold text-muted-foreground mb-3">
            My Registered Eventbrite Events
          </h4>
          {isLoadingMyEventbriteRegistrations && (
            <div className="space-y-4">
              {[1, 2].map((i) => ( // Skeleton for registered events
                <div key={i} className="border border-border rounded-lg p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-1" />
                  <Skeleton className="h-3 w-1/3 mb-1" />
                  <Skeleton className="h-8 w-full mt-3" />
                </div>
              ))}
            </div>
          )}
          {myEventbriteRegistrationsError && (
            <Alert variant="destructive">
              <AlertTitle>Error Fetching Your Registered Events</AlertTitle>
              <AlertDescription>
                Could not load your registered events from Eventbrite. Please try again later.
                {(myEventbriteRegistrationsError as Error)?.message && <p className="text-xs mt-1">Details: {(myEventbriteRegistrationsError as Error).message}</p>}
              </AlertDescription>
            </Alert>
          )}
          {!isLoadingMyEventbriteRegistrations && !myEventbriteRegistrationsError && (
            myRegisteredEvents.length > 0 ? (
              <div className="space-y-4">
                {myRegisteredEvents.map((event: EventbriteEventData) => ( // Using EventbriteEventData, ensure fields match
                  <div
                    key={event.id} // Assuming event.id is the Eventbrite ID from backend
                    className="border border-border rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-medium text-foreground line-clamp-2">
                        {event.name || (event as any).title} {/* Fallback to title if name not present */}
                      </h3>
                      <Badge className="bg-green-100 text-green-800 border-green-200 ml-2 flex-shrink-0">
                        Registered
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center">
                        <CalendarDays className="h-3 w-3 mr-2" />
                        {formatDateForDisplay(event.startDate, true)} {/* Show time for registered events */}
                        {event.endDate && event.endDate !== event.startDate &&
                          ` - ${formatDateForDisplay(event.endDate, true)}`
                        }
                      </div>
                      <div className="flex items-center">
                        {(event as any).isVirtual || event.location?.toLowerCase() === "online" ? ( // Check isVirtual from backend Event
                          <Globe className="h-3 w-3 mr-2" />
                        ) : (
                          <MapPin className="h-3 w-3 mr-2" />
                        )}
                        {event.location || "Location TBD"}
                      </div>
                       <div className="flex items-center">
                        <DollarSign className="h-3 w-3 mr-2" />
                        {formatPriceDisplayForEventbrite(event)}
                      </div>
                    </div>
                    {/* Link to Eventbrite event page if URL is available */}
                    {(event.url || (event as any).eventbriteId) && ( // (event as any).eventbriteId for constructing URL if event.url is missing
                      <Button
                        size="sm"
                        className="mt-3 w-full text-xs font-medium bg-accent hover:bg-accent/90 text-accent-foreground transition-colors"
                        onClick={() => window.open(event.url || `https://www.eventbrite.com/e/${(event as any).eventbriteId}`, "_blank")}
                      >
                        View on Eventbrite <ExternalLink className="h-3 w-3 ml-2" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">
                You are not currently registered for any events on Eventbrite.
              </p>
            )
          )}
        </div>

        {/* Upcoming Events from Eventbrite (General) */}
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
                  {filteredUpcomingEvents.length > 12 && (
                    <div className="text-xs text-muted-foreground mb-4 p-3 bg-muted rounded-lg">
                      Showing {upcomingEventbriteEvents.length} of {filteredUpcomingEvents.length} upcoming events in the next 2 months.
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
                          {formatDateForDisplay(event.startDate)}
                          {event.endDate && event.endDate !== event.startDate && ` - ${formatDateForDisplay(event.endDate)}`}
                        </div>
                        <div className="flex items-center">
                          {event.location?.toLowerCase() === "online" ? (
                            <Globe className="h-3 w-3 mr-2" />
                          ) : (
                            <MapPin className="h-3 w-3 mr-2" />
                          )}
                          {event.venueName && event.location?.toLowerCase() !== "online"
                            ? `${event.venueName} - ${event.location}`
                            : event.location || "Location TBD"}
                        </div>
                      </div>
                      {event.description && (
                        <p className="!text-xs text-muted-foreground mt-2 line-clamp-3">
                          {event.description}
                        </p>
                      )}
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
        
        {/* The "View All Events" button might need to point to an internal page or Eventbrite org page */}
        <div className="mt-6 pt-4 border-t border-border">
          <Button className="w-full btn-primary" onClick={() => {
            const eventbriteOrgId = import.meta.env.VITE_EVENTBRITE_ORGANIZATION_ID;
            if (eventbriteOrgId) {
                 window.open(`https://www.eventbrite.com/o/${eventbriteOrgId}`, "_blank");
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
