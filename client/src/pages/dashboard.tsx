import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import NavigationMenu from "@/components/navigation-menu";
import MembershipSection from "@/components/membership-section";
import EventsSection from "@/components/events-section";
import QuickActions from "@/components/quick-actions";
import ProfileEditModal from "@/components/profile-edit-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CheckCircle, Users, Clock, Award, Bell, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { getHubSpotDashboardData, type HubSpotDashboardData, getUserProfile, getMembership, getActivities } from "@/lib/api";
import { displayValue, displayValueWithFallback } from "@/lib/utils";
import { useAuth } from '@/hooks/use-auth';

export default function Dashboard() {
  const { user: authUser, isLoading: isLoadingAuth, isAuthenticated } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // All queries must be declared at the top level, regardless of auth state
  const { data: profileData, isLoading: isLoadingProfile } = useQuery<Awaited<ReturnType<typeof getUserProfile>>>({
    queryKey: ["userProfile"],
    queryFn: getUserProfile,
    enabled: isAuthenticated, // Only fetch profile if authenticated
  });

  const { data: legacyMembershipData, isLoading: isLoadingLegacyMembership } = useQuery<Awaited<ReturnType<typeof getMembership>>>({
    queryKey: ["legacyMembership"],
    queryFn: getMembership,
    enabled: isAuthenticated, // Only fetch membership if authenticated
  });

  const { data: activitiesData, isLoading: isLoadingActivities } = useQuery<Awaited<ReturnType<typeof getActivities>>>({
    queryKey: ["activities"],
    queryFn: getActivities,
    enabled: isAuthenticated, // Only fetch activities if authenticated
  });

  const user = profileData?.user || authUser; // Fallback to authUser if profile data isn't loaded yet

  const { data: hubSpotData, isLoading: isLoadingHubSpotDashboard } = useQuery<HubSpotDashboardData, Error>({
    queryKey: ['hubspotDashboardData', user?.id],
    queryFn: getHubSpotDashboardData,
    enabled: !!user?.id && isAuthenticated, // Only fetch HubSpot data if we have a user ID and are authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Redirect if not authenticated (except in development)
  useEffect(() => {
    // Only redirect after auth check is complete and we're not authenticated
    if (!isLoadingAuth && !isAuthenticated) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      if (!isDevelopment) {
        const returnUrl = encodeURIComponent(window.location.href);
        window.location.href = `https://member.laundryassociation.org/_hcms/mem/login?redirect_url=${returnUrl}`;
      }
    }
  }, [isLoadingAuth, isAuthenticated]);

  // Show loading state while checking auth
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-200 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl cla-heading">CLA</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2 cla-heading">Loading CLA Member Portal...</h2>
          <p className="text-gray-600 cla-body">Please wait while we load your personalized experience.</p>
          <div className="mt-4">
            <div className="inline-block w-6 h-6 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show nothing if not authenticated (except in development)
  if (!isAuthenticated && process.env.NODE_ENV !== 'development') {
    return null;
  }

  const legacyMembership = legacyMembershipData?.membership ? {
    ...legacyMembershipData.membership,
    daysUntilExpiry: legacyMembershipData.membership.daysUntilExpiry === null ? undefined : legacyMembershipData.membership.daysUntilExpiry,
  } : undefined;
  const activities = activitiesData?.activities || [];
  
  if (isLoadingProfile || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-200 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl cla-heading">CLA</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2 cla-heading">Loading CLA Member Portal...</h2>
          <p className="text-gray-600 cla-body">Please wait while we load your personalized experience.</p>
          <div className="mt-4">
            <div className="inline-block w-6 h-6 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }
  
  const formatDate = (dateString?: string | null, options?: Intl.DateTimeFormatOptions) => {
    if (!dateString || dateString === 'null' || dateString === 'undefined') return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', options || { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Navigation Menu */}
      <NavigationMenu />
      
      {/* Enhanced Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl cla-heading">CLA</span>
              </div>
              <div>
                <h1 className="uppercase text-3xl font-bold cla-heading text-white">Member Portal</h1>
                <p className="text-blue-100 text-sm cla-body">Connect. Learn. Advocate.</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm cla-heading">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </span>
              </div>
              <a
                href="https://pages.laundryassociation.org/_hcms/logout?redirect_url=https://www.laundryassociation.org"
                target="_self"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                title="Sign out"
              >
                <ExternalLink className="w-5 h-5 text-blue-200" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 cla-heading">
            Welcome back, {user?.firstName || 'Guest'}!
          </h2>
          <p className="text-gray-600 text-lg cla-body">
            Manage your CLA membership, profile, and events from your personalized dashboard.
          </p>
        </div>

        {/* Enhanced Quick Stats with Gradients */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="pl-1">
                  <p className="text-sm font-medium text-green-700 cla-body">Membership Status</p>
                  <p className="text-xl font-bold text-green-800 cla-heading">
                    {isLoadingHubSpotDashboard ? 'Loading...' : displayValue(hubSpotData?.contact?.member_status)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-white" />
                </div>
                <div className="pl-1">
                  <p className="text-sm font-medium text-blue-700 cla-body">Paid Through</p>
                  <p className="text-xl font-bold text-blue-800 cla-heading">
                    {isLoadingHubSpotDashboard ? 'Loading...' : formatDate(hubSpotData?.contact?.membership_paid_through__c)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-white" />
                </div>
                <div className="pl-1">
                  <p className="text-sm font-medium text-purple-700 cla-body">Current Term Start</p>
                  <p className="text-xl font-bold text-purple-800 cla-heading">
                    {isLoadingHubSpotDashboard ? 'Loading...' : formatDate(hubSpotData?.contact?.current_term_start_date__c)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="pl-1">
                  <p className="text-sm font-medium text-orange-700 cla-body">Member Since</p>
                  <p className="text-xl font-bold text-orange-800 cla-heading">
                    {isLoadingHubSpotDashboard ? 'Loading...' : formatDate(hubSpotData?.contact?.activated_date__c, { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid with Enhanced Styling */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Membership (Enhanced Container) */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-lg">
              <MembershipSection
                user={user}
                membership={legacyMembership}
                onEditProfile={() => setIsProfileModalOpen(true)}
              />
            </div>
          </div>

          {/* Right Column - Events & Quick Actions with Enhanced Styling */}
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-lg">
              <EventsSection />
            </div>
            <div className="bg-white/80 backdrop-blur-sm border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-lg">
              <QuickActions />
            </div>
          </div>
        </div>

        {/* Enhanced Recent Activity */}
        {/* <div className="mt-8">
          <Card className="bg-white/80 backdrop-blur-sm border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-gray-600 to-slate-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span className="cla-heading">Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {activities.length > 0 ? (
                  activities.map((activity, index) => (
                    <div key={activity.id || index} className="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-b-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 cla-body">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 cla-body">
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
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 cla-body">No recent activity to display</p>
                    <p className="text-sm text-gray-400 mt-1 cla-body">Your activities will appear here as you use the portal</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div> */}
      </main>

      <ProfileEditModal 
        user={user}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}