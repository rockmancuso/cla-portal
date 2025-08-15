# CLA Membership System - Data Properties Overview (from CLA Member Portal React SPA)

This document provides a comprehensive overview of all membership and user-profile related properties found in the CLA Portal codebase. This information is designed to help agents building new applications for CLA employees to rapidly process new memberships and collect user details.


## User Properties

### Core User Properties (Local Database)

**Table: `users`**
```typescript
{
  id: number;                    // Primary key, auto-increment
  email: string;                 // Required, unique
  firstName: string;             // Required
  lastName: string;              // Required
  phone: string | null;          // Optional phone number
  hubspotContactId: string | null; // Links to HubSpot contact
  hubspotUserId: string | null;    // HubSpot user ID
  hubspotAccessToken: string | null; // HubSpot OAuth token
  hubspotRefreshToken: string | null; // HubSpot refresh token
  companyName: string | null;    // Associated company name
  companySector: string | null;  // Industry sector (e.g., "Laundry Services")
  locationCount: number | null;  // Number of business locations
  createdAt: Date;               // Account creation timestamp
}
```

### Extended User Properties (HubSpot Integration)

**Additional properties used in profile management but not in local schema:**

```typescript
{
  // Individual/Business Classification
  individualType: string;        // "Store Owner", "Potential Investor", "Store Employee", "Distributor", "Manufacturer", "Service Provider", "Other"
  contactType: string;           // "Primary Contact", "Billing Contact", "Both"
  totalLaundries: number;        // Total number of laundries owned/operated
  
  // Contact Information
  mobilePhone: string;           // Mobile phone number (separate from work phone)
  smsConsent: boolean;           // SMS communication consent
  
  // Address Information
  address: string;               // Street address
  addressLine2: string;          // Address line 2 (apartment, suite, etc.)
  city: string;                  // City
  country: string;               // Country (default: "United States")
  state: string;                 // State (US only)
  province: string;              // Province (Canada only)
  postalCode: string;            // ZIP/Postal code
}
```

### HubSpot Contact Properties

**Primary membership data source:**

```typescript
{
  // Membership Information
  membership_type: string;       // Individual membership type (e.g., "Premium", "Professional")
  membership_paid_through__c: string; // Date membership is paid through (ISO string)
  current_term_start_date__c: string; // Current membership term start date
  member_status: string;         // "Active", "Inactive", "Pending", etc.
  activated_date__c: string;     // Date membership was activated
  
  // Auto-renewal Settings
  auto_renewing_: boolean | string; // Whether auto-renewal is enabled
  auto_renewal_request: boolean | string; // Auto-renewal request status
  
  // Basic Contact Info
  email: string;
  firstName: string;
  lastName: string;
}
```

### HubSpot Company Properties

**Company-level membership data:**

```typescript
{
  name: string;                  // Company name
  membership_type: string;       // Company membership type
}
```

## Membership Properties

### Core Membership Properties (Local Database)

**Table: `memberships`**
```typescript
{
  id: number;                    // Primary key, auto-increment
  userId: number;                // Foreign key to users table
  membershipId: string;          // Unique membership identifier (e.g., "CLA-2020-0847")
  type: string;                  // Membership type (e.g., "Professional", "Premium")
  status: string;                // Membership status (e.g., "Active", "Expired", "Pending")
  joinDate: Date;                // Membership start date
  expiryDate: Date;              // Membership expiration date
  hubspotDealId: string | null;  // Links to HubSpot deal record
}
```

### Calculated Membership Properties

**Derived from HubSpot data:**
```typescript
{
  daysUntilExpiry: number | null; // Calculated days until membership expires
  renewalNeeded: boolean;         // True if within 30 days of expiry
}
```

## HubSpot Property Mappings

### Profile Update Mappings

When updating user profiles via HubSpot API, the following property mappings are used:

