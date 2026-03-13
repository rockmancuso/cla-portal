import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Globe, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getUpcomingEvents, type WordPressEvent } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import RegistrationsSection from "@/components/registrations-section";

export default function EventsSection() {
  const SHOW_UPCOMING = true;

  // Fetch upcoming events from WordPress (The Events Calendar REST API)
  const {
    data: upcomingEvents,
    isLoading,
    error,
  } = useQuery<WordPressEvent[]>({
    queryKey: ["upcomingEvents"],
    queryFn: getUpcomingEvents,
    enabled: SHOW_UPCOMING,
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Filter to upcoming events within next 3 months, limit display to 5
  const filterUpcomingEvents = (events: WordPressEvent[]) => {
    const now = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(now.getMonth() + 3);

    return events.filter((event) => {
      if (!event.utcStartDate && !event.startDate) return false;
      const eventDate = new Date(event.utcStartDate || event.startDate);
      return eventDate >= now && eventDate <= threeMonthsFromNow;
    });
  };

  const filteredEvents = filterUpcomingEvents(upcomingEvents || []);
  const displayEvents = filteredEvents.slice(0, 5);

  const formatDateForDisplay = (dateString: string | undefined | null, includeTime = true) => {
    if (!dateString || dateString === "null" || dateString === "undefined") return "Date TBD";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Date TBD";

    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
      year: "numeric",
    };
    if (includeTime) {
      options.hour = "numeric";
      options.minute = "2-digit";
    }
    return date.toLocaleDateString("en-US", options);
  };

  const formatTimeForDisplay = (dateString: string | undefined | null) => {
    if (!dateString || dateString === "null" || dateString === "undefined") return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatEventDateRange = (startDate: string | undefined | null, endDate: string | undefined | null) => {
    if (!startDate || startDate === "null" || startDate === "undefined") return "Date TBD";

    const start = new Date(startDate);
    if (isNaN(start.getTime())) return "Date TBD";

    const end = endDate && endDate !== "null" && endDate !== "undefined" ? new Date(endDate) : null;
    if (end && isNaN(end.getTime())) return "Date TBD";

    const isSameDay =
      end &&
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();

    if (!end || isSameDay) {
      const dateStr = formatDateForDisplay(startDate, false);
      const startTime = formatTimeForDisplay(startDate);
      const endTime = formatTimeForDisplay(endDate);
      return endTime ? `${dateStr} at ${startTime} - ${endTime}` : `${dateStr} at ${startTime}`;
    }

    return `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}`;
  };

  const getVenueDisplay = (event: WordPressEvent) => {
    if (!event.venue) return "Location TBD";
    const { venue: name, city, state } = event.venue;
    if (city && state) return `${name} — ${city}, ${state}`;
    if (city) return `${name} — ${city}`;
    return name || "Location TBD";
  };

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
              Upcoming Events
            </h4>
            {isLoading && (
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
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error Fetching Events</AlertTitle>
                <AlertDescription>
                  Could not load upcoming events. Please try again later.
                  {error instanceof Error && (
                    <p className="text-xs mt-1">Details: {error.message}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}
            {!isLoading && !error && (
              <div className="space-y-4">
                {displayEvents.length > 0 ? (
                  <>
                    {filteredEvents.length > 5 && (
                      <div className="text-xs text-muted-foreground mb-4 p-3 bg-muted rounded-lg">
                        Showing {displayEvents.length} of {filteredEvents.length} upcoming events
                      </div>
                    )}
                    {displayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="border border-border rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-sm font-medium text-foreground line-clamp-2">
                            {event.title}
                          </h3>
                          {event.categories.length > 0 && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded ml-2 flex-shrink-0">
                              {event.categories[0]}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center">
                            <CalendarDays className="h-3 w-3 mr-2" />
                            {formatEventDateRange(event.utcStartDate || event.startDate, event.utcEndDate || event.endDate)}
                          </div>
                          <div className="flex items-center">
                            {event.venue?.address?.toLowerCase().includes("online") || !event.venue ? (
                              <Globe className="h-3 w-3 mr-2" />
                            ) : (
                              <MapPin className="h-3 w-3 mr-2" />
                            )}
                            {getVenueDisplay(event)}
                          </div>
                        </div>

                        {event.url && (
                          <Button
                            size="sm"
                            className="mt-3 w-full text-xs font-medium bg-accent hover:bg-accent/90 text-accent-foreground transition-colors"
                            onClick={() => window.open(event.url, "_blank")}
                          >
                            View Event Details <ExternalLink className="h-3 w-3 ml-2" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No upcoming events found in the next 3 months.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-border">
          <Button
            className="w-full btn-primary"
            onClick={() => window.open("https://laundryassociation.org/events/", "_blank")}
          >
            View All Events
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
