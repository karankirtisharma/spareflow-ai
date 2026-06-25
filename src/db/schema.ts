import { pgTable, serial, text, timestamp, numeric, boolean, integer, uuid } from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: text("id").primaryKey(), // Using text to match tenant_id like 'tnt_xxxx'
  businessName: text("business_name").notNull(),
  businessType: text("business_type").notNull(),
  plan: text("plan").default("free"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const branches = pgTable("branches", {
  id: text("id").primaryKey(), // Using text for branch_id like 'brn_xxxx'
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  branchName: text("branch_name").notNull(),
  location: text("location"),
  phone: text("phone"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Using text for user_id like 'usr_xxxx'
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  branchId: text("branch_id").references(() => branches.id, { onDelete: "set null" }),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").default("Staff").notNull(), // Owner, Manager, Staff
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UserRecord = typeof users.$inferSelect;

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  itemType: text("item_type").notNull().default("single"), // single | variant_parent | bundle | service
  unit: text("unit").notNull().default("pcs"),
  purchasePrice: numeric("purchase_price", { precision: 18, scale: 6 }),
  salesPrice: numeric("sales_price", { precision: 18, scale: 6 }),
  reorderPoint: numeric("reorder_point", { precision: 18, scale: 4 }),
  qtyOnHand: numeric("qty_on_hand", { precision: 18, scale: 4 }).default("0"), // to hold overall sum or backward compatibility
  isTracked: boolean("is_tracked").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Alias for backward compatibility
export const items = products;

export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  customerType: text("customer_type").default("Business"),
  primaryContactSalutation: text("primary_contact_salutation"),
  primaryContactFirstName: text("primary_contact_first_name"),
  primaryContactLastName: text("primary_contact_last_name"),
  companyName: text("company_name"),
  displayName: text("display_name").notNull(),
  email: text("email"),
  workPhone: text("work_phone"),
  mobile: text("mobile"),
  language: text("language").default("English"),
  pan: text("pan"),
  currency: text("currency").default("INR- Indian Rupee"),
  paymentTerms: text("payment_terms").default("Due on Receipt"),
  enablePortal: boolean("enable_portal").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  vendorType: text("vendor_type").default("Business"),
  primaryContactSalutation: text("primary_contact_salutation"),
  primaryContactFirstName: text("primary_contact_first_name"),
  primaryContactLastName: text("primary_contact_last_name"),
  companyName: text("company_name"),
  displayName: text("display_name").notNull(),
  email: text("email"),
  workPhone: text("work_phone"),
  mobile: text("mobile"),
  language: text("language").default("English"),
  pan: text("pan"),
  msmeRegistered: boolean("msme_registered").default(false),
  currency: text("currency").default("INR- Indian Rupee"),
  paymentTerms: text("payment_terms").default("Due on Receipt"),
  tds: text("tds"),
  enablePortal: boolean("enable_portal").default(false),
  billingAddress: text("billing_address"),
  shippingAddress: text("shipping_address"),
  contactPersons: text("contact_persons"),
  bankDetails: text("bank_details"),
  customFields: text("custom_fields"),
  reportingTags: text("reporting_tags"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Detailed multi-location inventory tracker (qty of product P in warehouse W)
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  warehouseId: integer("warehouse_id").references(() => warehouses.id, { onDelete: "cascade" }).notNull(),
  qtyOnHand: numeric("qty_on_hand", { precision: 18, scale: 4 }).default("0").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Absolute single source of truth for stock transaction audit trail
export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  warehouseId: integer("warehouse_id").references(() => warehouses.id, { onDelete: "cascade" }).notNull(),
  movementType: text("movement_type").notNull(), // purchase_receipt | sale_shipment | stock_adjustment | warehouse_transfer_out | warehouse_transfer_in | sales_return | purchase_return
  qty: numeric("qty", { precision: 18, scale: 4 }).notNull(), // positive for additions, negative for deductions
  referenceType: text("reference_type"), // purchase_order | sales_order | stock_adjustment | warehouse_transfer
  referenceId: text("reference_id"), // ID or tracking code (e.g. "PO-1001", "SO-2041")
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  poNumber: text("po_number").notNull().unique(),
  vendorId: text("vendor_id"),
  vendorName: text("vendor_name"),
  status: text("status").notNull().default("draft"), // draft | sent | partially_received | received | billed | cancelled
  orderDate: text("order_date"),
  total: numeric("total", { precision: 18, scale: 6 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  purchaseOrderId: integer("purchase_order_id").references(() => purchaseOrders.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  qtyOrdered: numeric("qty_ordered", { precision: 18, scale: 4 }).notNull(),
  qtyReceived: numeric("qty_received", { precision: 18, scale: 4 }).default("0").notNull(),
  unitPrice: numeric("unit_price", { precision: 18, scale: 6 }).notNull(),
});

export const salesOrders = pgTable("sales_orders", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  soNumber: text("so_number").notNull().unique(),
  customerId: text("customer_id"),
  customerName: text("customer_name"),
  status: text("status").notNull().default("draft"), // draft | confirmed | packed | shipped | invoiced | cancelled
  orderDate: text("order_date"),
  total: numeric("total", { precision: 18, scale: 6 }),
  referenceNumber: text("reference_number"),
  expectedShipmentDate: text("expected_shipment_date"),
  paymentTerms: text("payment_terms"),
  deliveryMethod: text("delivery_method"),
  salesperson: text("salesperson"),
  discount: numeric("discount", { precision: 18, scale: 4 }),
  discountType: text("discount_type"),
  taxType: text("tax_type"),
  taxName: text("tax_name"),
  adjustment: numeric("adjustment", { precision: 18, scale: 4 }),
  customerNotes: text("customer_notes"),
  termsConditions: text("terms_conditions"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const salesOrderItems = pgTable("sales_order_items", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  salesOrderId: integer("sales_order_id").references(() => salesOrders.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  qtyOrdered: numeric("qty_ordered", { precision: 18, scale: 4 }).notNull(),
  qtyShipped: numeric("qty_shipped", { precision: 18, scale: 4 }).default("0").notNull(),
  unitPrice: numeric("unit_price", { precision: 18, scale: 6 }).notNull(),
});

export const moveOrders = pgTable("move_orders", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  moNumber: text("mo_number").notNull().unique(),
  date: text("date").notNull(),
  warehouseId: integer("warehouse_id").references(() => warehouses.id, { onDelete: "cascade" }),
  warehouseName: text("warehouse_name"),
  assignee: text("assignee"),
  notes: text("notes"),
  status: text("status").notNull().default("draft"), // draft | completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const moveOrderItems = pgTable("move_order_items", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  moveOrderId: integer("move_order_id").references(() => moveOrders.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  qty: numeric("qty", { precision: 18, scale: 4 }).notNull(),
});

export const putaways = pgTable("putaways", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  pwNumber: text("pw_number").notNull().unique(),
  date: text("date").notNull(),
  warehouseId: integer("warehouse_id").references(() => warehouses.id, { onDelete: "cascade" }),
  warehouseName: text("warehouse_name"),
  assignee: text("assignee"),
  notes: text("notes"),
  status: text("status").notNull().default("draft"), // draft | completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const putawayItems = pgTable("putaway_items", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  putawayId: integer("putaway_id").references(() => putaways.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  qty: numeric("qty", { precision: 18, scale: 4 }).notNull(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerId: text("customer_id"),
  customerName: text("customer_name"),
  orderNumber: text("order_number"),
  invoiceDate: text("invoice_date").notNull(),
  terms: text("terms"),
  dueDate: text("due_date"),
  salesperson: text("salesperson"),
  subject: text("subject"),
  status: text("status").notNull().default("draft"), // draft | sent | unpaid | overdue | paid | partially_paid
  total: numeric("total", { precision: 18, scale: 6 }).notNull(),
  discount: numeric("discount", { precision: 18, scale: 4 }),
  discountType: text("discount_type").default("%"),
  taxType: text("tax_type").default("TDS"),
  taxName: text("tax_name").default("None"),
  adjustment: numeric("adjustment", { precision: 18, scale: 4 }),
  customerNotes: text("customer_notes"),
  termsConditions: text("terms_conditions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  invoiceId: integer("invoice_id").references(() => invoices.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  qty: numeric("qty", { precision: 18, scale: 4 }).notNull(),
  rate: numeric("rate", { precision: 18, scale: 6 }).notNull(),
});
