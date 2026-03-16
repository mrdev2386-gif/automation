# Requirements Document

## Introduction

This document specifies requirements for upgrading the WA Automation platform to support multiple industry categories with SaaS as the primary fully-functional category. The system will enable dynamic lead capture flows based on business category while maintaining a modern, production-ready user interface. The architecture will support SaaS businesses immediately while remaining extensible for restaurants, hotels, and other service industries.

## Glossary

- **Platform**: The WA Automation system consisting of dashboard UI and backend services
- **Client**: A business entity using the Platform to capture leads via WhatsApp
- **Industry_Type**: The business category classification (saas, restaurant, hotel, service)
- **Lead**: A potential customer who has completed the WhatsApp capture flow
- **Bot_Config**: Configuration data determining the WhatsApp conversation flow for a Client
- **Lead_Capture_Flow**: The sequence of WhatsApp messages and questions presented to potential customers
- **Dashboard**: The web-based administrative interface for managing Clients and viewing Leads
- **Requirement_Field**: An open-text input field where SaaS leads describe their business needs
- **Category_Badge**: A visual indicator displaying the Industry_Type of a Client

## Requirements

### Requirement 1: Client Category Management

**User Story:** As a platform administrator, I want to assign business categories to clients, so that each client receives appropriate lead capture flows.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a Business Category dropdown in the Add Client form
2. THE Business Category dropdown SHALL include options: "SaaS Business", "Restaurant", "Hotel", "Other Service"
3. WHEN a Client is created, THE Platform SHALL store the Industry_Type as one of: "saas", "restaurant", "hotel", "service"
4. THE Business Category dropdown SHALL default to "SaaS Business"
5. WHEN a Client record is retrieved, THE Platform SHALL include the Industry_Type field
6. THE Dashboard SHALL display a Category_Badge for each Client showing their Industry_Type

### Requirement 2: SaaS Lead Capture Flow

**User Story:** As a SaaS business owner, I want leads to provide their requirements in detail, so that I can understand their needs before contact.

#### Acceptance Criteria

1. WHEN Industry_Type equals "saas", THE Lead_Capture_Flow SHALL present a greeting message
2. WHEN Industry_Type equals "saas", THE Lead_Capture_Flow SHALL request the lead's name as a required field
3. WHEN Industry_Type equals "saas", THE Lead_Capture_Flow SHALL request the lead's email as a required field
4. WHEN Industry_Type equals "saas", THE Lead_Capture_Flow SHALL request the lead's phone as a required field
5. WHEN Industry_Type equals "saas", THE Lead_Capture_Flow SHALL request the lead's requirement using an open-text input
6. THE Requirement_Field SHALL support multi-line text input
7. THE Lead_Capture_Flow SHALL require the Requirement_Field to be completed before proceeding
8. WHEN Industry_Type equals "saas", THE Lead_Capture_Flow SHALL optionally ask about budget
9. WHEN Industry_Type equals "saas", THE Lead_Capture_Flow SHALL offer a human handoff option
10. WHEN a SaaS lead completes the flow, THE Platform SHALL store a document containing: name, email, phone, requirement, industryType, source, createdAt

### Requirement 3: Dynamic Question Engine

**User Story:** As a platform developer, I want the bot to ask different questions based on industry type, so that each business category collects relevant information.

#### Acceptance Criteria

1. WHEN Industry_Type equals "saas", THE Lead_Capture_Flow SHALL ask for requirement and budget
2. WHEN Industry_Type equals "restaurant", THE Lead_Capture_Flow SHALL ask for party size and date/time
3. WHEN Industry_Type equals "hotel", THE Lead_Capture_Flow SHALL ask for check-in date and number of guests
4. THE Platform SHALL determine questions using Bot_Config or industry mapping
5. THE Dashboard components SHALL NOT contain hardcoded industry-specific question logic
6. WHEN a Client's Industry_Type changes, THE Lead_Capture_Flow SHALL update to match the new category

### Requirement 4: Dashboard Modernization

