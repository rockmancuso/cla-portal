import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Loader2,
  ServerCrash,
  RefreshCw,
  Check,
  Info,
  User as UserIcon,
  Building2,
  BarChart3,
  Users,
  Tag,
  Shield,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getHubSpotDashboardData,
  updateAutoRenewalRequest,
  cancelSubscription,
  getContactSubscriptions,
  getMockSubscriptions,
  type HubSpotDashboardData,
  type HubSpotSubscriptionData,
} from "@/lib/api";
import type { User, Membership } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { displayValue, displayValueWithFallback, parseHubSpotCheckbox } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import React from 'react';

// Feature flag: hide renewal and auto-renewal UI when enabled (Vite replaces this at build time)
const HIDE_RENEWAL_UI = import.meta.env.VITE_HIDE_RENEWAL_UI === 'true';

interface MembershipSectionProps {
  user: User;
  membership?: Membership & { daysUntilExpiry?: number; renewalNeeded?: boolean };
  onEditProfile: () => void;
  isActiveMember: boolean;
}

export default function MembershipSection({ user, membership: initialMembership, onEditProfile, isActiveMember }: MembershipSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localAutoRenewalRequest, setLocalAutoRenewalRequest] = useState(false);
  const [showPreferencesDialog, setShowPreferencesDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: hubSpotData, isLoading: isLoadingHubSpot, error: hubSpotError } = useQuery<HubSpotDashboardData, Error>({
    queryKey: ['hubspotDashboardData', user.id], // Include user.id in queryKey if data is user-specific
    queryFn: getHubSpotDashboardData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isCurrentlyOnAutoRenewal = parseHubSpotCheckbox(hubSpotData?.contact?.on_auto_renewal);
  const hasRequestedAutoRenewal =
    parseHubSpotCheckbox(hubSpotData?.contact?.auto_renewal_request) || localAutoRenewalRequest;
  const hasStoredPaymentInfo = parseHubSpotCheckbox(hubSpotData?.contact?.has_stored_payment_info);

  // Auto-renewal mutation
  const autoRenewalMutation = useMutation({
    mutationFn: () => updateAutoRenewalRequest(user.hubspotContactId || '', true),
    onSuccess: () => {
      setLocalAutoRenewalRequest(true); // Update local state immediately
      queryClient.invalidateQueries({ queryKey: ['hubspotDashboardData', user.id] });
      toast({
        title: "Request received",
        description: hasStoredPaymentInfo
          ? "Thank you for your request. Auto-renewal will be enabled for your next renewal."
          : "Thank you for your interest. Auto-renewal will be enabled after you make your next payment.",
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

  // Subscription query — falls back to mock data in local dev (no contactId)
  const { data: subscriptions, isLoading: isLoadingSubscriptions } = useQuery<HubSpotSubscriptionData[]>({
    queryKey: ['hubspotSubscriptions', user.hubspotContactId],
    queryFn: () =>
      user.hubspotContactId
        ? getContactSubscriptions(user.hubspotContactId)
        : Promise.resolve(getMockSubscriptions()),
    staleTime: 5 * 60 * 1000,
  });

  const activeSubscription = subscriptions?.find(
    (s) => s.status === 'active' || s.status === 'past_due'
  ) ?? null;

  // Cancel/disable auto-renewal mutation
  const cancelMutation = useMutation({
    mutationFn: () => cancelSubscription(activeSubscription!.id),
    onSuccess: () => {
      setShowPreferencesDialog(false);
      queryClient.invalidateQueries({ queryKey: ['hubspotSubscriptions', user.hubspotContactId] });
      queryClient.invalidateQueries({ queryKey: ['hubspotDashboardData', user.id] });
      toast({
        title: "Auto-renewal disabled",
        description: "Your membership will not renew after the current term ends.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Could not update your auto-renewal preference. Please try again or contact support.",
        variant: "destructive",
      });
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
    if (parseHubSpotCheckbox(autoRenewalRequestValue)) {
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
    const safeDate = createSafeDate(dateString);
    if (!safeDate) return '';
    try {
      return safeDate.toLocaleDateString('en-US', options || { month: 'long', day: 'numeric', year: 'numeric' });
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
  
  // Non-member early return — show benefits showcase instead of member content
  if (!isActiveMember) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-semibold text-secondary">
            <CreditCard className="h-5 w-5 text-primary mr-3" />
            CLA Membership
            <Badge className="ml-3 bg-slate-100 text-slate-600 border-slate-200">
              Non-Member
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          {/* Join CTA Alert */}
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              <div className="font-medium mb-1">You are not currently a CLA member</div>
              <p className="text-sm mb-3">
                Join CLA to access exclusive industry resources, networking
                events, discounts, and more.
              </p>
              <Button asChild size="sm" className="btn-accent">
                <a href="https://laundryassociation.org/membership/join/" target="_blank" rel="noopener noreferrer">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Join CLA Today
                </a>
              </Button>
            </AlertDescription>
          </Alert>

          {/* Benefits Grid */}
          <h3 className="font-semibold text-secondary text-lg mb-4">Membership Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-100 p-2 text-blue-600 flex-shrink-0">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-secondary text-sm">Industry Insights</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Access the State of the Industry Survey, white papers, Full Cycle magazine, and
                    professional training resources.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-emerald-100 p-2 text-emerald-600 flex-shrink-0">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-secondary text-sm">Networking</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Connect at CLA Connect LIVE, national events, and the Women's Laundry Network
                    for peer-to-peer learning.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-amber-100 p-2 text-amber-600 flex-shrink-0">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-secondary text-sm">Exclusive Discounts</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Save with CLAdvantage Rewards, insurance programs, marketing resources, and
                    member-only pricing.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-indigo-100 p-2 text-indigo-600 flex-shrink-0">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-secondary text-sm">Industry Advocacy</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    CLA advocates for the laundry industry at the federal and state level to protect
                    and advance your business.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Highlight */}
          <div className="rounded-lg border-l-4 border-emerald-500 bg-emerald-50 p-4 mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-emerald-800">
                  CLA members report <span className="text-emerald-600">$200K more per year</span> in revenue on average
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">Based on CLA member survey data</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button asChild className="btn-accent">
              <a href="https://laundryassociation.org/membership/join/" target="_blank" rel="noopener noreferrer">
                <Sparkles className="h-4 w-4 mr-2" />
                Join CLA Today
              </a>
            </Button>
            <Button onClick={onEditProfile} className="btn-primary">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button variant="outline" asChild>
              <a href="https://laundryassociation.org/membership/benefits/" target="_blank" rel="noopener noreferrer">
                <Gift className="h-4 w-4 mr-2" />
                View All Benefits
                <ArrowRight className="h-4 w-4 ml-1" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper function to safely create and validate dates
  const createSafeDate = (dateString?: string | null): Date | null => {
    if (!dateString || dateString === 'null' || dateString === 'undefined' || dateString === '') {
      return null;
    }
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  // Calculate renewalNeeded and daysUntilExpiry from HubSpot membership_paid_through__c
  const paidThroughDate = createSafeDate(hubSpotData?.contact?.membership_paid_through__c);
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const calculatedDaysUntilExpiry = paidThroughDate ? Math.ceil((paidThroughDate.getTime() - now.getTime()) / msPerDay) : null;
  const renewalNeeded = calculatedDaysUntilExpiry !== null && calculatedDaysUntilExpiry <= 30;
  const daysUntilExpiry = calculatedDaysUntilExpiry;

  // Debug logging with safe date handling
  console.log('Membership Debug:', {
    hubSpotData,
    paidThroughDate: paidThroughDate ? paidThroughDate.toISOString() : 'Invalid or null date',
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
        {/* Renewal Notice - only show amber alert when expiring and no auto-renewal set up */}
        {!HIDE_RENEWAL_UI && renewalNeeded && !isCurrentlyOnAutoRenewal && !hasRequestedAutoRenewal && (
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

        {/* Auto-Renewal Confirmation Message — active subscription or legacy flag, expiring soon */}
        {!HIDE_RENEWAL_UI && renewalNeeded && isCurrentlyOnAutoRenewal && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              <div className="font-medium mb-1">Auto-Renewal Active</div>
              <p className="text-sm">
                Your membership expires in {daysUntilExpiry} days, but don't worry —
                your membership will automatically renew.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Auto-Renewal & Subscription Section */}
        {!HIDE_RENEWAL_UI && (
          <div className="mb-6 space-y-4">
            {/* --- Active subscription panel --- */}
            {isLoadingSubscriptions ? (
              <Skeleton className="h-24 w-full rounded-lg" />
            ) : isCurrentlyOnAutoRenewal ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <RefreshCw className="h-5 w-5 mt-0.5 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                      <h4 className="font-semibold text-secondary">
                        {activeSubscription?.name ?? 'Membership Subscription'}
                      </h4>
                      <Badge
                        className={
                          activeSubscription?.status === 'active'
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : 'bg-amber-100 text-amber-700 border-amber-300'
                        }
                      >
                        {activeSubscription?.status === 'active' ? 'Active' : activeSubscription?.status === 'past_due' ? 'Past Due' : 'Active'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      {activeSubscription?.nextPaymentDate && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Next Billing Date</p>
                          <p className="font-medium text-secondary">
                            {formatDate(activeSubscription.nextPaymentDate)}
                          </p>
                        </div>
                      )}
                      {activeSubscription?.lastPaymentAmount != null && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Amount</p>
                          <p className="font-medium text-secondary">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: activeSubscription.currencyCode ?? 'USD',
                            }).format(activeSubscription.lastPaymentAmount)}
                          </p>
                        </div>
                      )}
                      {activeSubscription?.billingFrequency && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Frequency</p>
                          <p className="font-medium text-secondary capitalize">
                            {activeSubscription.billingFrequency}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                      <div className="flex items-center space-x-2 text-green-600">
                        <Check className="h-4 w-4" />
                        <span className="text-sm font-medium">Auto-renewal enabled</span>
                      </div>
                      <button
                        onClick={() => setShowPreferencesDialog(true)}
                        disabled={!activeSubscription}
                        className="text-xs text-muted-foreground/60 hover:text-muted-foreground underline underline-offset-2 decoration-dotted transition-colors"
                      >
                        Manage preferences
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* --- No active subscription panel --- */
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <RefreshCw className={`h-5 w-5 mt-0.5 ${hasRequestedAutoRenewal ? 'text-green-600' : 'text-muted-foreground'} flex-shrink-0`} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-secondary mb-1">Auto-Renewal</h4>
                    {hasRequestedAutoRenewal ? (
                      /* Request already submitted — awaiting payment method */
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {hasStoredPaymentInfo
                            ? "Thank you for your request. Auto-renewal will be enabled for your next renewal."
                            : "Thank you for your interest. Auto-renewal will be enabled after you make your next payment."}
                        </p>
                        <div className="flex items-center space-x-2 text-green-600">
                          <Check className="h-4 w-4" />
                          <span className="text-sm font-medium">Request received</span>
                        </div>
                      </div>
                    ) : hasStoredPaymentInfo ? (
                      /* Has a payment method — full enable flow */
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Enable auto-renewal to keep your CLA membership active without interruption.
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
                              Request Auto-Renewal
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      /* No payment method on file */
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Enable auto-renewal to keep your CLA membership active without interruption.
                        </p>
                        <div className="flex items-start space-x-2 text-muted-foreground bg-background rounded p-3 border border-border">
                          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <p className="text-xs">
                            Auto-renewal requires stored payment information. It can be enabled
                            after you complete your next membership payment.
                          </p>
                        </div>
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
                              Request Auto-Renewal
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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

      {/* Auto-Renewal Preferences dialog */}
      <AlertDialog open={showPreferencesDialog} onOpenChange={setShowPreferencesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Auto-Renewal Preferences</AlertDialogTitle>
            <AlertDialogDescription>
              Your membership is currently set to auto-renew on{' '}
              <strong>{formatDate(activeSubscription?.nextPaymentDate)}</strong>.
              If you disable auto-renewal, your membership will remain active through{' '}
              <strong>{formatDate(hubSpotData?.contact?.membership_paid_through__c)}</strong>{' '}
              but will not renew after that date.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Auto-Renewal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disabling...
                </>
              ) : (
                'Disable Auto-Renewal'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
