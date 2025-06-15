# SUMMARY.md

I have a codebase which is a simple, frontend-only app which interfaces with HubSpot and lives within a HubSpot page (I'm deploying the React app to a Cloudfront distro) and gets most data from HubSpot. I'm upgrading from my current system which was 100% in hubspot and not very advanced. I'm working on a couple additions to the code and I'd love your professional opinion on them. 

1. Navigation menu
- An extremely simple, static navigation menu was added at the top, and appears during local testing, but does not appear within the actual hubspot environment. 

2. Pulling data from `eventbrite_registrations` custom object. 
- We want to populate the "My Registered Eventbrite Events" area with the user's recently registered eventbrite events. 
- This exists in HubSpot as a custom object `eventbrite_registrations`, and the most recent value is also copied to the user's Contact record. 
- Ideally, we would pull from `eventbrite_registrations`, I would much prefer to do that as we can show all of their most recent registered events. However, we've had difficulty accessing this data. 
- Pulling the data using personalization tokens, like we do for the other Contact and Company data, does not work for custom objects apparently. 
- We tried an API-based approach but experienced issues here as well. We can't send the calls from the frontend due to CORS. So we need some sort of solution. Perhaps you can help find one? 
- I need your help figuring out a solution here. I'm open to using Cloudfront or a Lambda function, etc., but want to keep it as lightweight as humanly possible because this is only one minor feature. We want to keep it VERY simple - just list the most recent `eventbrite_registration` records associated with this Contact. 

3. Adding additional functionality (Important)
- NOTE: I want to do this in the most efficient way possible. We should fully utilize whatever tools HubSpot makes available to us (NOT custom code workflows as I do not have access to those) whenever possible. 
- I need to add some user profile management-related functionality, including:
* Ability to edit your profile (we currently do this through a HubSpot form, but if there's a more elegant way that does not introduce extra complexity, please let me know what you think)
* Update your email
* Update your phone number
* Update your associated company profile information 
- Again, I'm currently doing this all through HubSpot forms (a link on the profile page takes the user to various forms). 
- It really all boils down to a tradeoff between (a) development time, (b) added complexity, and (c) value to the user. Ideally, I do want a more elegant solution than hubspot forms. But if this means adding significant layers of complexity, I would have to consider carefully. 
- Let me know your thoughts on this! 

You should know:
- The current user's contact email is passed by HubSpot based on code in the Hubspot template file. That's how the system pulls all the data displayed on the frontend dashboard. 
- The app does not do any authentication as only Hubspot-authenticated users can access the app. 

THE CODEBASE IS ATTACHED.