**User Story:** As a platform user, I want a modern professional interface, so that the platform appears credible and is easy to use.

#### Acceptance Criteria

1. THE Dashboard SHALL use a card-based layout for content organization
2. THE Dashboard SHALL apply soft shadows with maximum blur radius of 20px
3. THE Dashboard SHALL maintain consistent spacing using a base unit of 8px
4. THE Dashboard SHALL use a modern typography system with clear hierarchy
5. THE Dashboard SHALL use a consistent icon set across all pages
6. THE Dashboard SHALL adapt layout for screen widths below 768px
7. WHEN a section contains no data, THE Dashboard SHALL display a professional empty state message
8. THE Dashboard sidebar SHALL include navigation items: Dashboard, Clients, Chats, Leads, Settings
9. THE Dashboard home page SHALL display cards for: Total Clients, Total Conversations, Total Leads, Active Bots

### Requirement 5: Client Details Display

**User Story:** As a platform user, I want to see comprehensive client information, so that I can quickly understand each client's status and activity.

#### Acceptance Criteria

1. THE Client Details page SHALL display the Client's business name
2. THE Client Details page SHALL display a Category_Badge showing the Industry_Type
3. THE Client Details page SHALL display the WhatsApp connection status
4. THE Client Details page SHALL provide a toggle control for enabling or disabling the bot
5. THE Client Details page SHALL display the count of Leads associated with the Client
6. THE Client Details page SHALL display recent conversations for the Client
7. THE Client Details page SHALL use status badges with distinct colors for different states

### Requirement 6: Data Integrity and Safety

**User Story:** As a platform developer, I want data operations to be safe and consistent, so that the system remains reliable across deployments.

#### Acceptance Criteria

1. THE Platform SHALL initialize Firebase services exactly once per application lifecycle
2. THE Platform SHALL NOT contain hardcoded references to "restaurant" in industry-agnostic code paths
3. WHEN querying Client data, THE Platform SHALL use the path pattern "clients/{clientId}"
4. WHEN storing a Lead document, THE Platform SHALL include fields: name, email, phone, requirement, industryType, source, createdAt
5. THE Platform SHALL set the source field to "whatsapp" for all WhatsApp-captured Leads
6. THE Platform SHALL store createdAt as a timestamp representing the Lead creation time
7. THE Platform SHALL function correctly when connected to Firebase Emulator Suite

### Requirement 7: Lead Data Parsing and Display

**User Story:** As a platform user, I want to view captured leads with all their information, so that I can follow up effectively.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a Leads page accessible from the sidebar
2. WHEN a Lead document is retrieved, THE Platform SHALL parse all fields: name, email, phone, requirement, industryType, source, createdAt
3. THE Leads page SHALL display Leads grouped by Client
4. THE Leads page SHALL display the Requirement_Field content in a readable format
5. WHEN the Requirement_Field contains multi-line text, THE Dashboard SHALL preserve line breaks in display
6. THE Leads page SHALL display the Industry_Type for each Lead
7. THE Leads page SHALL display the createdAt timestamp in a human-readable format

### Requirement 8: SaaS Category Validation

**User Story:** As a quality assurance tester, I want to verify the SaaS flow works completely, so that we can confidently launch for SaaS clients.

#### Acceptance Criteria

1. WHEN a Client with Industry_Type "saas" receives a WhatsApp message, THE Lead_Capture_Flow SHALL initiate successfully
2. WHEN a lead completes all required SaaS fields, THE Platform SHALL store the Lead document in Firestore
3. WHEN viewing a SaaS Client in the Dashboard, THE Platform SHALL display all captured Leads
4. THE Platform SHALL NOT generate console errors during SaaS Lead capture
5. THE Platform SHALL NOT generate console errors when displaying SaaS Leads in the Dashboard
6. WHEN tested with Firebase Emulator, THE Platform SHALL successfully capture and display SaaS Leads
7. FOR ALL valid SaaS Lead objects, storing then retrieving SHALL produce an equivalent object with all required fields present
