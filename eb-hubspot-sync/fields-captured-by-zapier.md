# Fields Captured by Zapier

Below is a clean breakdown of the data fields currently being passed from Eventbrite into HubSpot via Zapier, grouped by the following:
	•	Create / Update HubSpot Contact
	•	Create HubSpot Custom Object (eventbrite_registrations)

⸻

## 1. Contact Record Fields (HubSpot Contact)

These fields are written directly to the HubSpot Contact record.

Identity
	•	Email
	•	Source: Profile Email
	•	Example: john@solomatic.com

Name
	•	First Name
	•	Source: Profile First Name
	•	Example: John
	•	Last Name
	•	Source: Profile Last Name
	•	Example: Tyrrell

⸻

### Eventbrite Metadata Stored on Contact

These appear to be custom contact properties used to store the most recent registration info.
	•	Eventbrite Attendee Number
	•	Source: Order Id
	•	Example: 12258535653
	•	Eventbrite Company Name
	•	Source: Question Company Name
	•	Example: Solomatic by Caco Mfg.
	•	Eventbrite Event Name (Last Registered)
	•	Source: Event Name Text
	•	Example: CLA Connect LIVE – Illinois
	•	Eventbrite Individual Type
	•	Source: Question Individual Type
	•	Example: Manufacturer
	•	Eventbrite Mailing Address
	•	Source: Question Mailing Address
	•	Example:
5816 Heiser St., Houston, TX 77087
	•	Eventbrite Mobile Number
	•	Source: Question Mobile Number Used Only For Emergencies And Event Information
	•	Eventbrite Opt Out
	•	Source: Question Opt Out

⸻

### Order / Transaction Info
	•	Eventbrite Order Date (Timestamp)
	•	Example: 01-17-2025 15:07:29
	•	Eventbrite Order Date (Date Only)
	•	Example: 01-17-2025
	•	Eventbrite Purchase Amount
	•	Source: Costs Gross Major Value
	•	Example: 60.00
	•	Eventbrite Quantity Purchased
	•	Source: Quantity
	•	Example: 1
	•	Eventbrite Ticket Type
	•	Source: Ticket Class Display Name
	•	Example: Member

⸻

## 2. HubSpot Custom Object

Object Name: eventbrite_registrations

Each registration creates one record in this object.

This lets you track multiple registrations per contact.

⸻

### Core Attendee Information
	•	Attendee First Name
	•	Source: Profile First Name
	•	Example: John
	•	Attendee Last Name
	•	Source: Profile Last Name
	•	Example: Tyrrell
	•	Attendee Email
	•	Source: Profile Email
	•	Example: john@solomatic.com
	•	Attendee Number
	•	Source: Order Id
	•	Example: 12258535653

⸻

### Company & Demographics
	•	Company Name
	•	Source: Question Company Name
	•	Example: Solomatic by Caco Mfg.
	•	Individual Type
	•	Source: Question Individual Type
	•	Example: Manufacturer

⸻

### Contact Information
	•	Mailing Address
	•	Source: Question Mailing Address
	•	Mobile Number
	•	Source:
Question Mobile Number Used Only For Emergencies And Event Information

⸻

###Ticket Information
	•	Ticket Type
	•	Source: Ticket Class Display Name
	•	Example: Member
	•	Ticket Quantity Purchased
	•	Source: Quantity
	•	Example: 1

⸻

### Event Information
	•	Event Name
	•	Source: Event Name Text
	•	Example: CLA Connect LIVE – Illinois
	•	Registration Date
	•	Example: 01-17-2025

⸻

### Purchase / Order Information
	•	Purchase Amount
	•	Source: Costs Gross Major Value
	•	Example: 60.00

⸻

## 3. Relationship Structure (Important for Your App)

Your custom integration should likely maintain this structure:

### Contact
   │
   └── eventbrite_registrations (Custom Object)
           │
           ├── Event Name
           ├── Ticket Type
           ├── Purchase Amount
           ├── Registration Date
           ├── Quantity
           └── Attendee Info

#### Meaning:
	•	1 Contact → Many Event Registrations
	•	Each registration is a separate object record

This prevents overwriting historical registrations.

⸻

## 4. Raw Eventbrite Fields You Must Capture

### From the Eventbrite payload you should ingest:
	•	Profile First Name
	•	Profile Last Name
	•	Profile Email
	•	Order Id
	•	Event Name Text
	•	Ticket Class Display Name
	•	Quantity
	•	Costs Gross Major Value
	•	Question Company Name
	•	Question Individual Type
	•	Question Mailing Address
	•	Question Mobile Number
	•	Question Opt Out
	•	Order Date


💡 Suggestion (based on your CLA workflows):

You may want to also capture these if available from Eventbrite:
	•	Eventbrite Event ID
	•	Eventbrite Ticket ID
	•	Eventbrite Order ID
	•	Eventbrite Attendee ID

Those make deduplication much safer.
