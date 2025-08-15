import { useRegistrations } from "../hooks/use-registrations";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { CalendarDays, MapPin, Globe, DollarSign, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { getEventbriteEvents, type EventbriteEventData } from "@/lib/api";

export default function RegistrationsSection() {
  const { data, isLoading, error } = useRegistrations();
  const { data: eventbriteEvents } = useQuery({
    queryKey: ["eventbriteEvents"],
    queryFn: getEventbriteEvents,
  });

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
    }
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatTimeForDisplay = (dateString: string | undefined | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatEventDateRange = (startDate: string | undefined | null, endDate: string | undefined | null) => {
    if (!startDate) return "Date TBD";
    
    // Convert dates to Date objects for comparison
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    
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

  const formatPrice = (isFree: boolean) => {
    return isFree ? "Free" : "Paid";
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <h4 className="font-semibold text-muted-foreground mb-3">
          My Registered Eventbrite Events
        </h4>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="border border-border rounded-lg p-4">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-1" />
              <Skeleton className="h-3 w-1/3 mb-1" />
              <Skeleton className="h-8 w-full mt-3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8">
        <h4 className="font-semibold text-muted-foreground mb-3">
          My Registered Eventbrite Events
        </h4>
        <Alert variant="destructive">
          <AlertTitle>Error Fetching Your Registered Events</AlertTitle>
          <AlertDescription>
            Could not load your registered events from Eventbrite. Please try again later.
            {error instanceof Error && (
              <p className="text-xs mt-1">Details: {error.message}</p>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="mb-8">
        <p className="text-muted-foreground text-sm text-center pt-0 py-4">
          You are not currently registered for any events on Eventbrite.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="space-y-4">
        {data.map((event: any) => {
          // Find matching event from Eventbrite API data by name
          const eventbriteEvent = eventbriteEvents?.events?.find(
            (e: EventbriteEventData) => e.name.toLowerCase() === event.properties.event_name.toLowerCase()
          );

          return (
            <div
              key={event.id}
              className="border border-border rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-medium text-foreground line-clamp-2">
                  {eventbriteEvent?.name || event.properties.event_name}
                </h3>
                <Badge className="bg-green-100 text-green-800 border-green-200 ml-2 flex-shrink-0">
                  Registered
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center">
                  <CalendarDays className="h-3 w-3 mr-2" />
                  {eventbriteEvent ? (
                    formatEventDateRange(eventbriteEvent.startDate, eventbriteEvent.endDate)
                  ) : (
                    formatEventDateRange(event.properties.event_start_date, event.properties.event_end_date)
                  )}
                </div>
                {eventbriteEvent && (
                  <div className="flex items-center">
                    {eventbriteEvent.location?.toLowerCase() === "online" ? (
                      <Globe className="h-3 w-3 mr-2" />
                    ) : (
                      <MapPin className="h-3 w-3 mr-2" />
                    )}
                    {eventbriteEvent.venueName && eventbriteEvent.location?.toLowerCase() !== "online"
                      ? `${eventbriteEvent.venueName} - ${eventbriteEvent.location}`
                      : eventbriteEvent.location || "Location TBD"}
                  </div>
                )}
              </div>
              {event.properties.event_url && (
                <Button
                  size="sm"
                  className="mt-3 w-full text-xs font-medium bg-accent hover:bg-accent/90 text-accent-foreground transition-colors"
                  onClick={() => window.open(event.properties.event_url, "_blank")}
                >
                  View on Eventbrite <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}