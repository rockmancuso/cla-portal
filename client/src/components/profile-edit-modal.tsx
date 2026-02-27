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
import { updateUserProfile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";
import { User as UserIcon, UserRound, Phone, MapPin, Building2, Save, X } from "lucide-react";

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
            <DialogContent className="sm:max-w-3xl p-0 gap-0 bg-slate-50 shadow-2xl border-slate-200 overflow-hidden">
                <DialogHeader className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-20">
                    <div>
                        <DialogTitle className="text-2xl font-bold cla-heading text-slate-900 flex items-center gap-2">
                            <div className="bg-blue-100 p-2 rounded-full">
                                <UserRound className="h-5 w-5 text-blue-700" />
                            </div>
                            Update Profile
                        </DialogTitle>
                        <p className="text-sm text-slate-500 mt-2 cla-body">
                            Modify your personal information, contact details, and location.
                        </p>
                    </div>
                </DialogHeader>

                <div className="max-h-[calc(100vh-10rem)] overflow-y-auto w-full">
                    <form onSubmit={handleSubmit} className="p-6 space-y-8 pb-32">

                        {/* Personal Information */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group hover:border-blue-200 transition-colors">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/80"></div>
                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                                <UserIcon className="h-4 w-4 text-secondary" />
                                Personal Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-sm font-semibold text-slate-700">First Name</Label>
                                    <Input
                                        id="firstName"
                                        value={formData.firstName}
                                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                                        className="focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50 hover:bg-white transition-colors !rounded-md !border-slate-200 shadow-sm"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="text-sm font-semibold text-slate-700">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        value={formData.lastName}
                                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                                        className="focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50 hover:bg-white transition-colors !rounded-md !border-slate-200 shadow-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mt-6 space-y-2">
                                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className="focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50 hover:bg-white transition-colors !rounded-md !border-slate-200 shadow-sm"
                                    required
                                />
                            </div>
                        </div>

                        {/* Business & Contact */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group hover:border-indigo-200 transition-colors">
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/80"></div>
                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                                <Building2 className="h-4 w-4 text-indigo-600" />
                                Business & Contact
                            </h3>

                            <div className="space-y-2 mb-6">
                                <Label htmlFor="totalLaundries" className="text-sm font-semibold text-slate-700">Total # of Laundries</Label>
                                <Input
                                    id="totalLaundries"
                                    type="number"
                                    min="0"
                                    value={formData.totalLaundries}
                                    onChange={(e) => handleInputChange('totalLaundries', parseInt(e.target.value) || 0)}
                                    className="focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50 hover:bg-white transition-colors !rounded-md !border-slate-200 shadow-sm max-w-xs"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="workPhone" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <Phone className="h-3 w-3 text-slate-400" />
                                        Work Phone Number
                                    </Label>
                                    <Input
                                        id="workPhone"
                                        type="tel"
                                        value={formData.workPhone}
                                        onChange={(e) => handleInputChange('workPhone', e.target.value)}
                                        className="focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50 hover:bg-white transition-colors !rounded-md !border-slate-200 shadow-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mobilePhone" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <Phone className="h-3 w-3 text-slate-400" />
                                        Mobile Phone Number
                                    </Label>
                                    <Input
                                        id="mobilePhone"
                                        type="tel"
                                        value={formData.mobilePhone}
                                        onChange={(e) => handleInputChange('mobilePhone', e.target.value)}
                                        className="focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50 hover:bg-white transition-colors !rounded-md !border-slate-200 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex items-start space-x-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <Checkbox
                                    id="smsConsent"
                                    checked={formData.smsConsent}
                                    onCheckedChange={(checked) => handleInputChange('smsConsent', checked)}
                                    className="mt-1 bg-white"
                                />
                                <Label htmlFor="smsConsent" className="text-sm font-medium text-slate-600 leading-relaxed cursor-pointer">
                                    <strong className="text-slate-800 block mb-1">I Consent to SMS Communications</strong>
                                    Join our SMS list for exclusive updates and reminders. Opt-in by checking this box. Message and data rates may apply.
                                </Label>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group hover:border-teal-200 transition-colors">
                            <div className="absolute top-0 left-0 w-1 h-full bg-teal-500/80"></div>
                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                                <MapPin className="h-4 w-4 text-teal-600" />
                                Location
                            </h3>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="address" className="text-sm font-semibold text-slate-700">Street Address</Label>
                                    <Input
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => handleInputChange('address', e.target.value)}
                                        className="focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50 hover:bg-white transition-colors !rounded-md !border-slate-200 shadow-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="addressLine2" className="text-sm font-semibold text-slate-700">Address Line 2 (Optional)</Label>
                                    <Input
                                        id="addressLine2"
                                        value={formData.addressLine2}
                                        onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                                        className="focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50 hover:bg-white transition-colors !rounded-md !border-slate-200 shadow-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="city" className="text-sm font-semibold text-slate-700">City</Label>
                                        <Input
                                            id="city"
                                            value={formData.city}
                                            onChange={(e) => handleInputChange('city', e.target.value)}
                                            className="focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50 hover:bg-white transition-colors !rounded-md !border-slate-200 shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="country" className="text-sm font-semibold text-slate-700">Country</Label>
                                        <Select
                                            value={formData.country}
                                            onValueChange={(value) => handleInputChange('country', value)}
                                        >
                                            <SelectTrigger className="focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50 hover:bg-white transition-colors !rounded-md !border-slate-200 shadow-sm">
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {showStateField && (
                                        <div className="space-y-2">
                                            <Label htmlFor="state" className="text-sm font-semibold text-slate-700">State</Label>
                                            <Select
                                                value={formData.state}
                                                onValueChange={(value) => handleInputChange('state', value)}
                                            >
                                                <SelectTrigger className="focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50 hover:bg-white transition-colors !rounded-md !border-slate-200 shadow-sm">
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
                                        <div className="space-y-2">
                                            <Label htmlFor="province" className="text-sm font-semibold text-slate-700">Province</Label>
                                            <Select
                                                value={formData.province}
                                                onValueChange={(value) => handleInputChange('province', value)}
                                            >
                                                <SelectTrigger className="focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50 hover:bg-white transition-colors !rounded-md !border-slate-200 shadow-sm">
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
                                        <div className="space-y-2">
                                            <Label htmlFor="countryText" className="text-sm font-semibold text-slate-700">Country</Label>
                                            <Input
                                                id="countryText"
                                                value={formData.country}
                                                onChange={(e) => handleInputChange('country', e.target.value)}
                                                className="focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50 hover:bg-white transition-colors !rounded-md !border-slate-200 shadow-sm"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="postalCode" className="text-sm font-semibold text-slate-700">Postal Code</Label>
                                        <Input
                                            id="postalCode"
                                            value={formData.postalCode}
                                            onChange={(e) => handleInputChange('postalCode', e.target.value)}
                                            className="focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50 hover:bg-white transition-colors !rounded-md !border-slate-200 shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Action Bar */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] z-10">
                            <div className="max-w-2xl mx-auto flex items-center justify-between">
                                <p className="text-xs text-slate-500 hidden sm:block">
                                    Your information is kept secure and private.
                                </p>
                                <div className="flex space-x-3 w-full sm:w-auto mt-2 sm:mt-0">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={onClose}
                                        disabled={updateMutation.isPending}
                                        className="flex-1 sm:flex-none h-11"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="btn-primary flex-1 sm:flex-none h-11 px-6 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                                        disabled={updateMutation.isPending}
                                    >
                                        {updateMutation.isPending ? "Saving..." : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
