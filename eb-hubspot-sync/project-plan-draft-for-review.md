### Action Plan: Eventbrite-HubSpot Sync Lambda Refinement

#### 1\. Project Overview and Scope

The objective of this mission is the architectural transition from the legacy Zapier-based synchronization to a high-performance, refined AWS Lambda-based sync. This iteration is specifically engineered to solve existing data integrity issues, enforce record idempotency, and implement granular multi-attendee contact association.**Strict Directive:**  This version of the Lambda must strictly omit all WordPress URL lookups and storage. The lookupWordPressEventUrl function is to be removed, and no calls shall be made to the WordPress REST API. The wordpress\_event\_url property in HubSpot will not be populated or updated in this iteration.

#### 2\. Environment Configuration & Secrets Management

The following environment variables are required. IDs for custom questions should be retrieved from the Eventbrite "Order Form" settings or via the GET /v3/events/{id}/questions/ endpoint.| Variable | Description | Source / Derivation || \------ | \------ | \------ || HUBSPOT\_ACCESS\_TOKEN | Private App Token for CRM access. | HubSpot Private App Settings (Read/Write Scopes) || EVENTBRITE\_TOKEN | Server-side API token. | Eventbrite Private API Token || EVENTBRITE\_ORG\_ID | Organization ID for event filtering. | Eventbrite Account Settings || WEBHOOK\_SECRET | For validation. | User-defined secret in the webhook URL path || EB\_CUSTOM\_Q\_COMPANY | Question ID for "Company Name". | Eventbrite Custom Question ID || EB\_CUSTOM\_Q\_MOBILE | Question ID for "Mobile Number". | Eventbrite Custom Question ID || EB\_CUSTOM\_Q\_ADDRESS | Question ID for "Mailing Address". | Eventbrite Custom Question ID || EB\_CUSTOM\_Q\_INDIV\_TYPE | Question ID for "Individual Type". | Eventbrite Custom Question ID || EB\_CUSTOM\_Q\_OPT\_OUT | Question ID for "Opt Out". | Eventbrite Custom Question ID |

#### 3\. Mandatory Constraint: WordPress URL Exclusion

The integration agent must  **remove or bypass**  any logic previously dedicated to WordPress URL resolution.

* **Bypass**  the lookupWordPressEventUrl function entirely.  
* **Zero-Interaction Policy:**  No HTTP requests are to be dispatched to the WordPress REST API (WP\_API\_BASE).  
* **Property Exclusion:**  Do not update, map, or store the wordpress\_event\_url property in the HubSpot eventbrite\_registrations custom object.

#### 4\. Enhanced Multi-Attendee Logic Fix

The handleOrderPlaced handler must be updated to correctly process orders containing multiple tickets. Every person in the order must be registered as a distinct record associated with their specific HubSpot contact.

* **Iterate:**  Loop through the attendee array within the Eventbrite order payload.  
* **Prerequisite Call:**  For each attendee, perform a GET /v3/events/{id}/attendees/{attendee\_id}/?expand=answers.  **Warning:**  The ?expand=answers parameter is mandatory; failing to include it will result in missing custom question data.  
* **Email Extraction:**  Extract the unique email for each individual attendee via attendee.profile.email.  
* **HubSpot Search:**  Execute a POST /crm/v3/objects/contacts/search using the email as a filter property.  
* **Conditional Association (Type 95):**  
* **Contact Found:**  Use the returned contactId to link the custom object. You must specify  **Association Category/ID (Type 95\)**  for the contact\_to\_eventbrite\_registrations link.  
* **Contact Not Found:**  Log a warning to CloudWatch with the attendee details. Do not create an orphaned registration record.  
* **Identity Uniformity:**  Treat the purchaser as just another attendee in the loop. Do not default all tickets to the purchaser’s ID; each ticket must use the specific attendee's data.

#### 5\. Idempotency and Upsert Strategy

To prevent record duplication during webhook retries or parallel runs, the upsertRegistration function must implement the following:

* **Primary Key:**  Use eventbrite\_attendee\_id as the unique identifier.  
* **Search Protocol:**  Perform a search for existing records in Custom Object ID 2-43504117. The search body must filter specifically for the eventbrite\_attendee\_id property.  
* **Persistence Logic:**  
* **If Match Found:**  Execute a PATCH /crm/v3/objects/2-43504117/{recordId} to update existing data.  
* **If No Match Found:**  Execute a POST /crm/v3/objects/2-43504117 to create a new registration record.

#### 6\. HubSpot Custom Object Property Mapping

Map the following Eventbrite fields to the internal names of the eventbrite\_registrations object (ID 2-43504117).

##### Core Info & Status

* event\_name: event.name.text  
* attendee\_number: attendee.id (numeric ID)  
* eb\_attendee\_email: attendee.profile.email  
* event\_status: Map "Attendee created" to registered, "Attendee checked in" to checked\_in, "Attendee cancelled" to cancelled, and "Full refund" to refunded.

##### Financials & Quantity

* eb\_ticket\_type: ticket\_class.name  
* eb\_ticket\_price: ticket\_class.cost.major\_value  
* eb\_purchase\_amount: order.costs.gross.major\_value  
* eb\_quantity\_purchased: Map from order.costs.attendee\_count.

##### Custom Questions (Answers Array)

Iterate the answers array and map to the following properties based on environment variable Question IDs:

* eb\_company\_name: (Map from EB\_CUSTOM\_Q\_COMPANY)  
* eb\_mobile\_number: (Map from EB\_CUSTOM\_Q\_MOBILE)  
* eb\_mailing\_address: (Map from EB\_CUSTOM\_Q\_ADDRESS)  
* eb\_individual\_type: (Map from EB\_CUSTOM\_Q\_INDIV\_TYPE)  
* eb\_opt\_out: (Map from EB\_CUSTOM\_Q\_OPT\_OUT)

##### Timestamps

* registration\_date: order.created  
* eb\_order\_date: order.created  
* last\_synced\_at: Current system ISO timestamp.

#### 7\. Webhook Handler Refinement

The Lambda must route the following Eventbrite webhook actions:

* **order.placed** : Initiate the multi-attendee loop for record creation.  
* **attendee.updated** : Update specific status to checked\_in, cancelled, or refunded.  
* **order.refunded** : Execute a bulk update for all registration records linked to the specific Order ID, setting event\_status to refunded.  
* **event.updated** : Refresh event-level metadata (dates/titles) across all registrations associated with the eventbrite\_event\_id.

#### 8\. Verification & Error Handling Protocols

1. **Orphan Prevention:**  Log and ignore any attendees who do not have a matching HubSpot contact.  
2. **Rate Limiting & Retries:**  Implement exponential backoff for HubSpot API 429 responses.  
3. **Search Constraints:**  Be advised that the HubSpot Search API is capped at 10,000 records. While individual email searches will not hit this, any bulk reconciliation logic must account for this limit.  
4. **Payload Security:**  Verify the WEBHOOK\_SECRET present in the URL path before processing any incoming Eventbrite data.
