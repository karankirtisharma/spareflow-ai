# Spareflow AI

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle--ORM-0.45-yellowgreen.svg)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-blue.svg)](https://www.postgresql.org/)

An enterprise-grade, highly secure, multi-tenant inventory intelligence and control platform specifically designed for automobile spare parts distributors, wholesalers, and retail operators.

---

## 🗺️ Visual Preview Placeholder

```
+-------------------------------------------------------------------------+
| [Boxes] Spareflow INV                  [Search Products...]    [Bell] [P] |
+-------------------------------------------------------------------------+
| [Home]       |  Hello, Param Singh                                      |
| [Items]      |  XYZ Parts Hub                                           |
| [Inventory]  |                                                          |
|   Adjusts    |  +------------------------+  +------------------------+  |
|   Packages   |  |   Total Items Active   |  |   Low Threshold Alerts |  |
|   Shipments  |  |          4,892         |  |           12           |  |
| [Sales]      |  +------------------------+  +------------------------+  |
|   Customers  |                                                          |
|   Orders     |  [Recent Stock Movements Ledger]                         |
|   Invoices   |  - SO-10492: Packed & Prepped for CP Branch              |
| [Settings]   |  - PO-90118: Received Front Ceramic Brake Pads (Okhla)   |
+-------------------------------------------------------------------------+
```
*(Dynamic Demo GIF Placeholder)*

---

## 📌 Problem Statement

Automobile spare parts management is plagued by severe supply-chain friction, inventory leakage, and multi-location complexity:
1. **Untracked Multi-Location Stock**: Parts end up missing between showroom shelves, retail branches, and main regional warehouses.
2. **Poor Tenancy Separation**: SaaS platforms often suffer from logical database leakages, exposing customer lists and pricing records to unauthorized operators.
3. **Data Security Vulnerabilities**: Critical client contact logs, payment history, and Government tax identities (like PAN) are stored in cleartext, resulting in constant data compliance threats.

## 💡 The Spareflow Solution

Spareflow AI resolves these challenges through a unified **Modular Monolith** architecture that combines deep logical separation with a highly responsive, modern client experience:
- **Strict Tenant Sandboxing**: Logical database separation guarantees zero data leakages across separate organizations or shops.
- **Micro-Location Inventory**: Granular stock quantities tracked on a per-product, per-warehouse, and per-bin level.
- **Zero-Exposure Security Engine**: Automatic AES-256-CBC field-level encryption for sensitive database items (such as customer phone numbers, emails, and tax IDs).
- **Audit-Ready Ledgers**: Every single adjustment, order, or transfer creates an immutable stock movement log for clean accountability.

---

## ⚙️ Key Features

- **Multi-Tenant Architecture**: Robust session extraction and tenancy routing guards.
- **Granular Inventory Controls**: Inbuilt adjusters, packages, shipments, transfer moves, and putaways.
- **Role-Based Access Control (RBAC)**: Route-level request validation guards for `Owner`, `Manager`, and `Staff` roles.
- **Pristine Audit Ledger**: Single-source-of-truth stock movement logs capturing operational users and branches.
- **Secure Masking Layer**: Automatic encryption and decryption of business contact details at rest.
- **Interactive Developer Control Panel**: Live trace panels and custom user simulators for frictionless staging inspections.

---

## 🖥️ Technology Stack

- **Frontend Core**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Zustand (State Management), Motion (Animations)
- **Backend Service**: Node.js, Express, tsx, esbuild
- **Database Mapping**: Drizzle ORM, Drizzle Kit, PostgreSQL (`pg` pool)
- **Security Protocols**: JSON Web Tokens (JWT), Cryptographic salt hashes, AES-256-CBC with randomized IVs

---

## 📂 Project Repository Structure

```
├── .github/                  # Community templates (Issue forms, PR forms)
├── app/                      # Backend API Monolith
│   ├── api/v1/               # Router endpoints (Auth, Branches, Customers, Products)
│   ├── core/                 # App configurations and Encryption engine
│   ├── database/             # Pool setup and DB clients
│   ├── middleware/           # RBAC request guards and authentication
│   ├── repositories/         # DDD repository query access layers
│   ├── schemas/              # Request/Response validation schemas
│   └── services/             # Use-case business orchestration logic
├── docs/                     # Highly detailed technical manuals
│   ├── ARCHITECTURE.md       # Multi-tenant and modular clean architecture specs
│   ├── API.md                # Standardized REST endpoint descriptions
│   ├── DATABASE.md           # Drizzle relational schema and table definitions
│   ├── DEPLOYMENT.md         # Production Docker & Cloud Run steps
│   ├── ENVIRONMENT.md        # Environment variables and security configurations
│   └── ROADMAP.md            # Feature milestones and future plans
├── src/                      # Client React SPA codebase
│   ├── components/           # Extracted UI elements & Spareflow modules
│   ├── db/                   # Client-side / local schemas
│   ├── lib/                  # Layout configs and helpers
│   ├── stores/               # Zustand state synchronization stores
│   └── main.tsx              # Application entry bootstrap
└── package.json              # Main project definitions & dependencies
```

---

## 🛡️ Database & Security Flow

### Tenant Separation Flow
```
[Client Request] 
      |
      v
[JWT Validator Middleware] ---> Checks 'tenantId' in token claims
      |
      v
[Tenant Context Set] ---------> Scopes Drizzle transactions to active Tenant ID
      |
      v
[Relational Database] --------> Returns ONLY scoped rows (zero leakages)
```

### Encryption Engine
Sensitive customer fields are processed using a secure AES-256-CBC engine before hitting the relational database layer:
- **Write Path**: Raw text is salt-hashed, encrypted with a random Initialization Vector (IV), and stored as `iv_hex:cipher_hex`.
- **Read Path**: Retreived ciphertext is split, decrypted using the master server-side key, and returned as cleartext to authenticated client interfaces.

---

## 🚀 Installation & Setup

### 1. Requirements
Ensure you have **Node.js v20+** and **Postgres 15+** installed.

### 2. Configure Environment variables
Copy the template variables file:
```bash
cp .env.example .env
```
Provide the database connection credentials (`SQL_HOST`, `SQL_USER`, `SQL_PASSWORD`, `SQL_DB_NAME`).

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup & Schema Push
Generate and push migrations directly to your Postgres database:
```bash
npx drizzle-kit push
```

### 5. Running the Application
- **Run Locally (Dev)**:
  ```bash
  npm run dev
  ```
- **Run in Production Mode**:
  ```bash
  npm run build
  npm run start
  ```

---

## 🐋 Production Deployment with Docker

Build and run using our multi-stage optimized builder image:
```bash
docker build -t spareflow-ai .
docker run -d -p 3000:3000 --env-file .env spareflow-ai
```

---

## 🤝 Contributing

Contributions are highly appreciated. Please review our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting patches or feature proposals.

---

## 📜 License

This project is licensed under the terms of the **MIT License**. Check the [LICENSE](LICENSE) file for more details.

---

## 📣 Acknowledgements

Special thanks to our team of contributors, open-source maintainers, and reviewers who made the Spareflow AI platform sprint success possible!
