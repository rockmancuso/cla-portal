import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import MembershipSection from "@/components/membership-section";
import EventsSection from "@/components/events-section";
import QuickActions from "@/components/quick-actions";
import ProfileEditModal from "@/components/profile-edit-modal";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, CheckCircle, Users, Clock } from "lucide-react";
import { useState } from "react";
import { getHubSpotDashboardData, type HubSpotDashboardData, getUserProfile, getMembership, getActivities } from "@/lib/api"; // Import HubSpot fetch function and type

export default function Dashboard() {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const { data: profileData, isLoading: isLoadingProfile } = useQuery<Awaited<ReturnType<typeof getUserProfile>>>({ // Add type for user
    queryKey: ["userProfile"], // Keep a descriptive queryKey
    queryFn: getUserProfile,
  });

  // Keep existing membership fetch for potential renewal logic or other non-HubSpot data
  const { data: legacyMembershipData, isLoading: isLoadingLegacyMembership } = useQuery<Awaited<ReturnType<typeof getMembership>>>({
    queryKey: ["legacyMembership"], // Keep a descriptive queryKey
    queryFn: getMembership,
  });

  const { data: activitiesData, isLoading: isLoadingActivities } = useQuery<Awaited<ReturnType<typeof getActivities>>>({
    queryKey: ["activities"], // Keep a descriptive queryKey
    queryFn: getActivities,
  });
  
  const user = profileData?.user;

  // Fetch HubSpot data for Quick Stats
  const { data: hubSpotData, isLoading: isLoadingHubSpotDashboard } = useQuery<HubSpotDashboardData, Error>({
    queryKey: ['hubspotDashboardData', user?.id], // Query key includes user.id
    queryFn: getHubSpotDashboardData,
    enabled: !!user?.id, // Only run query if user.id is available
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const legacyMembership = legacyMembershipData?.membership ? {
    ...legacyMembershipData.membership,
    daysUntilExpiry: legacyMembershipData.membership.daysUntilExpiry === null ? undefined : legacyMembershipData.membership.daysUntilExpiry,
  } : undefined; // This is passed to MembershipSection for renewal notice
  const activities = activitiesData?.activities || [];
 
 
  if (isLoadingProfile || !user) { // Check for user existence here after isLoadingProfile
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="cla-logo mx-auto mb-4">
            <span className="cla-logo-text">CLA</span>
          </div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  const formatDate = (dateString?: string | null, options?: Intl.DateTimeFormatOptions) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', options || { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onEditProfile={() => setIsProfileModalOpen(true)} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.firstName || 'Guest'}!
          </h1>
          <p className="text-muted-foreground">
            Manage your membership, events, and profile from your personalized dashboard.
          </p>
        </div>

        {/* Quick Stats - Updated with HubSpot Data */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Membership Status</p>
                  <p className="text-lg font-semibold text-green-600">
                    {isLoadingHubSpotDashboard ? 'Loading...' : hubSpotData?.contact?.member_status || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <CalendarDays className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Paid Through</p>
                  <p className="text-lg font-semibold text-foreground">
                    {isLoadingHubSpotDashboard ? 'Loading...' : formatDate(hubSpotData?.contact?.membership_paid_through__c)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  {/* Using Current Term Start Date from HubSpot for one of the date fields */}
                  <CalendarDays className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Term Start</p>
                  <p className="text-lg font-semibold text-foreground">
                     {isLoadingHubSpotDashboard ? 'Loading...' : formatDate(hubSpotData?.contact?.current_term_start_date__c)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                  <p className="text-lg font-semibold text-foreground">
                    {isLoadingHubSpotDashboard ? 'Loading...' : formatDate(hubSpotData?.contact?.activated_date__c, { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Membership */}
          <div className="lg:col-span-2">
            <MembershipSection
              user={user}
              membership={legacyMembership} // Pass legacyMembership as initialMembership for renewal notice
              onEditProfile={() => setIsProfileModalOpen(true)}
            />
          </div>

          {/* Right Column - Events & Quick Actions */}
          <div className="space-y-6">
            <EventsSection />
            <QuickActions />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <Card>
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground flex items-center">
                <Clock className="h-5 w-5 text-primary mr-3" />
                Recent Activity
              </h2>
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                {activities.length > 0 ? (
                  activities.map((activity, index) => (
                    <div key={activity.id || index} className="flex items-start space-x-3 py-3 border-b border-border last:border-b-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.createdAt ? 
                            new Date(activity.createdAt).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            }) :
                            'Recently'
                          }
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No recent activity to display
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <ProfileEditModal 
        user={user}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
