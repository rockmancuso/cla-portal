# CLA Portal

A member portal application with HubSpot and Eventbrite integration.

## Features

- Member dashboard with HubSpot data integration
- Eventbrite events display (organization events)
- HubSpot custom object integration for user event registrations
- Responsive design with Tailwind CSS

## Environment Configuration

Copy `.env.example` to `.env` and configure the following variables:

### Eventbrite API
- `VITE_EVENTBRITE_PRIVATE_TOKEN`: Your Eventbrite private API token
- `VITE_EVENTBRITE_ORGANIZATION_ID`: Your Eventbrite organization ID

### HubSpot API
- User eventbrite registrations are now fetched via AWS API Gateway (no frontend environment variables needed)
- Organization events continue to use direct Eventbrite API calls

## HubSpot Integration

### Eventbrite Registrations Custom Object

The application integrates with a HubSpot custom object called "eventbrite_registrations" to display user-specific event registrations.

**Custom Object Details:**
- Internal name: `eventbrite_registrations`
- Object type ID: `2-43504117`
- Association type ID: `95` (contact_to_eventbrite_registrations)

**Required Properties:**
- `event_name`: Name of the event
- `registration_date`: Date of registration
- `eb_attendee_email`: Email of the attendee (used for matching)
- `attendee_number`: Unique attendee identifier
- `event_start_date`: Event start date
- `event_end_date`: Event end date
- `event_url`: Link to the event
- `event_description`: Event description
- `event_location`: Event location
- `venue_name`: Venue name
- `is_free`: Whether the event is free
- `event_status`: Event status

### API Functions

The following functions have been implemented in `client/src/lib/api.ts`:

1. **`getHubSpotEventbriteRegistrations(contactId: string)`**
   - Queries the AWS API Gateway endpoint for eventbrite_registrations associated with a contact
   - Uses AWS API Gateway URL: `https://m7kj8ek8n3.execute-api.us-east-1.amazonaws.com/prod`
   - Avoids CORS issues by using server-side proxy to HubSpot API
   - Returns processed registration data from the backend

2. **`getMyRegisteredEventbriteEventsFromHubSpot()`**
   - Gets the current user's contact ID from HubSpot personalization tokens
   - Fetches associated registrations and transforms them to match the existing `EventbriteEventData` interface
   - Filters registrations by user email for security

3. **`getMyRegisteredEventbriteEvents()`** (Updated)
   - Now calls the HubSpot integration instead of the Eventbrite API
   - Maintains the same interface for frontend compatibility

### Data Flow

1. User loads the dashboard
2. HubSpot personalization tokens provide the contact ID and user email
3. The application queries AWS API Gateway endpoint with the contact ID
4. AWS Lambda function handles HubSpot API calls server-side to avoid CORS issues
5. Data is transformed to match the existing EventbriteEventData interface
6. Events are displayed in the existing UI components

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type check
npm run check

# Build for production
npm run build
```

## Deployment

The application is configured for deployment with the included `deploy.sh` script and CloudFront configuration.