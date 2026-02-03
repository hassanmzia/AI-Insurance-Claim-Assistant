# AI Insurance Claim Assistant

A full-stack, multi-agent AI-powered insurance claim processing platform. The system automates claim intake, fraud detection, policy retrieval, coverage recommendation, and decision-making through a coordinated pipeline of specialized AI agents, while providing a comprehensive web interface for customers and insurance staff.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Services](#services)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [AI Agent Pipeline](#ai-agent-pipeline)
- [Communication Protocols](#communication-protocols)
- [Role-Based Access Control](#role-based-access-control)
- [Frontend Application](#frontend-application)
- [Claim Lifecycle](#claim-lifecycle)
- [Seed Data](#seed-data)
- [Project Structure](#project-structure)
- [Development](#development)
- [Port Reference](#port-reference)

---

## Architecture Overview

The platform is composed of **7 containerized services** running on a Docker Compose bridge network (`insurance-network`):

```
+------------------+       +------------------+       +-------------------+
|   React Frontend | ----> |   API Gateway    | ----> |  Django Backend   |
|   Port 3062      |       |   Port 4062      |       |  Port 8062        |
|   TypeScript SPA |       |   Express.js     |       |  DRF + Channels   |
+------------------+       +------------------+       +-------------------+
                                   |                          |
                                   v                          v
                           +-------------------+      +---------------+
                           |  Agent Service    |      | PostgreSQL 16 |
                           |  Port 9062 / 5062 |      | Port 5462     |
                           |  FastAPI + 7 AI   |      +---------------+
                           |  Agents           |
                           +-------------------+      +---------------+
                                   |                  |   Redis 7     |
                                   v                  |   Port 6382   |
                           +-------------------+      +---------------+
                           |   ChromaDB 0.5    |
                           |   Port 8562       |
                           |   Vector Store    |
                           +-------------------+
```

**Request flow:** Browser -> API Gateway (rate limiting, CORS, routing) -> Django Backend (auth, RBAC, business logic) -> Agent Service (AI processing) -> Data Stores (PostgreSQL, Redis, ChromaDB).

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript 4.9, React Router v6, Axios, Chart.js, React Hot Toast, React Icons, date-fns |
| **API Gateway** | Express.js, http-proxy-middleware, ws (WebSocket), Helmet, express-rate-limit, Morgan |
| **Backend** | Django 4, Django REST Framework, Daphne (ASGI), Django Channels, SimpleJWT, django-filter |
| **AI / Agents** | FastAPI, Uvicorn, Pydantic, SentenceTransformer (all-MiniLM-L6-v2), OpenAI GPT-4o-mini |
| **Databases** | PostgreSQL 16, Redis 7, ChromaDB 0.5.23 |
| **Infrastructure** | Docker, Docker Compose, bridge networking, volume persistence |

---

## Services

### 1. React Frontend (Port 3062)

Single-page application with 13 pages, JWT authentication context, and real-time WebSocket updates.

- **Pages:** Login, Register, Dashboard, Claims List, New Claim, Claim Detail, Fraud Alerts, Analytics, Agents, Policy Documents, Notifications, Profile, User Admin
- **Auth:** JWT tokens stored in localStorage with automatic refresh via Axios interceptor
- **Real-time:** WebSocket connection for live claim updates, notifications, and dashboard metrics

### 2. API Gateway (Port 4062)

Express.js reverse proxy that routes requests to backend services.

| Route Pattern | Destination | Description |
|---|---|---|
| `/api/**` | Backend :8062 | Django REST API |
| `/agents/**` | Agent Service :9062 | AI agent endpoints |
| `/mcp/**` | MCP Server :5062 | Model Context Protocol |
| `/ws` | Backend :8062 | WebSocket proxy |

- **Rate limiting:** 1000 requests per 15-minute window
- **Security:** Helmet headers, CORS configuration
- **Logging:** Morgan request logging

### 3. Django Backend (Port 8062)

Core application server running on Daphne (ASGI) with Django REST Framework.

- 12 data models with UUID primary keys
- 6-role RBAC system with 10 permission classes
- Comprehensive audit trail on all claim actions
- WebSocket consumers for real-time updates via Django Channels
- JWT authentication with token rotation and blacklisting

### 4. Agent Service (Port 9062 / 5062)

FastAPI server hosting 7 specialized AI agents with A2A and MCP communication protocols.

- **Port 9062:** Main REST API and A2A protocol
- **Port 5062:** MCP (Model Context Protocol) server for external LLM integration
- **Embedding model:** SentenceTransformer all-MiniLM-L6-v2
- **LLM:** OpenAI GPT-4o-mini for reasoning tasks

### 5. PostgreSQL 16 (Port 5462)

Primary relational database storing all application data.

- 12 tables with UUID primary keys
- Indexed on claim status, priority, claim number, and timestamps
- Connection pooling ready

### 6. Redis 7 (Port 6382)

In-memory data store used for:

- Django Channels layer (WebSocket pub/sub)
- Django cache backend
- Agent state and correlation tracking

### 7. ChromaDB 0.5.23 (Port 8562)

Vector database for policy document storage and semantic search (RAG).

- Collection: `auto_insurance_policy`
- Stores chunked policy documents as vector embeddings
- Supports semantic similarity search for policy retrieval agent

---

## Getting Started

### Prerequisites

- Docker and Docker Compose
- (Optional) OpenAI API key for LLM-powered agent processing

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd ai-insurance-claim-assistant

# Copy environment template and configure
cp .env.example .env
# Edit .env with your settings (OpenAI API key, etc.)

# Start all services
docker-compose up -d

# Wait for services to initialize, then seed demo data
docker exec insurance-backend python manage.py migrate
docker exec insurance-backend python manage.py seed_data

# Access the application
# Frontend:      http://localhost:3062
# API Gateway:   http://localhost:4062
# Backend API:   http://localhost:8062
# Agent Service: http://localhost:9062
```

### Default Credentials

| User | Username | Password | Role |
|---|---|---|---|
| Administrator | admin | admin123 | admin |
| Claims Manager | david.thompson | password123 | manager |
| Adjuster | sarah.mitchell | password123 | adjuster |
| Adjuster | james.rodriguez | password123 | adjuster |
| Adjuster | emily.chen | password123 | adjuster |
| QA Reviewer | lisa.wang | password123 | reviewer |
| Insurance Agent | michael.brown | password123 | agent |
| Demo User | demo | demo1234 | adjuster |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_DB` | insurance_claims | PostgreSQL database name |
| `POSTGRES_USER` | claims_admin | PostgreSQL username |
| `POSTGRES_PASSWORD` | claims_secure_pass_2026 | PostgreSQL password |
| `POSTGRES_HOST` | postgres | PostgreSQL host |
| `POSTGRES_PORT` | 5462 | PostgreSQL port |
| `REDIS_HOST` | redis | Redis host |
| `REDIS_PORT` | 6382 | Redis port |
| `REDIS_URL` | redis://redis:6382/0 | Redis connection URL |
| `CHROMADB_HOST` | chromadb | ChromaDB host |
| `CHROMADB_PORT` | 8562 | ChromaDB port |
| `DJANGO_SECRET_KEY` | (generated) | Django secret key |
| `DJANGO_DEBUG` | True | Django debug mode |
| `DJANGO_ALLOWED_HOSTS` | * | Allowed hosts |
| `DJANGO_CORS_ALLOWED_ORIGINS` | http://localhost:3062 | CORS origins |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | 60 | JWT access token TTL |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | 7 | JWT refresh token TTL |
| `OPENAI_API_KEY` | (required for AI) | OpenAI API key |
| `OPENAI_MODEL` | gpt-4o-mini | OpenAI model ID |
| `REACT_APP_API_URL` | http://localhost:4062/api | Frontend API base URL |
| `REACT_APP_WS_URL` | ws://localhost:4062/ws | Frontend WebSocket URL |

---

## Database Schema

### Entity Relationship Summary

```
User (Django built-in)
 |-- 1:1 --> UserProfile (role, department, phone, avatar)
 |-- 1:N --> InsurancePolicy (holder)
 |-- 1:N --> Claim (claimant)
 |-- 1:N --> Claim (assigned_adjuster)
 |-- 1:N --> Notification

PolicyDocument (uploaded PDFs, indexed in ChromaDB)
 |-- 1:N --> InsurancePolicy (policy_document)

InsurancePolicy (policy_number, type, premium, coverage)
 |-- 1:N --> Claim (policy)

Claim (root entity - claim_number, status, priority, loss details)
 |-- 1:N --> ClaimDocument (photos, invoices, reports)
 |-- 1:N --> ClaimNote (comments, AI-generated notes)
 |-- 1:N --> AuditLog (complete action history)
 |-- 1:N --> FraudAlert (AI-generated fraud warnings)
 |-- 1:N --> AgentTask (AI processing task tracking)

AgentTask
 |-- Self FK --> parent_task (hierarchical task tree)

DashboardMetric (pre-computed analytics, time-series)
```

### Key Models

| Model | Key Fields | Purpose |
|---|---|---|
| **UserProfile** | role (6 types), department, phone | Extended user data with RBAC role |
| **InsurancePolicy** | policy_number, policy_type, premium, deductible, coverage_limit | Customer insurance policies |
| **Claim** | claim_number, status (11 states), priority, loss_type, fraud_score, ai_recommendation | Core claim tracking |
| **ClaimDocument** | document_type (7 types), file, ai_extracted_data | Attached evidence files |
| **AuditLog** | action (11 types), details, old_value, new_value | Complete audit trail |
| **FraudAlert** | severity (4 levels), status (5 states), ai_confidence, indicators | Fraud detection results |
| **AgentTask** | agent_type (8 types), status, input_data, output_data, duration_ms | AI processing tasks |
| **PolicyDocument** | policy_type, document (file), is_indexed, chunk_count | Uploaded policy PDFs |
| **Notification** | notification_type (8 types), title, message, is_read | User notifications |
| **DashboardMetric** | metric_name, metric_value, period_start, period_end | Pre-computed metrics |

### Claim Status Values

| Status | Description |
|---|---|
| `draft` | Claim started but not submitted |
| `submitted` | Filed for processing |
| `under_review` | Being reviewed by staff |
| `ai_processing` | Multi-agent AI pipeline running |
| `pending_info` | Additional information requested |
| `approved` | Claim approved for settlement |
| `partially_approved` | Partial approval |
| `denied` | Claim denied with reason |
| `appealed` | Customer appealed a denial |
| `settled` | Payment processed |
| `closed` | Case fully closed |

### Insurance Policy Types

| Type | Premium | Deductible | Coverage Limit |
|---|---|---|---|
| Auto | $1,200 | $500 | $50,000 |
| Home | $1,800 | $1,000 | $250,000 |
| Health | $600 | $500 | $100,000 |
| Life | $400 | $0 | $500,000 |
| Commercial | $3,000 | $2,000 | $500,000 |

---

## API Reference

Base URL: `http://localhost:4062/api`

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/token/` | None | JWT login (returns access + refresh) |
| POST | `/token/refresh/` | None | Refresh access token |
| POST | `/auth/register/` | None | Register new user (creates policy for customers) |
| GET | `/auth/me/` | JWT | Get current user profile |
| PATCH | `/auth/profile/` | JWT | Update profile (name, email, phone) |
| POST | `/auth/change-password/` | JWT | Change password |
| DELETE | `/auth/delete-account/` | JWT | Delete account (requires password) |

### Claims

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/claims/` | IsOwnerOrStaff | List claims (role-filtered) |
| POST | `/claims/` | Authenticated | Create new claim |
| GET | `/claims/{id}/` | IsOwnerOrStaff | Claim details with all nested data |
| PATCH | `/claims/{id}/` | IsOwnerOrStaff | Update claim fields |
| POST | `/claims/{id}/process/` | CanProcessClaims | Trigger AI processing pipeline |
| POST | `/claims/{id}/assign/` | CanAssignClaims | Assign claim to staff member |
| POST | `/claims/{id}/update_status/` | CanProcessClaims | Update claim status with audit trail |
| POST | `/claims/{id}/upload_document/` | IsOwnerOrStaff | Upload claim document |
| POST | `/claims/{id}/add_note/` | IsOwnerOrStaff | Add note to claim |

### User Administration

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/admin/users/` | CanManageUsers | List all users with profiles |
| POST | `/admin/users/create/` | CanManageUsers | Create new user account |
| PATCH | `/admin/users/{id}/` | CanManageUsers | Update user role, status, info |
| GET | `/staff/` | Authenticated | List available staff for assignment |

### Resources

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/policies/` | Authenticated | List insurance policies (role-filtered) |
| PATCH | `/policies/{id}/` | Authenticated | Update policy |
| GET | `/policy-documents/` | IsStaffOrReadOnly | List policy documents |
| POST | `/policy-documents/` | IsStaff | Upload policy document |
| POST | `/policy-documents/{id}/index/` | IsStaff | Index document in ChromaDB |
| GET | `/fraud-alerts/` | CanManageFraudAlerts | List fraud alerts |
| POST | `/fraud-alerts/{id}/resolve/` | CanManageFraudAlerts | Resolve fraud alert |
| GET | `/notifications/` | Authenticated | List user notifications |
| POST | `/notifications/{id}/mark_read/` | Authenticated | Mark notification as read |
| POST | `/notifications/mark_all_read/` | Authenticated | Mark all notifications read |
| GET | `/agent-tasks/` | IsStaff | List AI agent tasks |
| GET | `/dashboard/` | Authenticated | Dashboard summary (role-aware) |
| GET | `/analytics/` | CanViewAnalytics | Detailed analytics report |
| GET | `/health/` | None | Health check |

### Agent Service Endpoints

Base URL: `http://localhost:9062`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check with agent list |
| GET | `/api/agents` | List registered AI agents (A2A discovery) |
| POST | `/api/process-claim` | Execute full AI processing pipeline |
| POST | `/api/index-policy` | Index policy PDF into ChromaDB |
| POST | `/api/a2a/message` | Send A2A message between agents |
| GET | `/api/a2a/agents/{agent_id}/card` | Get agent capability card |

### MCP Protocol Endpoints

Base URL: `http://localhost:5062`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/mcp/tools/call` | Execute MCP tool |
| GET | `/api/mcp/tools` | Discover available MCP tools |
| GET | `/api/mcp/tools/list` | List MCP tools with schemas |

---

## AI Agent Pipeline

The system uses a multi-agent orchestration pattern where an **Orchestrator Agent** coordinates 6 specialized agents to process insurance claims.

### Pipeline Flow

```
                    +-------------------+
                    |   Orchestrator    |
                    | (Coordinates all) |
                    +---------+---------+
                              |
               +--------------+--------------+
               |                             |
       +-------v-------+            +-------v--------+
       | 1. Claim Parser|           | 4. Fraud       |
       | Extract &      |           |    Detector    |
       | validate data  |           | Pattern analysis|
       +-------+-------+            +-------+--------+
               |                             |
       +-------v--------+           +-------v--------+
       | 2. Policy       |          | 5. Decision    |
       |    Retriever    |          |    Maker       |
       | RAG search in   |          | Final approve/ |
       | ChromaDB vectors|          | deny decision  |
       +-------+--------+           +----------------+
               |
       +-------v---------+          +----------------+
       | 3. Recommendation|         | 6. Document    |
       | Coverage analysis|         |    Analyzer    |
       | Settlement calc  |         | (On-demand)    |
       +-----------------+          +----------------+
```

### Agent Details

| Agent | Input | Output | Purpose |
|---|---|---|---|
| **Claim Parser** | Raw claim data | Structured ClaimInfo | Extracts and validates claim fields (claim number, policy, dates, loss type, amounts) |
| **Policy Retriever** | Claim info | Policy text chunks | Generates RAG queries, searches ChromaDB vector store for relevant policy sections |
| **Recommendation** | Claim + policy text | Coverage recommendation | Analyzes coverage limits, calculates settlement amounts with deductibles applied |
| **Fraud Detector** | Claim data | Fraud score + flags | Detects patterns: cost inflation, duplicate claims, timing anomalies, known fraud rings |
| **Decision Maker** | Recommendation + fraud score | Approve/deny decision | Integrates fraud analysis with coverage recommendation for final decision |
| **Document Analyzer** | Uploaded files | Extracted data | Analyzes photos, invoices, police reports, medical reports (triggered on-demand) |

### Processing Types

| Type | Agents Involved | Use Case |
|---|---|---|
| **full** | All 5 pipeline agents | Complete claim processing |
| **fraud_check** | Fraud Detector only | Quick fraud screening |
| **policy_lookup** | Policy Retriever only | Policy section lookup |
| **recommendation** | Recommendation only | Coverage analysis |

### Processing Log

Each AI processing run generates a detailed log with 6 steps:

```json
[
  {"step": "parsing", "agent": "claim_parser", "status": "completed", "duration_ms": 245},
  {"step": "query_generation", "agent": "policy_retriever", "status": "completed", "duration_ms": 180},
  {"step": "policy_retrieval", "agent": "policy_retriever", "status": "completed", "duration_ms": 320},
  {"step": "fraud_detection", "agent": "fraud_detector", "status": "completed", "duration_ms": 410},
  {"step": "recommendation", "agent": "recommendation", "status": "completed", "duration_ms": 290},
  {"step": "decision", "agent": "decision_maker", "status": "completed", "duration_ms": 150}
]
```

---

## Communication Protocols

### A2A (Agent-to-Agent) Protocol

Standard message format for inter-agent communication:

```json
{
  "message_id": "uuid-v4",
  "from_agent": "claim_parser",
  "to_agent": "policy_retriever",
  "action": "retrieve_policy",
  "payload": { "claim_info": { ... } },
  "correlation_id": "uuid-v4",
  "timestamp": "2026-02-03T00:00:00Z"
}
```

- **AgentRegistry** manages agent discovery and instantiation
- **A2AProtocol** class routes messages between agents
- Each agent publishes a capability card describing its actions and protocol

### MCP (Model Context Protocol)

Tool-based interface allowing external LLMs to invoke agent capabilities:

| Tool Name | Description |
|---|---|
| `parse_claim` | Parse and validate claim data |
| `generate_policy_queries` | Generate RAG search queries |
| `retrieve_policy_text` | Retrieve policy text from vector store |
| `generate_recommendation` | Generate coverage recommendation |
| `finalize_decision` | Produce final approve/deny decision |
| `detect_fraud` | Run fraud analysis |
| `analyze_document` | Analyze uploaded document |

### WebSocket (Real-time Updates)

Django Channels consumers provide real-time updates via WebSocket:

| Consumer | Group Pattern | Purpose |
|---|---|---|
| ClaimConsumer | `claim_{claim_id}` | Live claim status and agent progress |
| NotificationConsumer | `notifications_{user_id}` | Per-user notification delivery |
| DashboardConsumer | `dashboard_updates` | Real-time dashboard metric updates |

### JWT Authentication Flow

1. Client sends credentials to `POST /api/token/`
2. Server returns `access` token (60 min) and `refresh` token (7 days)
3. Frontend stores tokens in `localStorage`
4. All requests include `Authorization: Bearer {access_token}` header
5. On 401 response, Axios interceptor auto-refreshes via `POST /api/token/refresh/`
6. Token rotation enabled: old refresh tokens are blacklisted after use

---

## Role-Based Access Control

The system implements a 6-role RBAC hierarchy with 10 granular permission classes.

### Roles

| Role | Description | Key Capabilities |
|---|---|---|
| **Admin** | Full system access | All operations, user management, status override, analytics |
| **Manager** | Claims management | User management, claim assignment, status override, fraud review |
| **Adjuster** | Claim processing | Process/approve/deny claims, add notes and documents |
| **Reviewer** | QA & compliance | View all claims, analytics access, audit trail review |
| **Agent** | Customer-facing | Help file claims, view assigned claims, policy lookup |
| **Customer** | Self-service | File own claims, view own claims, upload documents, manage profile |

### Role Groups

```python
STAFF_ROLES      = ('admin', 'manager', 'adjuster', 'reviewer', 'agent')
MANAGEMENT_ROLES = ('admin', 'manager')
PROCESSING_ROLES = ('admin', 'manager', 'adjuster')
OVERSIGHT_ROLES  = ('admin', 'manager', 'reviewer')
```

### Permission Classes

| Class | Allowed Roles | Used By |
|---|---|---|
| `IsAdmin` | admin | System configuration |
| `IsManagement` | admin, manager | User admin, assignments |
| `IsStaff` | All 5 staff roles | Internal operations |
| `IsStaffOrReadOnly` | Staff (write), customer (read) | Policy documents |
| `IsOwnerOrStaff` | Object owner or any staff | Claims CRUD |
| `CanProcessClaims` | admin, manager, adjuster | Approve, deny, status changes |
| `CanAssignClaims` | admin, manager | Claim assignment |
| `CanManageFraudAlerts` | Staff (view), management + adjuster (resolve) | Fraud alert management |
| `CanViewAnalytics` | admin, manager, reviewer | Analytics and reports |
| `CanManageUsers` | admin, manager | User administration |

### Status Override

Admin and Manager roles can set **any** claim status regardless of workflow transitions. Overrides are flagged in the audit trail with `override: true` in the details field. Adjusters are restricted to standard workflow transitions:

```
submitted     -> under_review, ai_processing, pending_info
under_review  -> approved, denied, pending_info
ai_processing -> under_review
pending_info  -> submitted, under_review
approved      -> settled
appealed      -> under_review
```

---

## Frontend Application

### Pages

| Page | Route | Access | Description |
|---|---|---|---|
| Login | `/login` | Public | JWT authentication |
| Register | `/register` | Public | New customer registration with insurance type selection |
| Dashboard | `/` | Authenticated | Role-aware metrics, charts, recent claims |
| Claims List | `/claims` | Authenticated | Filterable claims table with "Assigned To" column for staff |
| New Claim | `/claims/new` | Authenticated | Claim submission form with insurance policy dropdown |
| Claim Detail | `/claims/:id` | Owner/Staff | Full claim view with documents, notes, audit log, fraud alerts |
| Fraud Alerts | `/fraud-alerts` | Staff | Fraud alert management and resolution |
| Analytics | `/analytics` | Admin/Manager/Reviewer | Detailed charts and reporting |
| Agents | `/agents` | Admin/Manager | A2A agent discovery and management |
| Policy Documents | `/policy-documents` | Staff | Upload and index policy PDFs for RAG |
| Notifications | `/notifications` | Authenticated | Notification center |
| Profile | `/profile` | Authenticated | Edit account info, change password, manage policies |
| User Admin | `/user-admin` | Admin/Manager | User table, create/edit users, role management |

### Key Frontend Features

- **JWT Auth Context:** Manages login state, token refresh, role-based rendering, `refreshUser()` for profile updates
- **Role-Based Navigation:** Sidebar items filtered by user role with color-coded role badges
- **Claim Detail Page:** Staff assignment dropdown, status override panel (admin/manager), AI processing trigger, real-time audit trail
- **Claims List:** Search, filter by status/priority/loss type, "Assigned To" column for staff visibility
- **Registration:** Insurance type selection (Auto, Home, Health, Life, Commercial) with automatic policy creation
- **Profile Management:** Account info editing, policy type viewing, password change, account deletion

---

## Claim Lifecycle

### Status Flow Diagram

```
draft -> submitted -> under_review -> ai_processing -> approved -> settled -> closed
                          |               |               |
                          v               v               v
                     pending_info    under_review       denied
                          |                               |
                          v                               v
                     submitted                        appealed
                     (resubmit)                          |
                                                         v
                                                    under_review
```

### AI Processing Flow

1. Staff clicks "Process with AI" on a submitted claim
2. Backend calls Agent Service `POST /api/process-claim`
3. Orchestrator runs 5-step pipeline (parse -> retrieve -> recommend -> fraud -> decide)
4. Results written back: `ai_recommendation`, `fraud_score`, `fraud_flags`, `ai_processing_log`
5. If auto-approve conditions met, claim status set to `approved` or `denied`
6. Audit log entry created with AI processing details
7. Fraud alerts generated if fraud score exceeds thresholds
8. Notifications sent to relevant users

---

## Seed Data

Run the seed command to populate the database with demo data:

```bash
docker exec insurance-backend python manage.py seed_data
```

### What Gets Created

| Entity | Count | Details |
|---|---|---|
| Admin | 1 | admin / admin123 |
| Manager | 1 | david.thompson / password123 |
| Adjusters | 3 | sarah.mitchell, james.rodriguez, emily.chen |
| Reviewer | 1 | lisa.wang / password123 |
| Agent | 1 | michael.brown / password123 |
| Customers | 10 | Auto-generated with policies and claims |
| Demo User | 1 | demo / demo1234 (adjuster) |
| Claims | ~10 | Various statuses, loss types, fraud scores |
| Fraud Alerts | Variable | Generated for claims with high fraud scores |
| Notifications | Variable | Admin, adjuster, and customer notifications |
| Audit Logs | Variable | Created, assigned, status_change entries |

### Fraud Alert Templates

- Duplicate Claim Pattern Detected
- Inflated Repair Estimate
- Inconsistent Claim Details
- Suspicious Timing Pattern
- Known Fraud Ring Association

---

## Project Structure

```
ai-insurance-claim-assistant/
|
|-- docker-compose.yml                  # 7-service orchestration
|-- .env / .env.example                 # Environment configuration
|-- README.md                           # This file
|
|-- backend/                            # Django Backend (Port 8062)
|   |-- config/
|   |   |-- settings.py                 # Django settings (DB, JWT, CORS, Channels)
|   |   |-- urls.py                     # Root URL configuration
|   |   |-- asgi.py                     # ASGI config (Daphne + Channels)
|   |-- claims/
|   |   |-- models.py                   # 12 data models
|   |   |-- views.py                    # ViewSets, custom actions, dashboard, user admin
|   |   |-- serializers.py              # DRF serializers with auto-policy creation
|   |   |-- permissions.py              # 6-role RBAC with 10 permission classes
|   |   |-- urls.py                     # API URL routing
|   |   |-- consumers.py               # WebSocket consumers
|   |   |-- admin.py                    # Django admin configuration
|   |   |-- management/commands/
|   |       |-- seed_data.py            # Database seeding command
|   |-- Dockerfile
|   |-- requirements.txt
|
|-- frontend/                           # React Frontend (Port 3062)
|   |-- src/
|   |   |-- App.tsx                     # Root component with routing
|   |   |-- types/index.ts             # TypeScript type definitions
|   |   |-- context/AuthContext.tsx     # JWT authentication context
|   |   |-- services/api.ts            # Axios instance + all API methods
|   |   |-- components/Layout.tsx      # Main layout with sidebar navigation
|   |   |-- pages/
|   |       |-- LoginPage.tsx           # JWT login
|   |       |-- RegisterPage.tsx        # Registration with insurance type
|   |       |-- DashboardPage.tsx       # Role-aware dashboard
|   |       |-- ClaimsPage.tsx          # Claims list with filters
|   |       |-- NewClaimPage.tsx        # New claim form
|   |       |-- ClaimDetailPage.tsx     # Full claim detail view
|   |       |-- FraudAlertsPage.tsx     # Fraud alert management
|   |       |-- AnalyticsPage.tsx       # Analytics and reports
|   |       |-- AgentsPage.tsx          # A2A agent management
|   |       |-- PolicyDocumentsPage.tsx # Policy document upload/index
|   |       |-- NotificationsPage.tsx   # Notification center
|   |       |-- ProfilePage.tsx         # User profile management
|   |       |-- UserAdminPage.tsx       # User administration
|   |-- Dockerfile
|   |-- package.json
|
|-- agent-service/                      # AI Agent Service (Port 9062 / 5062)
|   |-- main.py                         # FastAPI app with all endpoints
|   |-- agents/
|   |   |-- orchestrator.py             # Pipeline orchestrator
|   |   |-- claim_parser.py             # Claim data extraction
|   |   |-- policy_retriever.py         # RAG policy search (ChromaDB)
|   |   |-- recommendation.py           # Coverage recommendation engine
|   |   |-- fraud_detector.py           # Fraud detection and scoring
|   |   |-- decision_maker.py           # Final claim decision
|   |   |-- document_analyzer.py        # Document data extraction
|   |-- a2a/
|   |   |-- protocol.py                 # A2A message routing
|   |   |-- registry.py                 # Agent discovery registry
|   |-- mcp/
|   |   |-- server.py                   # MCP tool server
|   |   |-- tools.py                    # MCP tool definitions
|   |-- Dockerfile
|   |-- requirements.txt
|
|-- api-gateway/                        # API Gateway (Port 4062)
|   |-- server.js                       # Express.js proxy server
|   |-- Dockerfile
|   |-- package.json
|
|-- docs/                               # Documentation
|   |-- architecture-diagram.drawio     # draw.io architecture diagram
|   |-- Technical-Architecture.pptx     # PowerPoint presentation
```

---

## Development

### Running Individual Services

```bash
# Backend only
docker-compose up -d postgres redis
cd backend && python manage.py runserver 0.0.0.0:8062

# Frontend only
cd frontend && npm start

# Agent service only
docker-compose up -d chromadb redis
cd agent-service && uvicorn main:app --host 0.0.0.0 --port 9062
```

### Rebuilding Services

```bash
# Rebuild all services
docker-compose build

# Rebuild specific service
docker-compose build backend

# Rebuild and restart
docker-compose up -d --build
```

### Database Operations

```bash
# Run migrations
docker exec insurance-backend python manage.py migrate

# Create superuser
docker exec -it insurance-backend python manage.py createsuperuser

# Seed demo data
docker exec insurance-backend python manage.py seed_data

# Django admin panel: http://localhost:8062/admin/
```

### Logs

```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f agent-service
docker-compose logs -f api-gateway
```

---

## Port Reference

All ports use non-default values to avoid conflicts with other services:

| Service | Internal Port | External Port |
|---|---|---|
| Frontend | 3062 | 3062 |
| API Gateway | 4062 | 4062 |
| MCP Server | 5062 | 5062 |
| PostgreSQL | 5432 | 5462 |
| Redis | 6379 | 6382 |
| Django Backend | 8062 | 8062 |
| ChromaDB | 8000 | 8562 |
| Agent Service | 9062 | 9062 |

---

## License

This project is proprietary software. All rights reserved.
