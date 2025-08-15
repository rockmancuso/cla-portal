# HubSpot Integration Guide for CLA Portal

This guide provides comprehensive documentation for understanding the HubSpot integration patterns used in the CLA Portal codebase.

## 🎯 Key Files for Understanding HubSpot Integration

### 1. **Primary API Layer** (`client/src/lib/api.ts`)
**Most Important File** - Contains all HubSpot API patterns and data handling

**Key Patterns:**
- Interface definitions for HubSpot data structures
- API Gateway integration via AWS Lambda proxy
- Personalization token usage via `window.hubspotPageData`
- Error handling with fallback mock data
- Custom object integration for Eventbrite registrations

**Critical Functions:**
- `getHubSpotDashboardData()` - Main data fetching from personalization tokens
- `getHubSpotEventbriteRegistrations()` - Custom object API calls
- `updateUserProfile()` - Profile updates via HubSpot API
- `getAuthMe()` - Authentication validation

### 2. **Data Structure Documentation** (`membership.md`)
**Comprehensive reference** for all HubSpot properties and mappings

**Contains:**
- Complete HubSpot property mappings
- Data structure definitions for contacts, companies, memberships
- Field validation rules and required vs optional fields
- Membership status values and type options
- Address and phone number handling for different countries

### 3. **Authentication & Error Handling** (`hubspot-proxy/`)
**AWS Lambda proxy implementation** for HubSpot API calls

**Key Features:**
- CORS handling for cross-origin requests
- Token management and environment variable usage
- Error response patterns with proper HTTP status codes
- Request/response transformation between frontend and HubSpot API

### 4. **Database Schema** (`shared/schema.ts`)
**Type definitions and validation schemas**

**Provides:**
- Database schema definitions that mirror HubSpot structures
- TypeScript type definitions
- Data transformation patterns
- Zod validation schemas

### 5. **Configuration** (`hubspot.config.yml`)
**HubSpot portal configuration and authentication setup**

### 6. **Implementation Example** (`client/src/components/membership-section.tsx`)
**Real-world usage** of HubSpot data patterns in React components

## 🔑 Core Integration Patterns

### 1. **Personalization Token Pattern**
```typescript
// Access user data from HubSpot personalization tokens
const hubspotData = (window as any).hubspotPageData;

// Fallback to mock data in development
if (!hubspotData || !hubspotData.memberEmail) {
  return mockData;
}
```

### 2. **API Gateway Proxy Pattern**
```typescript
// All HubSpot API calls go through AWS Lambda to avoid CORS
const API_GATEWAY_URL = 'https://tvs4suqkuh.execute-api.us-east-1.amazonaws.com/prod';
const url = `${API_GATEWAY_URL}/crm/v3/objects/contacts/${contactId}`;
```

### 3. **Dual Data Source Pattern**
- **Primary**: HubSpot personalization tokens (immediate access)
- **Secondary**: HubSpot API calls via proxy (for updates/custom objects)
- **Fallback**: Local database (offline functionality)

### 4. **Authentication Flow**
```typescript
// Users authenticate through HubSpot CMS
// If they can access the page, they're authenticated
// No additional auth logic needed in the app
```

### 5. **Error Handling Pattern**
```typescript
try {
  // HubSpot API call
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed: ${response.status} ${response.statusText}`);
  }
  return await response.json();
} catch (error) {
  console.error('HubSpot API error:', error);
  // Return fallback data or throw for UI handling
}
```

## 📊 Data Structure Overview

### HubSpot Contact Properties (Primary Source)
```typescript
interface HubSpotContactData {
  // Membership Information
  membership_type?: string | null;
  membership_paid_through__c?: string | null;
  current_term_start_date__c?: string | null;
  member_status?: string | null;
  activated_date__c?: string | null;
  
  // Auto-renewal Settings
  auto_renewing_?: boolean | string | null;
  auto_renewal_request?: boolean | string | null;
  
  // Basic Contact Info
  email?: string;
  firstName?: string;
  lastName?: string;
}
```

### HubSpot Company Properties
```typescript
interface HubSpotCompanyData {
  name?: string | null;
  membership_type?: string | null;
}
```

### Custom Object Integration (Eventbrite Registrations)
```typescript
// Custom object: eventbrite_registrations
// Object type ID: 2-43504117
// Association type ID: 95 (contact_to_eventbrite_registrations)

interface EventbriteRegistration {
  event_name: string;
  registration_date: string;
  eb_attendee_email: string;
  attendee_number: string;
  event_start_date: string;
  event_end_date: string;
  event_url: string;
  event_description: string;
  event_location: string;
  venue_name: string;
  is_free: string;
  event_status: string;
}
```

## 🔧 Development Considerations

### Environment Setup
1. **Local Development**: Uses mock data when HubSpot tokens unavailable
2. **Production**: Relies on HubSpot personalization tokens
3. **API Gateway**: Required for custom object access and profile updates

### Required Environment Variables
```env
# AWS API Gateway (for HubSpot API calls)
VITE_API_GATEWAY_URL=https://tvs4suqkuh.execute-api.us-east-1.amazonaws.com/prod

# Lambda Environment (not exposed to frontend)
HUBSPOT_ACCESS_TOKEN=your_hubspot_token
```

### Key Dependencies
- **Frontend**: React, TypeScript, Axios
- **Backend**: AWS Lambda, API Gateway
- **Authentication**: HubSpot CMS (no custom auth needed)

## 🚨 Important Notes

1. **HubSpot as Primary Source**: Most membership data comes from HubSpot, not local database
2. **No Custom Authentication**: Relies entirely on HubSpot's built-in authentication
3. **CORS Limitations**: All HubSpot API calls must go through AWS Lambda proxy
4. **Personalization Tokens**: Primary data source for user information
5. **Custom Objects**: Require API calls (not available via personalization tokens)
6. **Error Handling**: Always provide fallback data for development
7. **Type Safety**: Use TypeScript interfaces for all HubSpot data structures

## 📁 File Structure in Zip

```
hubspot-integration-guide/
├── hubspot-integration-guide.md (this file)
├── client/src/lib/api.ts (primary API layer)
├── membership.md (data structure documentation)
├── hubspot-proxy/index.js (Lambda proxy implementation)
├── hubspot-proxy.yaml (AWS infrastructure)
├── shared/schema.ts (database schema)
├── hubspot.config.yml (HubSpot configuration)
└── client/src/components/membership-section.tsx (implementation example)
```

## 🎯 Quick Start for New Developers

1. **Read** `hubspot-integration-guide.md` (this file) for overview
2. **Study** `client/src/lib/api.ts` for API patterns
3. **Reference** `membership.md` for data structure details
4. **Review** `hubspot-proxy/index.js` for backend integration
5. **Examine** `client/src/components/membership-section.tsx` for real usage

This should provide everything needed to understand and work with the HubSpot integration patterns in this codebase. 