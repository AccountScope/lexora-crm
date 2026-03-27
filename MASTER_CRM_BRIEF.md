# LEXORA - MASTER CRM BRIEF
**Tagline:** The Intelligence Layer for Legal Work

---

## MASTER OBJECTIVE

Build a production-grade legal CRM / law firm operating system capable of becoming the global standard for legal practice management.

The platform MUST support three deployment modes:

1. **Cloud SaaS** (multi-tenant)
2. **Hybrid Secure Mode** (local core + external portal)
3. **Full Air-Gapped Mode** (completely offline internal system)

The system must be enterprise-grade, security-first, automation-driven, and capable of handling highly sensitive legal data.

---

## CORE PRODUCT POSITIONING

Lexora is not just a CRM.

**It is the operating system for legal work.**

It must:
- Unify case management
- Automate workflows
- Reduce risk
- Improve billing accuracy
- Eliminate fragmented tools
- Provide total data control

---

## CRITICAL DIFFERENTIATOR

Lexora must be:
- **Automation-first**
- **Intelligence-driven**
- **Security-first**
- **Offline-capable**

Competitors store data.
**Lexora must actively assist lawyers in doing their work.**

---

## DEPLOYMENT MODES (STRICT DEFINITIONS)

### MODE 1: CLOUD
- Fully hosted
- Multi-tenant
- Fastest onboarding

### MODE 2: HYBRID SECURE
- Core system runs on firm infrastructure
- Client portal runs externally
- Controlled, secure sync between environments

### MODE 3: AIR-GAPPED
- Zero internet connectivity
- No external API dependency
- No inbound/outbound connections
- All data remains within firm network

---

## CRITICAL ARCHITECTURE: CLIENT PORTAL SEPARATION

In HYBRID and AIR-GAPPED modes:

**The internal legal system MUST NEVER be directly exposed to clients.**

Instead, implement a **TWO-SYSTEM ARCHITECTURE:**

### SYSTEM A: INTERNAL CORE (AIR-GAPPED / LOCAL)
- Full case data
- Internal notes
- Evidence
- Staff communication
- Full audit logs
- Privileged documents

### SYSTEM B: EXTERNAL CLIENT PORTAL
- Separate environment
- Contains ONLY approved client-safe data
- No direct access to internal database

---

## DATA CLASSIFICATION SYSTEM (MANDATORY)

Every record must include a visibility classification:

- `INTERNAL_ONLY`
- `FIRM_CONFIDENTIAL`
- `CLIENT_VISIBLE`
- `CLIENT_DOWNLOADABLE`
- `RESTRICTED`

**Only `CLIENT_VISIBLE` and `CLIENT_DOWNLOADABLE` data can ever leave the internal system.**

---

## SECURE PUBLISHING SYSTEM (CORE FEATURE)

Implement a dedicated **PUBLISHING ENGINE:**

### Responsibilities:
1. Detect records marked as `CLIENT_VISIBLE`
2. Validate permissions
3. Sanitize data (remove internal metadata, notes, hidden fields)
4. Package data into export bundle
5. Encrypt bundle
6. Cryptographically sign bundle
7. Transfer bundle to external portal

---

## SYNC MODEL (MANDATORY)

Implement **ONE-WAY OUTBOUND SYNC:**

- Internal → External only
- No direct inbound connection allowed

### Sync Options:
- Manual publish
- Scheduled (hourly, configurable)
- Event-triggered (optional later)

---

## INBOUND DATA HANDLING (CRITICAL SECURITY)

Client inputs must NOT directly enter the internal system.

### Instead:
1. Client uploads / messages go to **EXTERNAL PORTAL**
2. Data enters **QUARANTINE QUEUE**
3. Staff review and approve
4. Approved data is imported into internal system

### This Prevents:
- Malicious uploads
- Data injection risks
- Uncontrolled external access

---

## EVIDENCE VAULT SECURITY

- All documents hashed
- Chain-of-custody tracking
- Immutable logs
- Access tracking
- Secure export bundles for legal use

---

## CORE MODULES

### 1) CASE COMMAND CENTER
- Unified matter workspace
- Timeline
- Documents
- Tasks
- Deadlines
- Communications
- Billing
- Notes
- Team assignments

### 2) DOCUMENT INTELLIGENCE ENGINE
- OCR
- Search
- Version control
- Tagging
- Entity extraction

### 3) DEADLINE ENGINE
- Court rules
- Filing deadlines
- Escalation alerts

### 4) CLIENT PORTAL
- Secure login
- Case updates
- Messaging
- Document access
- Invoice visibility

### 5) TIME & BILLING
- Time tracking
- Suggested entries
- Invoice generation

### 6) SECURITY LAYER

Must include:
- AES-256 encryption at rest
- TLS in transit
- RBAC (Role-Based Access Control)
- Matter-level permissions
- Strict isolation
- Full audit logs (append-only)

### 7) MIGRATION ENGINE
- Document import
- Case reconstruction
- Deduplication

### 8) AI LEGAL ASSISTANT
- Document summaries
- Case summaries
- Draft generation

**IMPORTANT:** Must NOT provide legal advice

### 9) FINANCIAL INTELLIGENCE MODULE
- Transaction ingestion
- Anomaly detection
- Fraud analysis
- Forensic reporting

---

## SELF-HOSTED REQUIREMENTS

- Docker Compose deployment
- Local database (PostgreSQL)
- Local object storage (MinIO)
- Environment configuration
- Optional Kubernetes scaling

---

## OFFLINE REQUIREMENTS

- Full functionality without internet
- No dependency on external APIs
- Optional local AI integration
- LAN access only

---

## SECURITY GUARANTEE PRINCIPLE

**Clients NEVER connect to the internal system.**

They only interact with:
- A hardened external portal
- Populated via controlled, encrypted, signed exports

---

## UX REQUIREMENTS

- Enterprise-grade design
- Simple navigation
- Fast workflows
- No clutter

---

## STRICT RULES

### DO NOT:
- Expose internal system externally
- Allow direct client access to core database
- Bypass audit logging
- Rely on internet connectivity
- Mix internal and client-visible data

---

## BUILD PHASES

### PHASE 1:
- Database schema
- Auth
- Case management

### PHASE 2:
- Document system
- Deadline engine

### PHASE 3:
- Client portal
- Publishing system

### PHASE 4:
- Sync system
- Quarantine system

### PHASE 5:
- AI + Financial intelligence

---

## FINAL GOAL

Lexora must become:
- **The most secure legal platform**
- **The most intelligent legal workflow system**
- **The default operating system for law firms worldwide**

---

**Status:** Master brief captured 2026-03-27
**Source:** Harris directive
**Next:** CTO architecture design + Phase 1 build plan
