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
  ServerCrash, // For error state
  RefreshCw, // For auto-renewal
  Check, // For success state
  User as UserIcon, // For Individual Membership Information
  Building2 // For Company Membership Information
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getHubSpotDashboardData, updateAutoRenewalRequest, type HubSpotDashboardData } from "@/lib/api";
import type { User, Membership } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton"; // For loading skeletons
import { displayValue, displayValueWithFallback } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Feature flag: hide renewal and auto-renewal UI when enabled (Vite replaces this at build time)
const HIDE_RENEWAL_UI = import.meta.env.VITE_HIDE_RENEWAL_UI === 'true';

interface MembershipSectionProps {
  user: User; // Keep user prop for now, might contain other relevant info
  // membership prop might be deprecated or used as fallback if HubSpot data fails
  membership?: Membership & { daysUntilExpiry?: number; renewalNeeded?: boolean };
  onEditProfile: () => void;
}

export default function MembershipSection({ user, membership: initialMembership, onEditProfile }: MembershipSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localAutoRenewalRequest, setLocalAutoRenewalRequest] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: hubSpotData, isLoading: isLoadingHubSpot, error: hubSpotError } = useQuery<HubSpotDashboardData, Error>({
    queryKey: ['hubspotDashboardData', user.id], // Include user.id in queryKey if data is user-specific
    queryFn: getHubSpotDashboardData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Helper function to check if auto-renewal is enabled (either property)
  const isAutoRenewalEnabled = () => {
    // Handle string "null" values from HubSpot personalization tokens
    const autoRenewingValue = hubSpotData?.contact?.auto_renewing_;
    const autoRenewalRequestValue = hubSpotData?.contact?.auto_renewal_request;
    
    // Convert to boolean, handling string "null", "true", "false", "Yes" and actual boolean values
    const autoRenewing = autoRenewingValue === true || autoRenewingValue === "true" || autoRenewingValue === "Yes";
    const autoRenewalRequest = autoRenewalRequestValue === true || autoRenewalRequestValue === "true";
    const localRequest = localAutoRenewalRequest;
    
    // Debug logging
    console.log('Auto-renewal debug:', {
      autoRenewing,
      autoRenewalRequest,
      localRequest,
      rawAutoRenewing: autoRenewingValue,
      rawAutoRenewalRequest: autoRenewalRequestValue,
      hubSpotData: hubSpotData?.contact
    });
    
    return autoRenewing || autoRenewalRequest || localRequest;
  };

  // Auto-renewal mutation
  const autoRenewalMutation = useMutation({
    mutationFn: () => updateAutoRenewalRequest(user.hubspotContactId || '', true),
    onSuccess: () => {
      setLocalAutoRenewalRequest(true); // Update local state immediately
      queryClient.invalidateQueries({ queryKey: ['hubspotDashboardData', user.id] });
      toast({
        title: "Auto-renewal enabled",
        description: "Thank you for updating your renewal settings. Your membership will now auto-renew.",
      });
    },
    onError: (error) => {
      toast({
        title: "Request failed",
        description: "Failed to submit auto-renewal request. Please try again or contact support.",
        variant: "destructive",
      });
      console.error('Auto-renewal request error:', error);
    },
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

  // Sync local auto-renewal state with HubSpot data
  React.useEffect(() => {
    const autoRenewalRequestValue = hubSpotData?.contact?.auto_renewal_request;
    if (autoRenewalRequestValue === true || autoRenewalRequestValue === "true") {
      setLocalAutoRenewalRequest(true);
    }
  }, [hubSpotData?.contact?.auto_renewal_request]);


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
        {!HIDE_RENEWAL_UI && renewalNeeded && !isAutoRenewalEnabled() && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              <div className="font-medium mb-1">Renewal Reminder</div>
              <p className="text-sm mb-3">
                Your membership expires in {daysUntilExpiry} days!
                Renew now to continue enjoying all member benefits.
              </p>
              <Button onClick={handleRenewal} className="btn-accent">
                Renew Membership
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Auto-Renewal Confirmation Message */}
        {!HIDE_RENEWAL_UI && renewalNeeded && isAutoRenewalEnabled() && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              <div className="font-medium mb-1">Auto-Renewal Active</div>
              <p className="text-sm">
                Your membership expires in {daysUntilExpiry} days, but don't worry! 
                Your auto-renewal is enabled and your membership will be automatically renewed.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Auto-Renewal Section */}
        {!HIDE_RENEWAL_UI && !(renewalNeeded && isAutoRenewalEnabled()) && (
          <div className="mb-6">
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <RefreshCw className={`h-5 w-5 mt-0.5 ${isAutoRenewalEnabled() ? 'text-green-600' : 'text-muted-foreground'}`} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-secondary mb-1">Auto-Renewal</h4>
                    {isAutoRenewalEnabled() ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Your membership will auto-renew, ensuring uninterrupted CLA benefits.
                        </p>
                        <div className="flex items-center space-x-2 text-green-600">
                          <Check className="h-4 w-4" />
                          <span className="text-sm font-medium">Auto-renewal enabled</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Enable auto-renewal to ensure you can enjoy your CLA membership benefits without interruption.
                        </p>
                        <Button
                          onClick={() => autoRenewalMutation.mutate()}
                          disabled={autoRenewalMutation.isPending}
                          className="btn-primary"
                          size="sm"
                        >
                          {autoRenewalMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Enable Auto-Renewal
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                <p className="text-sm text-muted-foreground">Membership Term Start Date</p>
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
                <p className="text-sm text-muted-foreground">Membership Paid Through</p>
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
        <div className="border-t border-border pt-6 pl-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-secondary text-lg">My Membership Details</h3>
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
              <div className="md:border-r">
                <h5 className="flex items-center gap-1 text-base md:text-sm font-bold mb-3 px-3 py-2 rounded border-l-4 border-cla-blue shadow-sm w-max">
                  <UserIcon className="h-4 w-4 text-cla-blue" />
                  <span className="text-cla-blue">Individual</span> Membership Information
                </h5>
                <div className="space-y-3 md:pr-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Member ID</label>
                    <p className="text-sm font-medium">
                      {initialMembership?.membershipId || user.id /* Fallback to user.id or similar */}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground"><span className="text-cla-blue font-bold">Individual</span> Membership Type</label>
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
              <div className="md:pl-4 md:ml-0">
                <h5 className="flex items-center gap-1 text-base md:text-sm font-bold mb-3 px-3 py-2 rounded border-l-4 border-cla-blue shadow-sm w-max">
                  <Building2 className="h-4 w-4 text-cla-blue" />
                  <span className="text-cla-blue">Company</span> Membership Information
                </h5>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Company Name</label>
                    <p className="text-sm font-medium">{displayValue(hubSpotData?.company?.name)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground"><span className="text-cla-blue font-bold">Company</span> Membership Type</label>
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
            {/* <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Member Card
            </Button> */}
            <Button
              variant="outline"
              asChild
            >
              <a
                href="https://laundryassociation.org/membership/benefits/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Gift className="h-4 w-4 mr-2" />
                View Benefits
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Need to import React for React.useEffect
import React from 'react';
