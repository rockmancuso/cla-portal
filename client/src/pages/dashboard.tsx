import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import MembershipSection from "@/components/membership-section";
import EventsSection from "@/components/events-section";
import QuickActions from "@/components/quick-actions";
import ProfileEditModal from "@/components/profile-edit-modal";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, CheckCircle, Users, Clock } from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const { data: profileData } = useQuery({
    queryKey: ["/api/user/profile"],
  });

  const { data: membershipData } = useQuery({
    queryKey: ["/api/membership"],
  });

  const { data: activitiesData } = useQuery({
    queryKey: ["/api/activities"],
  });

  const user = profileData?.user;
  const membership = membershipData?.membership;
  const activities = activitiesData?.activities || [];

  if (!user) {
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

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onEditProfile={() => setIsProfileModalOpen(true)} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Manage your membership, events, and profile from your personalized dashboard.
          </p>
        </div>

        {/* Quick Stats */}
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
                    {membership?.status || 'Active'}
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
                  <p className="text-sm font-medium text-muted-foreground">Valid Through</p>
                  <p className="text-lg font-semibold text-foreground">
                    {membership?.expiryDate ? 
                      new Date(membership.expiryDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      }) : 
                      'Dec 31, 2024'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <CalendarDays className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Upcoming Events</p>
                  <p className="text-lg font-semibold text-foreground">3</p>
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
                    {membership?.joinDate ? 
                      new Date(membership.joinDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      }) : 
                      'Jan 2020'
                    }
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
              membership={membership}
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
