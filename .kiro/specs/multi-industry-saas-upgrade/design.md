# Design Document: Multi-Industry SaaS Upgrade

## Overview

This design document specifies the technical architecture for upgrading the WA Automation platform to support multiple industry categories with SaaS as the primary fully-functional category. The system enables dynamic lead capture flows based on business category while maintaining a modern, production-ready user interface.

### Goals

1. Enable multi-industry support with SaaS as the first production-ready category
2. Implement dynamic question engine that adapts to client industry type
3. Modernize dashboard UI with card-based layouts and professional styling
4. Ensure proper WhatsApp number to client mapping for multi-tenant isolation
5. Define complete Firestore schema for scalable data storage
6. Maintain Firebase Emulator compatibility for development

### Non-Goals

1. Full production implementation of restaurant, hotel, or other categories (SaaS only)
2. Migration of existing restaurant data to new schema (backward compatibility maintained)
3. Advanced analytics or reporting features beyond basic counts
4. Real-time collaboration features

### Success Criteria

1. SaaS clients can capture leads with all required fields (name, email, phone, requirement)
2. Dashboard displays clients with category badges and proper styling
3. Leads page shows all captured leads with proper formatting
4. System supports 1000+ clients without performance degradation
5. All data properly isolated under clients/{clientId} structure
6. Firebase Emulator tests pass successfully

## Architecture

### System Architecture

```mermaid
graph TB
    subgraph "WhatsApp Cloud API"
        WA[WhatsApp Messages]
    end
    
    subgraph "Backend - Firebase Functions"
        WH[webhookUnified.js]
        LCF[leadCaptureFlow.js]
        CS[clientService.js]
        QE[Question Engine]
    end
    
    subgraph "Data Layer - Firestore"
        CLIENTS[(clients collection)]
        LEADS[(leads subcollection)]
        MESSAGES[(messages subcollection)]
        STATES[(leadCaptureStates)]
    end
    
    subgraph "Frontend - React Dashboard"
        DASH[Dashboard Page]
        CLI[Clients Page]
        LEAD[Leads Page]
        DETAIL[Client Details]
        FS[firebase.js Service]
    end
    
    WA -->|POST /webhook| WH
    WH -->|Resolve clientId| CS
    WH -->|Process message| LCF
    LCF -->|Get questions| QE
    LCF -->|Store lead| LEADS
    LCF -->|Save messages| MESSAGES
    LCF -->|Track state| STATES
    
    CS -->|Query by phoneNumberId| CLIENTS
    
    DASH -->|Load clients| FS
    CLI -->|CRUD operations| FS
    LEAD -->|Query leads| FS
    DETAIL -->|Get client data| FS
    
    FS -->|Read/Write| CLIENTS
    FS -->|Read/Write| LEADS
    FS -->|Read| MESSAGES
