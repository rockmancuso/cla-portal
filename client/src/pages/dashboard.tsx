import { useQuery } from "@tanstack/react-query";
import NavigationMenu from "@/components/navigation-menu";
import MembershipSection from "@/components/membership-section";
import EventsSection from "@/components/events-section";
import QuickActions from "@/components/quick-actions";
import ProfileEditModal from "@/components/profile-edit-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  CheckCircle,
  Users,
  ArrowRight,
  ExternalLink,
  Clock3,
  UserRoundPen,
  CalendarClock,
  Star,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  getHubSpotDashboardData,
  type HubSpotDashboardData,
  getUserProfile,
  getMembership,
  getActivities,
} from "@/lib/api";
import { displayValue, isMember } from "@/lib/utils";
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

  const { data: legacyMembershipData } = useQuery<Awaited<ReturnType<typeof getMembership>>>({
    queryKey: ["legacyMembership"],
    queryFn: getMembership,
    enabled: isAuthenticated, // Only fetch membership if authenticated
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: activitiesData } = useQuery<Awaited<ReturnType<typeof getActivities>>>({
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

  const getSafeDate = (dateString?: string | null): Date | null => {
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
      return null;
    }
    const parsedDate = new Date(dateString);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  const paidThroughDate = getSafeDate(hubSpotData?.contact?.membership_paid_through__c);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilRenewal = paidThroughDate
    ? Math.ceil((paidThroughDate.getTime() - Date.now()) / msPerDay)
    : null;

  const isActiveMember = isMember(hubSpotData?.contact?.member_status);
  const memberStatus = displayValue(hubSpotData?.contact?.member_status) || "Unknown";
  const isMembershipHealthy = daysUntilRenewal === null || daysUntilRenewal > 30;
  const priorityActionLabel = isLoadingHubSpotDashboard
    ? "Reviewing account status..."
    : isMembershipHealthy
      ? "Membership is in good standing"
      : `Membership expires in ${daysUntilRenewal} days`;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navigation Menu */}
      <NavigationMenu />

      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.25),transparent_35%)]" />
        <div className="relative max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                <Clock3 className="h-3.5 w-3.5" />
                {isActiveMember ? "Manage Your Membership" : "CLA Member Portal"}
              </div>
              <div>
                <h1 className="text-3xl font-bold cla-heading text-white md:text-4xl">
                  Welcome{isActiveMember ? " back" : ""}, {user?.firstName || "Member"}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-blue-100 cla-body md:text-base">
                  {isActiveMember
                    ? "Manage your CLA membership, events, and profile details in one place."
                    : "Explore the benefits of CLA membership and discover how we can help grow your business."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 self-start md:self-auto">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <span className="text-sm font-semibold text-white cla-heading">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </span>
              </div>
              <Button
                variant="secondary"
                className="bg-white/15 text-white hover:bg-white/25"
                onClick={() => setIsProfileModalOpen(true)}
              >
                <UserRoundPen className="h-4 w-4 mr-2" />
                Update Profile
              </Button>
              <a
                href="https://pages.laundryassociation.org/_hcms/logout?redirect_url=https://www.laundryassociation.org"
                target="_self"
                className="cursor-pointer rounded-md border border-white/30 bg-white/10 p-2 transition-colors hover:bg-white/20"
                title="Sign out"
              >
                <ExternalLink className="h-5 w-5 text-blue-100" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isActiveMember ? (
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Membership Status</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{isLoadingHubSpotDashboard ? "Loading..." : memberStatus}</p>
                  </div>
                  <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Paid Through</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {isLoadingHubSpotDashboard ? "Loading..." : formatDate(hubSpotData?.contact?.membership_paid_through__c)}
                    </p>
                  </div>
                  <div className="rounded-full bg-blue-100 p-2 text-blue-700">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Current Term Start</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {isLoadingHubSpotDashboard ? "Loading..." : formatDate(hubSpotData?.contact?.current_term_start_date__c)}
                    </p>
                  </div>
                  <div className="rounded-full bg-indigo-100 p-2 text-indigo-700">
                    <CalendarClock className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Member Since</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {isLoadingHubSpotDashboard ? "Loading..." : formatDate(hubSpotData?.contact?.activated_date__c, { month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="rounded-full bg-amber-100 p-2 text-amber-700">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="mb-8">
            <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                  <div className="flex-1 p-6 lg:p-8">
                    <Badge className="mb-3 bg-emerald-50 text-emerald-700 border-emerald-200">
                      <Star className="h-3 w-3 mr-1" />
                      Become a Member
                    </Badge>
                    <h2 className="text-2xl font-bold text-slate-900 cla-heading mb-2">
                      Unlock the Full Power of CLA Membership
                    </h2>
                    <p className="text-slate-600 cla-body mb-4 max-w-xl">
                      Join CLA and gain access to industry insights, exclusive discounts, networking events, and resources that help members earn more.
                    </p>
                    <div className="flex items-center gap-2 mb-5 text-sm text-emerald-700 font-medium">
                      <TrendingUp className="h-4 w-4" />
                      <span>Members report <strong>$200K+ more</strong> in annual revenue on average</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button asChild className="btn-accent">
                        <a href="https://laundryassociation.org/membership/join/" target="_blank" rel="noopener noreferrer">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Join CLA Today
                        </a>
                      </Button>
                      <Button variant="outline" asChild>
                        <a href="https://laundryassociation.org/membership/benefits/" target="_blank" rel="noopener noreferrer">
                          Explore Benefits
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </a>
                      </Button>
                    </div>
                  </div>
                  <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50 px-8 py-6 min-w-[260px]">
                    <div className="text-center">
                      <p className="text-5xl font-bold text-emerald-600 cla-heading">$200K+</p>
                      <p className="text-sm text-slate-600 mt-1 font-medium">more annual revenue</p>
                      <p className="text-xs text-slate-500 mt-0.5">reported by CLA members</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mb-8">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="text-xl text-slate-900">{isActiveMember ? "Member Actions" : "Get Started"}</span>
                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                  Recommended
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isActiveMember ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{priorityActionLabel}</p>
                      <p className="text-xs text-slate-600">Keep your benefits uninterrupted.</p>
                    </div>
                    <Button asChild className="btn-primary">
                      <a href="#membership-section">
                        Review Membership
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Profile freshness check</p>
                      <p className="text-xs text-slate-600">Make sure your company and contact details are current.</p>
                    </div>
                    <Button className="btn-primary" onClick={() => setIsProfileModalOpen(true)}>
                      Update Profile
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Event readiness</p>
                      <p className="text-xs text-slate-600">View your registrations and discover upcoming programs.</p>
                    </div>
                    <Button asChild className="btn-primary">
                      <a href="#events-section">
                        Open Events
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Join CLA</p>
                      <p className="text-xs text-slate-600">Access exclusive industry resources, discounts, and networking opportunities.</p>
                    </div>
                    <Button asChild className="btn-accent">
                      <a href="https://laundryassociation.org/membership/join/" target="_blank" rel="noopener noreferrer">
                        Join CLA
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Update your profile</p>
                      <p className="text-xs text-slate-600">Make sure your contact and company details are current.</p>
                    </div>
                    <Button className="btn-primary" onClick={() => setIsProfileModalOpen(true)}>
                      Update Profile
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Explore membership benefits</p>
                      <p className="text-xs text-slate-600">See what CLA members get access to, from industry data to exclusive discounts.</p>
                    </div>
                    <Button variant="outline" asChild>
                      <a href="https://laundryassociation.org/membership/benefits/" target="_blank" rel="noopener noreferrer">
                        View Benefits
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          {/* Recent Activity — hidden until real activity data is available
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-slate-900">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.slice(0, 3).map((activity, index) => (
                    <div key={activity.id || index} className="rounded-lg border border-slate-200 p-3">
                      <p className="text-sm text-slate-800">{activity.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">No recent activity yet.</p>
              )}
            </CardContent>
          </Card>
          */}
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div id="membership-section" className="lg:col-span-2 scroll-mt-20">
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <MembershipSection
                user={user}
                membership={legacyMembership}
                onEditProfile={() => setIsProfileModalOpen(true)}
                isActiveMember={isActiveMember}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div id="events-section" className="scroll-mt-20 rounded-lg border border-slate-200 bg-white shadow-sm">
              <EventsSection />
            </div>
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <QuickActions />
            </div>
            {!isActiveMember && (
              <Card className="border-emerald-200 bg-white shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-emerald-600" />
                    <h3 className="font-semibold text-slate-900 text-sm">Ready to join?</h3>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">
                    Become a CLA member and unlock exclusive benefits for your business.
                  </p>
                  <Button asChild className="btn-accent w-full" size="sm">
                    <a href="https://laundryassociation.org/membership/join/" target="_blank" rel="noopener noreferrer">
                      Join CLA
                      <ArrowRight className="h-3.5 w-3.5 ml-2" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
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
