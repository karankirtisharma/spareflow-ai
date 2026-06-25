# Spareflow AI - Database Specifications

This document catalogs the entity schemas, constraints, field types, and indexing rules for Spareflow AI, configured via **Drizzle ORM** mapping to a **PostgreSQL** relational engine.

---

## 1. Relational Schema Summary

The database uses a clean star-like relational structure, isolated per tenant. Almost every transactional table maintains a foreign key constraint referencing the `tenants` table.

---

## 2. Table Catalog

### A. Tenants (`tenants`)
Represents the top-level corporate account boundaries.
- **`id`** (`text`, PK): Unique business ID format (e.g. `tnt_xxx`).
- **`businessName`** (`text`, NOT NULL): Registered business name.
- **`businessType`** (`text`, NOT NULL): Parts Distributor, Retailer, Wholesaler, workshop, etc.
- **`plan`** (`text`, default: `"free"`): Plan subscription (free, growth, enterprise).
- **`isActive`** (`boolean`, default: `true`): Billing status flag.

### B. Branches (`branches`)
Individual outlet, showroom, or operational office belonging to a tenant.
- **`id`** (`text`, PK): Unique branch identifier (e.g. `brn_xxx`).
- **`tenantId`** (`text`, FK referencing `tenants.id` with CASCADE delete).
- **`branchName`** (`text`, NOT NULL): Friendly branch name.
- **`location`** (`text`): Branch geographical coordinates / address.
- **`phone`** / **`email`** (`text`): Contact points.

### C. Users (`users`)
Registered operator accounts inside a tenant business.
- **`id`** (`text`, PK): Unique user identifier (e.g. `usr_xxx`).
- **`tenantId`** (`text`, FK to `tenants.id`).
- **`branchId`** (`text`, FK to `branches.id` with SET NULL delete): Assigned location.
- **`fullName`** (`text`, NOT NULL).
- **`email`** (`text`, UNIQUE, NOT NULL).
- **`passwordHash`** (`text`, NOT NULL).
- **`role`** (`text`, NOT NULL, default: `"Staff"`): `Owner` | `Manager` | `Staff`.
- **`isActive`** (`boolean`, default: `true`).

### D. Products/Items (`products`)
Unified catalog item record.
- **`id`** (`serial`, PK).
- **`tenantId`** (`text`, FK to `tenants.id`).
- **`name`** (`text`, NOT NULL): Product display name (e.g., "Front Brake Pads").
- **`sku`** (`text`, UNIQUE, NOT NULL): Stock keeping unit.
- **`itemType`** (`text`, default: `"single"`): `single` | `variant_parent` | `bundle` | `service`.
- **`unit`** (`text`, default: `"pcs"`): Unit of measure.
- **`purchasePrice`** / **`salesPrice`** (`numeric`).
- **`reorderPoint`** (`numeric`).
- **`qtyOnHand`** (`numeric`, default: `0`): Aggregated system inventory.

### E. Warehouses (`warehouses`)
Storage zones or sub-locations inside a tenant.
- **`id`** (`serial`, PK).
- **`tenantId`** (`text`, FK to `tenants.id`).
- **`name`** (`text`, NOT NULL).
- **`isActive`** (`boolean`, default: `true`).

### F. Customers (`customers`)
Standard buyer records. Contains encrypted personal fields for high privacy.
- **`id`** (`serial`, PK).
- **`tenantId`** (`text`, FK to `tenants.id`).
- **`customerType`** (`text`, default: `"Business"`).
- **`displayName`** (`text`, NOT NULL).
- **`email`** / **`workPhone`** / **`mobile`** (`text`): Encrypted utilizing AES-256-CBC.
- **`pan`** (`text`): Encrypted Tax ID number.
- **`currency`** / **`paymentTerms`** (`text`).

### G. Inventory Tracker (`inventory`)
- **`id`** (`serial`, PK).
- **`tenantId`** (`text`, FK to `tenants.id`).
- **`productId`** (`integer`, FK to `products.id`).
- **`warehouseId`** (`integer`, FK to `warehouses.id`).
- **`qtyOnHand`** (`numeric`, default: `"0"`): Physical stock quantity.

### H. Stock Movements Audit Trail (`stock_movements`)
Immutable ledger record of all inventory changes.
- **`id`** (`serial`, PK).
- **`tenantId`** (`text`, FK to `tenants.id`).
- **`productId`** / **`warehouseId`** (`integer`).
- **`movementType`** (`text`): `purchase_receipt`, `sale_shipment`, `stock_adjustment`, `warehouse_transfer_out`, etc.
- **`qty`** (`numeric`, positive for additions, negative for deductions).
- **`referenceType`** / **`referenceId`** (`text`): PO/SO trackers.

---

## 3. Data Integrity & Cascades

To safeguard against orphaned database records:
- **Tenant Cascades**: Deleting a `tenant` record immediately purges all associated records across all tables using foreign-key cascade actions.
- **Product and Warehouse Cascades**: Deleting a product or warehouse immediately purges its rows from the granular `inventory` track.
