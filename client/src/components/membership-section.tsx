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
  CheckCircle
} from "lucide-react";
import { useState } from "react";
import type { User, Membership } from "@shared/schema";

interface MembershipSectionProps {
  user: User;
  membership?: Membership & { daysUntilExpiry?: number; renewalNeeded?: boolean };
  onEditProfile: () => void;
}

export default function MembershipSection({ user, membership, onEditProfile }: MembershipSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    companyName: user.companyName || '',
    companySector: user.companySector || '',
    locationCount: user.locationCount || 0,
    phone: user.phone || '',
  });

  const handleSave = () => {
    // TODO: Implement save functionality
    setIsEditing(false);
  };

  const handleRenewal = () => {
    // TODO: Implement renewal process
    console.log("Starting renewal process...");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold text-secondary">
          <CreditCard className="h-5 w-5 text-primary mr-3" />
          My Membership
          <Badge className="ml-3 bg-green-50 text-green-700 border-green-200">
            {membership?.status || 'Active'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Renewal Notice */}
        {membership?.renewalNeeded && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              <div className="font-medium mb-1">Renewal Reminder</div>
              <p className="text-sm mb-3">
                Your membership expires in {membership.daysUntilExpiry} days. 
                Renew now to continue enjoying all member benefits.
              </p>
              <Button onClick={handleRenewal} className="btn-accent">
                Renew Membership
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Membership Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Membership Type</p>
                <p className="font-semibold text-secondary">
                  {membership?.type || 'Professional Plus'}
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
                  {membership?.joinDate ? 
                    new Date(membership.joinDate).toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    }) : 
                    'March 2019'
                  }
                </p>
              </div>
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Period</p>
                <p className="font-semibold text-secondary">
                  Jan 2024 - Dec 2024
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
                  {membership?.expiryDate ? 
                    new Date(membership.expiryDate).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    }) : 
                    'December 31, 2024'
                  }
                </p>
              </div>
              <CheckCircle className="h-5 w-5 text-accent" />
            </div>
          </div>
        </div>

        {/* Company Information Section */}
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
                <Label className="text-sm font-medium text-muted-foreground mb-2">
                  Company Name
                </Label>
                <Input 
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2">
                  Phone Number
                </Label>
                <Input 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2">
                  Industry Sector
                </Label>
                <Input 
                  value={formData.companySector}
                  onChange={(e) => setFormData({...formData, companySector: e.target.value})}
                  className="focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-2">
                  Number of Locations
                </Label>
                <Input 
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
                  Member Information
                </h5>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Member ID</label>
                    <p className="text-sm font-medium">
                      {membership?.membershipId || 'CLA-2020-0847'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Membership Type</label>
                    <p className="text-sm font-medium">
                      {membership?.type || 'Professional'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Join Date</label>
                    <p className="text-sm font-medium">
                      {membership?.joinDate ? 
                        new Date(membership.joinDate).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        }) : 
                        'January 15, 2020'
                      }
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-muted-foreground mb-3">
                  Company Information
                </h5>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Company Name</label>
                    <p className="text-sm font-medium">{user.companyName}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Industry Sector</label>
                    <p className="text-sm font-medium">{user.companySector}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Locations</label>
                    <p className="text-sm font-medium">{user.locationCount} Locations</p>
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
