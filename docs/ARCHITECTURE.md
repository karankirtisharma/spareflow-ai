# Spareflow AI - System Architecture Manual

This document outlines the architectural blueprints, multi-tenant isolation mechanics, database schema design, and runtime layout of **Spareflow AI**.

---

## 1. Architectural Blueprint Overview

Spareflow AI is built as a **Modular Monolith** employing **Clean Architecture** and **Domain-Driven Design (DDD)** concepts on the backend, alongside an interactive Single-Page Application (SPA) frontend managed via **Vite, React, Tailwind CSS, and Zustand**.

```
                           +-----------------------------------+
                           |           Vite React UI           |
                           |       (Zustand State Store)       |
                           +-----------------------------------+
                                             |
                                             |  REST / HTTPS
                                             v
                           +-----------------------------------+
                           |            Express API            |
                           |       (RBAC Guard & Auth)         |
                           +-----------------------------------+
                                             |
                                             |  Tenant Extraction Context
                                             v
                           +-----------------------------------+
                           |        Core Business Layer        |
                           |       (Services & Repos)          |
                           +-----------------------------------+
                                             |
                                             |  Drizzle ORM
                                             v
                           +-----------------------------------+
                           |       PostgreSQL Storage          |
                           |      (Multi-Tenant Scoped)        |
                           +-----------------------------------+
```

---

## 2. Core Isolation Strategy

A central requirement of Spareflow AI is **Strict Multi-Tenant Isolation**. Multi-tenancy is handled at the application level via logical data segregation.

### A. Tenant Extraction Middleware
The Express router employs an authorization middleware layer (`authenticateUser`) that:
1. Validates the incoming JWT bearer token on request headers.
2. Unpacks the user claims (`tenantId`, `userId`, `role`).
3. Appends the validated `user` context object to the Request lifecycle.

### B. Tenant Query Boundaries
Repositories and service files are strictly prohibited from performing raw, unscoped queries. All queries against transactional datasets (products, inventory, branches, customers, invoices) must filter explicitly on the active `tenantId`.

---

## 3. Layered Design & Folders

The backend repository layout consists of clean boundaries separating database layers, data models, business logic orchestrations, and web endpoints:

1. **`/app/database`**: Establishes database pool clients and handles initialization hooks.
2. **`/app/schemas`**: Contains TypeScript types and request/response validation schemas.
3. **`/app/repositories`**: Encapsulates database access queries using Drizzle ORM. Injectable structures ensure queries are database-engine agnostic.
4. **`/app/services`**: Orchestrates high-level business use-cases (e.g. branch creation validations, password hashes).
5. **`/app/middleware`**: Governs request guards, role-based checks, and request metadata parsing.
6. **`/app/api/v1`**: Exposes standard controllers as modular REST API endpoints mapped to sub-routes.

---

## 4. Authentication and RBAC Flow

Access tokens are verified using industry-standard JWT protocols. 

### Role Hierarchy
Spareflow AI supports three default roles:
- **`Owner`**: Ultimate administrative authority. Can manage subscription billing, change tenant details, register/terminate users, and modify entire database records.
- **`Manager`**: Standard management level. Can register products, adjust inventories, manage branch allocations, and process invoice logs. Cannot change tenant profiles or delete the main accounts.
- **`Staff`**: Read-only or transactional entry level. Can inspect inventory quantities and generate drafts but cannot delete records or create administrative entries.

These constraints are protected via route-level guards (`requireManager`, `requireOwner`) running inside `/app/middleware/rbac.ts`.

---

## 5. Client State Architecture

On the React client, state is globally managed via **Zustand** stores (`src/stores/inventoryStore.ts`) ensuring:
- Near real-time optimistic UI updates.
- Offline-first cache syncing for static product lists.
- Decoupled API calls from presentation markup.
