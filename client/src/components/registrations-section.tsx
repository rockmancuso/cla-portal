import { useRegistrations } from "../hooks/use-registrations";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { CalendarDays, MapPin, Globe, ExternalLink } from "lucide-react";
import type { RegistrationRecord } from "@/lib/api";
import { decodeHTMLEntities } from "@/lib/utils";

const EVENTS_CALENDAR_URL = "https://laundryassociation.org/events/";

/** Map event_status to a display badge */
function RegistrationStatusBadge({ status }: { status: string | undefined }) {
  switch (status?.toLowerCase()) {
    case "checked_in":
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 ml-2 flex-shrink-0">
          Attended
        </Badge>
      );
    case "cancelled":
      return (
        <Badge className="bg-gray-100 text-gray-600 border-gray-200 ml-2 flex-shrink-0">
          Cancelled
        </Badge>
      );
    case "refunded":
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 ml-2 flex-shrink-0">
          Refunded
        </Badge>
      );
    case "registered":
    default:
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 ml-2 flex-shrink-0">
          Registered
        </Badge>
      );
  }
}

export default function RegistrationsSection() {
  const { data, isLoading, error } = useRegistrations();

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

  /** Determine the best URL to link to for a registration */
  const getEventUrl = (reg: RegistrationRecord): string => {
    // Prefer WordPress URL (canonical), fall back to Eventbrite URL, then calendar
    return reg.properties.wordpress_event_url || reg.properties.event_url || EVENTS_CALENDAR_URL;
  };

  /** Check if this is a cancelled/refunded registration (for visual styling) */
  const isInactiveRegistration = (status: string | undefined): boolean => {
    const s = status?.toLowerCase();
    return s === "cancelled" || s === "refunded";
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <h4 className="font-semibold text-muted-foreground mb-3">
          My Registered Events
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
          My Registered Events
        </h4>
        <Alert variant="destructive">
          <AlertTitle>Error Fetching Your Registered Events</AlertTitle>
          <AlertDescription>
            Could not load your registered events. Please try again later.
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
          You are not currently registered for any events.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="space-y-4">
        {(data as RegistrationRecord[]).map((reg) => {
          const props = reg.properties;
          const inactive = isInactiveRegistration(props.event_status);

          return (
            <div
              key={reg.id}
              className={`border border-border rounded-lg p-4 ${inactive ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between">
                <h3 className={`text-sm font-medium line-clamp-2 ${inactive ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {decodeHTMLEntities(props.event_name)}
                </h3>
                <RegistrationStatusBadge status={props.event_status} />
              </div>
              <div className="text-xs text-muted-foreground space-y-1 mt-1">
                <div className="flex items-center">
                  <CalendarDays className="h-3 w-3 mr-2" />
                  {formatEventDateRange(props.event_start_date, props.event_end_date)}
                </div>
                {(props.venue_name || props.event_location) && (
                  <div className="flex items-center">
                    {props.event_location?.toLowerCase().includes("online") ? (
                      <Globe className="h-3 w-3 mr-2" />
                    ) : (
                      <MapPin className="h-3 w-3 mr-2" />
                    )}
                    {decodeHTMLEntities(
                      props.venue_name
                        ? props.event_location && !props.event_location.toLowerCase().includes("online")
                          ? `${props.venue_name} — ${props.event_location}`
                          : props.venue_name
                        : props.event_location || "Location TBD"
                    )}
                  </div>
                )}
                {props.eb_ticket_type && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span className="mr-2">Ticket:</span>
                    {props.eb_ticket_type}
                  </div>
                )}
              </div>

              {!inactive && (
                <Button
                  size="sm"
                  className="mt-3 w-full text-xs font-medium bg-accent hover:bg-accent/90 text-accent-foreground transition-colors"
                  onClick={() => window.open(getEventUrl(reg), "_blank")}
                >
                  View Event Details <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
