import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  AlertTriangle,
  Edit,
  Download,
  Gift,
  Crown,
  Calendar,
  Clock,
  CheckCircle,
  Loader2, // For loading state
  ServerCrash // For error state
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getHubSpotDashboardData, type HubSpotDashboardData } from "@/lib/api";
import type { User, Membership } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton"; // For loading skeletons
import { displayValue, displayValueWithFallback } from "@/lib/utils";

interface MembershipSectionProps {
  user: User; // Keep user prop for now, might contain other relevant info
  // membership prop might be deprecated or used as fallback if HubSpot data fails
  membership?: Membership & { daysUntilExpiry?: number; renewalNeeded?: boolean };
  onEditProfile: () => void;
}

export default function MembershipSection({ user, membership: initialMembership, onEditProfile }: MembershipSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: hubSpotData, isLoading: isLoadingHubSpot, error: hubSpotError } = useQuery<HubSpotDashboardData, Error>({
    queryKey: ['hubspotDashboardData', user.id], // Include user.id in queryKey if data is user-specific
    queryFn: getHubSpotDashboardData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // TODO: The existing formData for company info editing might need to be updated
  // if companyName is now coming from HubSpot. For now, it uses user.companyName.
  // This part of the component (editing company info) is outside the scope of HubSpot data display.
  const [formData, setFormData] = useState({
    companyName: hubSpotData?.company?.name || user.companyName || '',
    companySector: user.companySector || '', // This might also come from HubSpot if needed
    locationCount: user.locationCount || 0, // This might also come from HubSpot if needed
    phone: user.phone || '', // This might also come from HubSpot if needed
  });
  
  // Update formData when hubSpotData is available
  // Corrected: Was useState, should be useEffect. And added react-hooks/exhaustive-deps comment.
  React.useEffect(() => {
    if (hubSpotData?.company?.name) {
      setFormData(prev => ({ ...prev, companyName: hubSpotData.company!.name! }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hubSpotData?.company?.name]);


  const handleSave = () => {
    // TODO: Implement save functionality - this is outside HubSpot scope for now
    setIsEditing(false);
  };

  const handleRenewal = () => {
    // TODO: Implement renewal process - this is outside HubSpot scope for now
    console.log("Starting renewal process...");
  };

  const formatDate = (dateString?: string | null, options?: Intl.DateTimeFormatOptions) => {
    if (!dateString || dateString === 'null' || dateString === 'undefined') return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', options || { month: 'long', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return '';
    }
  };
  
  if (isLoadingHubSpot) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-semibold text-secondary">
            <CreditCard className="h-5 w-5 text-primary mr-3" />
            My Membership
            <Loader2 className="h-5 w-5 animate-spin ml-3" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="h-8 w-1/3 mt-6" />
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hubSpotError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-semibold text-destructive">
            <ServerCrash className="h-5 w-5 text-destructive mr-3" />
            Error Loading Membership
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Could not load your membership details from HubSpot. Please try again later.
              {hubSpotError.message && <p className="text-xs mt-1">Details: {hubSpotError.message}</p>}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate renewalNeeded and daysUntilExpiry from HubSpot membership_paid_through__c
  const paidThroughDate = hubSpotData?.contact?.membership_paid_through__c
    ? new Date(hubSpotData.contact.membership_paid_through__c)
    : null;
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const calculatedDaysUntilExpiry = paidThroughDate ? Math.ceil((paidThroughDate.getTime() - now.getTime()) / msPerDay) : null;
  const renewalNeeded = calculatedDaysUntilExpiry !== null && calculatedDaysUntilExpiry <= 30;
  const daysUntilExpiry = calculatedDaysUntilExpiry;

  // Debug logging
  console.log('Membership Debug:', {
    hubSpotData,
    paidThroughDate: paidThroughDate?.toISOString(),
    now: now.toISOString(),
    calculatedDaysUntilExpiry,
    renewalNeeded,
    memberStatus: hubSpotData?.contact?.member_status
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold text-secondary">
          <CreditCard className="h-5 w-5 text-primary mr-3" />
          My Membership
          <Badge className="ml-3 bg-green-50 text-green-700 border-green-200">
            {displayValue(hubSpotData?.contact?.member_status) || displayValue(initialMembership?.status)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-2">
        {/* Renewal Notice - using HubSpot membership_paid_through__c date */}
        {renewalNeeded && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              <div className="font-medium mb-1">Renewal Reminder</div>
              <p className="text-sm mb-3">
                Your membership expires in {daysUntilExpiry} days.
                Renew now to continue enjoying all member benefits.
              </p>
              <Button onClick={handleRenewal} className="btn-accent">
                Renew Membership
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Membership Status Cards - Using HubSpot Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Membership Type</p>
                <p className="font-semibold text-secondary">
                  {displayValue(hubSpotData?.contact?.membership_type)}
                </p>
              </div>
              <Crown className="h-5 w-5 text-accent" />
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-semibold text-secondary">
                  {formatDate(hubSpotData?.contact?.activated_date__c, { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Term Start Date</p>
                <p className="font-semibold text-secondary">
                  {formatDate(hubSpotData?.contact?.current_term_start_date__c)}
                </p>
              </div>
              <Clock className="h-5 w-5 text-primary" />
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid Through</p>
                <p className="font-semibold text-secondary">
                  {formatDate(hubSpotData?.contact?.membership_paid_through__c)}
                </p>
              </div>
              <CheckCircle className="h-5 w-5 text-accent" />
            </div>
          </div>
        </div>

        {/* Company Information Section - Using HubSpot Data for display */}
        {/* The editing part of company info is kept as is, using formData state */}
        <div className="border-t border-border pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-secondary">Company Information</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="h-4 w-4 mr-1" />
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
          
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName" className="text-sm font-medium text-muted-foreground mb-2">
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-muted-foreground mb-2">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <Label htmlFor="companySector" className="text-sm font-medium text-muted-foreground mb-2">
                  Industry Sector
                </Label>
                <Input
                  id="companySector"
                  value={formData.companySector}
                  onChange={(e) => setFormData({...formData, companySector: e.target.value})}
                  className="focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <Label htmlFor="locationCount" className="text-sm font-medium text-muted-foreground mb-2">
                  Number of Locations
                </Label>
                <Input
                  id="locationCount"
                  type="number"
                  value={formData.locationCount}
                  onChange={(e) => setFormData({...formData, locationCount: parseInt(e.target.value)})}
                  className="focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2 flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="btn-primary">
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-3">
                  Member Information (from HubSpot)
                </h5>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Member ID (from profile)</label>
                    <p className="text-sm font-medium">
                      {initialMembership?.membershipId || user.id /* Fallback to user.id or similar */}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Membership Type (Contact)</label>
                    <p className="text-sm font-medium">
                      {displayValue(hubSpotData?.contact?.membership_type)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Member Since (Activated Date)</label>
                    <p className="text-sm font-medium">
                      {formatDate(hubSpotData?.contact?.activated_date__c)}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-3">
                  Company Information (from HubSpot)
                </h5>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Company Name</label>
                    <p className="text-sm font-medium">{displayValue(hubSpotData?.company?.name)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Company Membership Type</label>
                    <p className="text-sm font-medium">{displayValue(hubSpotData?.company?.membership_type)}</p>
                  </div>
                  {/* These fields are not in the current HubSpot fetch, using user prop as fallback */}
                  <div>
                    <label className="text-xs text-muted-foreground">Industry Sector (from profile)</label>
                    <p className="text-sm font-medium">{displayValue(user.companySector)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Locations (from profile)</label>
                    <p className="text-sm font-medium">{user.locationCount ? `${user.locationCount} Locations` : ''}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex flex-wrap gap-3">
            <Button onClick={onEditProfile} className="btn-primary">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Member Card
            </Button>
            <Button variant="outline">
              <Gift className="h-4 w-4 mr-2" />
              View Benefits
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Need to import React for React.useEffect
import React from 'react';
