import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, DollarSign, Globe } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function EventsSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: eventsData } = useQuery({
    queryKey: ["/api/events"],
  });

  const { data: registrationsData } = useQuery({
    queryKey: ["/api/events/registered"],
  });

  const registerMutation = useMutation({
    mutationFn: (eventId: number) => 
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

  const events = eventsData?.events || [];
  const registrations = registrationsData?.registrations || [];

  const handleRegister = (eventId: number) => {
    registerMutation.mutate(eventId);
  };

  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isRegistered = (eventId: number) => {
    return registrations.some(reg => reg.eventId === eventId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold text-secondary">
          <CalendarDays className="h-5 w-5 text-primary mr-3" />
          My Events
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Registered Events */}
        {registrations.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-muted-foreground mb-3">
              Your Registered Events
            </h4>
            <div className="space-y-4">
              {registrations.map((registration) => (
                <div
                  key={registration.id}
                  className="border border-border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-medium text-foreground line-clamp-2">
                      {registration.event.title}
                    </h3>
                    <Badge className="bg-green-100 text-green-800 border-green-200 ml-2 flex-shrink-0">
                      Registered
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center">
                      <CalendarDays className="h-3 w-3 mr-2" />
                      {formatDate(registration.event.startDate.toString())}
                      {registration.event.endDate && 
                        ` - ${formatDate(registration.event.endDate.toString())}`
                      }
                    </div>
                    <div className="flex items-center">
                      {registration.event.isVirtual ? (
                        <Globe className="h-3 w-3 mr-2" />
                      ) : (
                        <MapPin className="h-3 w-3 mr-2" />
                      )}
                      {registration.event.location}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Ticket #{registration.ticketNumber}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                  >
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        <div>
          <h4 className="font-semibold text-muted-foreground mb-3">
            Upcoming CLA Events
          </h4>
          <div className="space-y-4">
            {events.length > 0 ? (
              events.map((event) => (
                <div
                  key={event.id}
                  className="border border-border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-medium text-foreground line-clamp-2">
                      {event.title}
                    </h3>
                    <Badge 
                      className={`ml-2 flex-shrink-0 ${
                        isRegistered(event.id)
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-blue-100 text-blue-800 border-blue-200"
                      }`}
                    >
                      {isRegistered(event.id) ? "Registered" : "Available"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center">
                      <CalendarDays className="h-3 w-3 mr-2" />
                      {formatDate(event.startDate.toString())}
                    </div>
                    <div className="flex items-center">
                      {event.isVirtual ? (
                        <Globe className="h-3 w-3 mr-2" />
                      ) : (
                        <MapPin className="h-3 w-3 mr-2" />
                      )}
                      {event.location}
                    </div>
                    {event.price && (
                      <div className="flex items-center">
                        <DollarSign className="h-3 w-3 mr-2" />
                        {formatPrice(event.price)} (Member Price)
                      </div>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  <Button
                    className={`mt-3 w-full text-xs font-medium transition-colors ${
                      isRegistered(event.id)
                        ? "bg-muted text-muted-foreground cursor-default"
                        : "btn-accent"
                    }`}
                    onClick={() => !isRegistered(event.id) && handleRegister(event.id)}
                    disabled={isRegistered(event.id) || registerMutation.isPending}
                  >
                    {isRegistered(event.id) 
                      ? "Already Registered" 
                      : registerMutation.isPending 
                        ? "Registering..." 
                        : "Register Now"
                    }
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No upcoming events available
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <Button className="w-full btn-primary">
            View All Events
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
