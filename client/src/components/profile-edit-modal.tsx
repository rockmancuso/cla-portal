import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
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
    email: user.email,
    phone: user.phone || '',
    companyName: user.companyName || '',
    companySector: user.companySector || '',
    locationCount: user.locationCount || 0,
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => 
      apiRequest("PATCH", "/api/user/profile", data),
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
    updateMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Edit Profile
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
                className="focus:ring-2 focus:ring-primary focus:border-transparent"
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
                className="focus:ring-2 focus:ring-primary focus:border-transparent"
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
              className="focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm font-medium text-muted-foreground mb-2">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <Label htmlFor="companyName" className="text-sm font-medium text-muted-foreground mb-2">
              Company Name
            </Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              className="focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="companySector" className="text-sm font-medium text-muted-foreground mb-2">
                Industry Sector
              </Label>
              <Select 
                value={formData.companySector} 
                onValueChange={(value) => handleInputChange('companySector', value)}
              >
                <SelectTrigger className="focus:ring-2 focus:ring-primary focus:border-transparent">
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Commercial Laundry">Commercial Laundry</SelectItem>
                  <SelectItem value="Coin Laundry">Coin Laundry</SelectItem>
                  <SelectItem value="Dry Cleaning">Dry Cleaning</SelectItem>
                  <SelectItem value="Equipment Supplier">Equipment Supplier</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="locationCount" className="text-sm font-medium text-muted-foreground mb-2">
                Number of Locations
              </Label>
              <Input
                id="locationCount"
                type="number"
                min="0"
                value={formData.locationCount}
                onChange={(e) => handleInputChange('locationCount', parseInt(e.target.value) || 0)}
                className="focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
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
