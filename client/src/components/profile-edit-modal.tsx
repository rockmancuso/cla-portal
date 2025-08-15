import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, updateUserProfile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface ProfileEditModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileEditModal({ user, isOpen, onClose }: ProfileEditModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email || '',
    individualType: user.individualType || '',
    contactType: user.contactType || '',
    totalLaundries: user.totalLaundries || 0,
    workPhone: user.phone || '',
    mobilePhone: user.mobilePhone || '',
    smsConsent: user.smsConsent || false,
    address: user.address || '',
    addressLine2: user.addressLine2 || '',
    city: user.city || '',
    country: user.country || 'United States',
    state: user.state || '',
    province: user.province || '',
    postalCode: user.postalCode || '',
  });

  const updateMutation = useMutation({
    mutationFn: () => updateUserProfile(user.hubspotContactId, {
      firstname: formData.firstName,
      lastname: formData.lastName,
      email: formData.email,
      individual_type__c: formData.individualType,
      contact_type: formData.contactType,
      total_of_laundries__c: formData.totalLaundries.toString(),
      phone: formData.workPhone,
      mobilephone: formData.mobilePhone,
      sms_consent: formData.smsConsent,
      address: formData.address,
      shipping_address_line_2: formData.addressLine2,
      city: formData.city,
      user_country: formData.country,
      user_state: formData.state,
      zip: formData.postalCode,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const showStateField = formData.country === 'United States';
  const showProvinceField = formData.country === 'Canada';
  const showCountryField = !['United States', 'Canada'].includes(formData.country);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground relative after:content-[''] after:block after:w-full after:h-0.5 after:bg-gray-300 tracking-medium after:mt-2 uppercase">
            Edit My Profile
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="firstName" className="text-sm font-medium text-muted-foreground mb-2">
                First Name
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm font-medium text-muted-foreground mb-2">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium text-muted-foreground mb-2">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="individualType" className="text-sm font-medium text-muted-foreground mb-2">
                Individual Type
              </Label>
              <Select 
                value={formData.individualType} 
                onValueChange={(value) => handleInputChange('individualType', value)}
              >
                <SelectTrigger className="focus:ring-2 focus:ring-primary focus:border-transparent bg-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Store Owner">Store Owner</SelectItem>
                  <SelectItem value="Potential Investor">Potential Investor</SelectItem>
                  <SelectItem value="Store Employee">Store Employee</SelectItem>
                  <SelectItem value="Distributor">Distributor</SelectItem>
                  <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                  <SelectItem value="Service Provider">Service Provider</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="contactType" className="text-sm font-medium text-muted-foreground mb-2">
                Contact Type
              </Label>
              <Select 
                value={formData.contactType} 
                onValueChange={(value) => handleInputChange('contactType', value)}
              >
                <SelectTrigger className="focus:ring-2 focus:ring-primary focus:border-transparent bg-white">
                  <SelectValue placeholder="Select contact type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Primary Contact">Primary Contact</SelectItem>
                  <SelectItem value="Billing Contact">Billing Contact</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="totalLaundries" className="text-sm font-medium text-muted-foreground mb-2">
              Total # of Laundries
            </Label>
            <Input
              id="totalLaundries"
              type="number"
              min="0"
              value={formData.totalLaundries}
              onChange={(e) => handleInputChange('totalLaundries', parseInt(e.target.value) || 0)}
              className="focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="workPhone" className="text-sm font-medium text-muted-foreground mb-2">
                Work Phone Number
              </Label>
              <Input
                id="workPhone"
                type="tel"
                value={formData.workPhone}
                onChange={(e) => handleInputChange('workPhone', e.target.value)}
                className="focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              />
            </div>
            <div>
              <Label htmlFor="mobilePhone" className="text-sm font-medium text-muted-foreground mb-2">
                Mobile Phone Number
              </Label>
              <Input
                id="mobilePhone"
                type="tel"
                value={formData.mobilePhone}
                onChange={(e) => handleInputChange('mobilePhone', e.target.value)}
                className="focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="smsConsent"
              checked={formData.smsConsent}
              onCheckedChange={(checked) => handleInputChange('smsConsent', checked)}
              className="bg-white"
            />
            <Label htmlFor="smsConsent" className="text-sm font-medium text-muted-foreground">
              I Consent to SMS Communications. Join our SMS list for exclusive updates and reminders. Opt-in by checking this box. Message and data rates may apply.
            </Label>
          </div>

          <div>
            <Label htmlFor="address" className="text-sm font-medium text-muted-foreground mb-2">
              Street Address
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            />
          </div>

          <div>
            <Label htmlFor="addressLine2" className="text-sm font-medium text-muted-foreground mb-2">
              Address Line 2
            </Label>
            <Input
              id="addressLine2"
              value={formData.addressLine2}
              onChange={(e) => handleInputChange('addressLine2', e.target.value)}
              className="focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="city" className="text-sm font-medium text-muted-foreground mb-2">
                City
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              />
            </div>
            <div>
              <Label htmlFor="country" className="text-sm font-medium text-muted-foreground mb-2">
                Country
              </Label>
              <Select 
                value={formData.country} 
                onValueChange={(value) => handleInputChange('country', value)}
              >
                <SelectTrigger className="focus:ring-2 focus:ring-primary focus:border-transparent bg-white">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="United States">United States</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {showStateField && (
            <div>
              <Label htmlFor="state" className="text-sm font-medium text-muted-foreground mb-2">
                State
              </Label>
              <Select 
                value={formData.state} 
                onValueChange={(value) => handleInputChange('state', value)}
              >
                <SelectTrigger className="focus:ring-2 focus:ring-primary focus:border-transparent bg-white">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alabama">Alabama</SelectItem>
                  <SelectItem value="Alaska">Alaska</SelectItem>
                  <SelectItem value="Arizona">Arizona</SelectItem>
                  <SelectItem value="Arkansas">Arkansas</SelectItem>
                  <SelectItem value="California">California</SelectItem>
                  <SelectItem value="Colorado">Colorado</SelectItem>
                  <SelectItem value="Connecticut">Connecticut</SelectItem>
                  <SelectItem value="Delaware">Delaware</SelectItem>
                  <SelectItem value="Florida">Florida</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Hawaii">Hawaii</SelectItem>
                  <SelectItem value="Idaho">Idaho</SelectItem>
                  <SelectItem value="Illinois">Illinois</SelectItem>
                  <SelectItem value="Indiana">Indiana</SelectItem>
                  <SelectItem value="Iowa">Iowa</SelectItem>
                  <SelectItem value="Kansas">Kansas</SelectItem>
                  <SelectItem value="Kentucky">Kentucky</SelectItem>
                  <SelectItem value="Louisiana">Louisiana</SelectItem>
                  <SelectItem value="Maine">Maine</SelectItem>
                  <SelectItem value="Maryland">Maryland</SelectItem>
                  <SelectItem value="Massachusetts">Massachusetts</SelectItem>
                  <SelectItem value="Michigan">Michigan</SelectItem>
                  <SelectItem value="Minnesota">Minnesota</SelectItem>
                  <SelectItem value="Mississippi">Mississippi</SelectItem>
                  <SelectItem value="Missouri">Missouri</SelectItem>
                  <SelectItem value="Montana">Montana</SelectItem>
                  <SelectItem value="Nebraska">Nebraska</SelectItem>
                  <SelectItem value="Nevada">Nevada</SelectItem>
                  <SelectItem value="New Hampshire">New Hampshire</SelectItem>
                  <SelectItem value="New Jersey">New Jersey</SelectItem>
                  <SelectItem value="New Mexico">New Mexico</SelectItem>
                  <SelectItem value="New York">New York</SelectItem>
                  <SelectItem value="North Carolina">North Carolina</SelectItem>
                  <SelectItem value="North Dakota">North Dakota</SelectItem>
                  <SelectItem value="Ohio">Ohio</SelectItem>
                  <SelectItem value="Oklahoma">Oklahoma</SelectItem>
                  <SelectItem value="Oregon">Oregon</SelectItem>
                  <SelectItem value="Pennsylvania">Pennsylvania</SelectItem>
                  <SelectItem value="Rhode Island">Rhode Island</SelectItem>
                  <SelectItem value="South Carolina">South Carolina</SelectItem>
                  <SelectItem value="South Dakota">South Dakota</SelectItem>
                  <SelectItem value="Tennessee">Tennessee</SelectItem>
                  <SelectItem value="Texas">Texas</SelectItem>
                  <SelectItem value="Utah">Utah</SelectItem>
                  <SelectItem value="Vermont">Vermont</SelectItem>
                  <SelectItem value="Virginia">Virginia</SelectItem>
                  <SelectItem value="Washington">Washington</SelectItem>
                  <SelectItem value="West Virginia">West Virginia</SelectItem>
                  <SelectItem value="Wisconsin">Wisconsin</SelectItem>
                  <SelectItem value="Wyoming">Wyoming</SelectItem>
                  <SelectItem value="District of Columbia">District of Columbia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {showProvinceField && (
            <div>
              <Label htmlFor="province" className="text-sm font-medium text-muted-foreground mb-2">
                Province
              </Label>
              <Select 
                value={formData.province} 
                onValueChange={(value) => handleInputChange('province', value)}
              >
                <SelectTrigger className="focus:ring-2 focus:ring-primary focus:border-transparent bg-white">
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alberta">Alberta</SelectItem>
                  <SelectItem value="British Columbia">British Columbia</SelectItem>
                  <SelectItem value="Manitoba">Manitoba</SelectItem>
                  <SelectItem value="New Brunswick">New Brunswick</SelectItem>
                  <SelectItem value="Newfoundland and Labrador">Newfoundland and Labrador</SelectItem>
                  <SelectItem value="Northwest Territories">Northwest Territories</SelectItem>
                  <SelectItem value="Nova Scotia">Nova Scotia</SelectItem>
                  <SelectItem value="Nunavut">Nunavut</SelectItem>
                  <SelectItem value="Ontario">Ontario</SelectItem>
                  <SelectItem value="Prince Edward Island">Prince Edward Island</SelectItem>
                  <SelectItem value="Quebec">Quebec</SelectItem>
                  <SelectItem value="Saskatchewan">Saskatchewan</SelectItem>
                  <SelectItem value="Yukon">Yukon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {showCountryField && (
            <div>
              <Label htmlFor="country" className="text-sm font-medium text-muted-foreground mb-2">qccc                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
                Country
              </Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              />
            </div>
          )}

          <div>
            <Label htmlFor="postalCode" className="text-sm font-medium text-muted-foreground mb-2">
              Postal Code
            </Label>
            <Input
              id="postalCode"
              value={formData.postalCode}
              onChange={(e) => handleInputChange('postalCode', e.target.value)}
              className="focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={onClose}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="btn-primary"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