```typescript
{
  firstname: string;             // Maps to firstName
  lastname: string;              // Maps to lastName
  individual_type__c: string;    // Maps to individualType
  contact_type: string;          // Maps to contactType
  total_of_laundries__c: string; // Maps to totalLaundries (as string)
  phone: string;                 // Maps to workPhone
  mobilephone: string;           // Maps to mobilePhone
  sms_consent: string;           // Maps to smsConsent (as string)
  address: string;               // Maps to address
  shipping_address_line_2: string; // Maps to addressLine2
  city: string;                  // Maps to city
  user_country: string;          // Maps to country
  user_state: string;            // Maps to state
  zip: string;                   // Maps to postalCode
}
```

## Membership Status Values

### Common Status Values
- `Active` - Membership is current and valid
- `Inactive` - Membership has expired or been suspended
- `Pending` - Membership is being processed
- `Expired` - Membership has passed expiration date

### Membership Types
- `Professional` - Standard professional membership
- `Premium` - Premium membership tier
- `Basic` - Basic membership tier

## Individual Type Options

### Individual Type Values
- `Store Owner` - Owns laundry business
- `Potential Investor` - Interested in investing
- `Store Employee` - Works at laundry business
- `Distributor` - Equipment distributor
- `Manufacturer` - Equipment manufacturer
- `Service Provider` - Service provider to industry
- `Other` - Other role

## Contact Type Options

### Contact Type Values
- `Primary Contact` - Primary business contact
- `Billing Contact` - Billing/administrative contact
- `Both` - Both primary and billing contact

## Industry Sector Options

### Company Sector Values
- `Commercial Laundry` - Commercial laundry services
- `Coin Laundry` - Coin-operated laundry
- `Dry Cleaning` - Dry cleaning services
- `Equipment Supplier` - Equipment supplier
- `Laundry Services` - General laundry services
- `Other` - Other industry sector

## Data Flow and Integration

### Authentication Flow
1. Users authenticate through HubSpot
2. HubSpot provides personalization tokens with user data
3. Frontend uses tokens to fetch additional data via API Gateway
4. Local database stores minimal user data for offline functionality

### Data Synchronization
- HubSpot is the source of truth for membership data
- Local database provides fallback and caching
- Eventbrite integration provides event registration data
- Profile updates are sent directly to HubSpot via API

### API Endpoints

**User Profile Management:**
- `GET /api/user/profile` - Fetch user profile and membership
- `PATCH /api/user/profile` - Update user profile

**HubSpot Integration:**
- `PATCH /crm/v3/objects/contacts/{contactId}` - Update HubSpot contact
- `GET /crm/v3/objects/contacts/{contactId}` - Fetch HubSpot contact
- `POST /crm/v3/objects/contacts/search` - Search contacts by email

## Important Notes for New Applications

1. **HubSpot as Primary Source**: Most membership data comes from HubSpot, not the local database
2. **Personalization Tokens**: User data is available via HubSpot personalization tokens in the frontend
3. **API Gateway**: HubSpot API calls go through an AWS API Gateway proxy
4. **Dual Membership Types**: Both individual and company membership types exist
5. **Auto-renewal Tracking**: Two separate properties track auto-renewal status
6. **Address Complexity**: Address fields vary by country (US states vs Canadian provinces)
7. **Phone Numbers**: Separate work and mobile phone numbers are tracked
8. **SMS Consent**: Explicit consent tracking for SMS communications
9. **Activity Logging**: All user actions are logged for audit purposes
10. **Event Integration**: Event registrations are linked to both Eventbrite and HubSpot

## Development Considerations

### Required Fields for New Membership
- `email` (required, unique)
- `firstName` (required)
- `lastName` (required)
- `membership_type` (required)
- `member_status` (required)
- `activated_date__c` (required)

### Optional but Recommended Fields
- `phone` - Contact information
- `companyName` - Business association
- `companySector` - Industry classification
- `individualType` - Role classification
- `address` fields - Complete address information
- `smsConsent` - Communication preferences

### Data Validation
- Email addresses must be unique
- Phone numbers should be validated for format
- Address fields should be validated by country
- Membership dates should be logical (join before expiry)
- Numeric fields (locationCount, totalLaundries) should be positive integers 