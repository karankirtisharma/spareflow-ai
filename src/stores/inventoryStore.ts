import { create } from 'zustand';

export interface Item {
  id: string;
  name: string;
  sku: string;
  item_type: 'single' | 'variant_parent' | 'bundle' | 'service';
  unit: string;
  purchase_price: number;
  sales_price: number;
  reorder_point: number;
  qty_on_hand: number;
  is_tracked: boolean;
  created_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  is_active: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  vendor_type?: string;
  salutation?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  work_phone?: string;
  mobile?: string;
  language?: string;
  pan?: string;
  msme_registered?: boolean;
  currency?: string;
  payment_terms?: string;
  tds?: string;
  enable_portal?: boolean;
  billing_address?: string;
  shipping_address?: string;
  contact_persons?: string;
  bank_details?: string;
  custom_fields?: string;
  reporting_tags?: string;
  remarks?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  customer_type?: string;
  salutation?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  work_phone?: string;
  mobile?: string;
  language?: string;
  pan?: string;
  currency?: string;
  payment_terms?: string;
  enable_portal?: boolean;
}

export interface PurchaseOrderItem {
  id: string;
  productId: number;
  qtyOrdered: number;
  qtyReceived: number;
  unitPrice: number;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;
  vendor_name?: string;
  status: 'draft' | 'sent' | 'partially_received' | 'received' | 'billed' | 'cancelled';
  order_date: string;
  total: number;
  items?: PurchaseOrderItem[];
}

export interface SalesOrderItem {
  id: string;
  productId: number;
  qtyOrdered: number;
  qtyShipped: number;
  unitPrice: number;
}

export interface SalesOrder {
  id: string;
  so_number: string;
  customer_id: string;
  customer_name?: string;
  status: 'draft' | 'confirmed' | 'packed' | 'shipped' | 'invoiced' | 'cancelled';
  order_date: string;
  total: number;
  reference_number?: string | null;
  expected_shipment_date?: string | null;
  payment_terms?: string | null;
  delivery_method?: string | null;
  salesperson?: string | null;
  discount?: number | null;
  discount_type?: string | null;
  tax_type?: string | null;
  tax_name?: string | null;
  adjustment?: number | null;
  customer_notes?: string | null;
  terms_conditions?: string | null;
  items?: SalesOrderItem[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: number;
  productId: number;
  qty: number;
  rate: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customerId?: string | null;
  customerName?: string | null;
  orderNumber?: string | null;
  invoiceDate: string;
  terms?: string | null;
  dueDate?: string | null;
  salesperson?: string | null;
  subject?: string | null;
  status: 'draft' | 'sent' | 'unpaid' | 'overdue' | 'paid' | 'partially_paid';
  total: number;
  discount?: number | null;
  discount_type?: string | null;
  tax_type?: string | null;
  tax_name?: string | null;
  adjustment?: number | null;
  customer_notes?: string | null;
  terms_conditions?: string | null;
  items?: InvoiceItem[];
}

export interface StockMovement {
  id: string;
  productId: number;
  warehouseId: number;
  movementType: string;
  qty: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdAt: string;
}

export interface LocationInventory {
  id: string;
  productId: number;
  warehouseId: number;
  qtyOnHand: number;
  updatedAt: string;
}

export interface MoveOrderItem {
  id: string;
  productId: number;
  qty: number;
}

export interface MoveOrder {
  id: string;
  mo_number: string;
  date: string;
  warehouse_id?: number | null;
  warehouse_name?: string | null;
  assignee?: string | null;
  notes?: string | null;
  status: 'draft' | 'completed';
  items?: MoveOrderItem[];
}

export interface PutawayItem {
  id: string;
  productId: number;
  qty: number;
}

export interface Putaway {
  id: string;
  pw_number: string;
  date: string;
  warehouse_id?: number | null;
  warehouse_name?: string | null;
  assignee?: string | null;
  notes?: string | null;
  status: 'draft' | 'completed';
  items?: PutawayItem[];
}

interface InventoryState {
  items: Item[];
  warehouses: Warehouse[];
  vendors: Vendor[];
  customers: Customer[];
  purchaseOrders: PurchaseOrder[];
  salesOrders: SalesOrder[];
  stockMovements: StockMovement[];
  locationInventory: LocationInventory[];
  moveOrders: MoveOrder[];
  putaways: Putaway[];
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchItems: () => Promise<void>;
  fetchWarehouses: () => Promise<void>;
  fetchPurchaseOrders: () => Promise<void>;
  fetchSalesOrders: () => Promise<void>;
  fetchStockMovements: () => Promise<void>;
  fetchLocationInventory: () => Promise<void>;
  fetchMoveOrders: () => Promise<void>;
  fetchPutaways: () => Promise<void>;
  fetchCustomers: () => Promise<void>;
  fetchVendors: () => Promise<void>;
  fetchInvoices: () => Promise<void>;
  fetchInitialData: () => Promise<void>;
  
  // Creation / Mutation Actions
  addItem: (item: Omit<Item, 'id' | 'created_at'> & { initial_warehouse_id?: string }) => Promise<void>;
  updateItem: (id: string, item: Partial<Item>) => void;
  addWarehouse: (wh: Omit<Warehouse, 'id'>) => Promise<void>;
  addCustomer: (customer: {
    customer_type?: string;
    primary_contact_salutation?: string;
    primary_contact_first_name?: string;
    primary_contact_last_name?: string;
    company_name?: string;
    display_name: string;
    email?: string;
    work_phone?: string;
    mobile?: string;
    language?: string;
    pan?: string;
    currency?: string;
    payment_terms?: string;
    enable_portal?: boolean;
  }) => Promise<void>;
  addVendor: (vendor: {
    vendor_type?: string;
    primary_contact_salutation?: string;
    primary_contact_first_name?: string;
    primary_contact_last_name?: string;
    company_name?: string;
    display_name: string;
    email?: string;
    work_phone?: string;
    mobile?: string;
    language?: string;
    pan?: string;
    msme_registered?: boolean;
    currency?: string;
    payment_terms?: string;
    tds?: string;
    enable_portal?: boolean;
    billing_address?: string;
    shipping_address?: string;
    contact_persons?: string;
    bank_details?: string;
    custom_fields?: string;
    reporting_tags?: string;
    remarks?: string;
  }) => Promise<void>;
  
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'items'> & { items: Omit<PurchaseOrderItem, 'id' | 'qtyReceived'>[] }) => Promise<void>;
  receivePO: (poId: string, warehouseId: string, items: { product_id: number; qty_received: number }[]) => Promise<boolean>;
  
  addSalesOrder: (so: Omit<SalesOrder, 'id' | 'items'> & { items: Omit<SalesOrderItem, 'id' | 'qtyShipped'>[] }) => Promise<void>;
  shipSO: (soId: string, warehouseId: string, items: { product_id: number; qty_shipped: number }[]) => Promise<boolean>;
  updateSalesOrderStatus: (soId: string, status: string) => Promise<boolean>;
  
  adjustStock: (productId: string, warehouseId: string, qty: number, notes: string) => Promise<boolean>;
  transferStock: (productId: string, fromWarehouseId: string, toWarehouseId: string, qty: number, notes: string) => Promise<boolean>;
  addStockMovement: (mov: Omit<StockMovement, 'id' | 'createdAt'>) => void;
  addMoveOrder: (mo: Omit<MoveOrder, 'id' | 'items'> & { items: Omit<MoveOrderItem, 'id'>[] }) => Promise<void>;
  addPutaway: (pw: Omit<Putaway, 'id' | 'items'> & { items: Omit<PutawayItem, 'id'>[] }) => Promise<void>;
  addInvoice: (invoice: any) => Promise<void>;
}

// Initial Mock Data to act as fallback in case server connections are cold
const initialItems: Item[] = [
  { id: '1', name: 'Brake Pad (i20)', sku: 'BP-I20', item_type: 'single', unit: 'pcs', purchase_price: 450, sales_price: 850, reorder_point: 10, qty_on_hand: 4, is_tracked: true, created_at: new Date().toISOString() },
  { id: '2', name: 'Clutch Kit (Swift)', sku: 'CK-SW', item_type: 'single', unit: 'pcs', purchase_price: 2100, sales_price: 3500, reorder_point: 5, qty_on_hand: 12, is_tracked: true, created_at: new Date().toISOString() },
];

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: initialItems,
  warehouses: [{ id: 'w1', name: 'Main Depot - Delhi', is_active: true }],
  vendors: [{ id: 'v1', name: 'Bosch India Ltd', email: 'sales@bosch.in' }],
  customers: [
    { id: 'c1', name: 'ABC Motors', email: 'service@abcmotors.com' },
    { id: 'c2', name: 'Pioneer Garage', email: 'parts@pioneergarage.id' },
    { id: 'c3', name: 'Royal Auto Care', email: 'contact@royalautocare.com' },
    { id: 'c4', name: 'Elite Wheeled Logistics', email: 'procurement@elitewheels.co' },
    { id: 'c5', name: 'Zenith Turbochargers', email: 'support@zenithturbo.com' }
  ],
  purchaseOrders: [
    { id: 'po1', po_number: 'PO-1001', vendor_id: 'v1', status: 'draft', order_date: '2026-05-18', total: 12500 }
  ],
  salesOrders: [
    { id: 'so1', so_number: 'SO-2041', customer_id: 'c1', status: 'confirmed', order_date: '2026-05-20', total: 3400 }
  ],
  invoices: [],
  stockMovements: [],
  locationInventory: [],
  moveOrders: [],
  putaways: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    try {
      const res = await fetch('/api/v1/products');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((it: any) => ({
            id: String(it.id),
            name: it.name,
            sku: it.sku,
            item_type: it.itemType || 'single',
            unit: it.unit || 'pcs',
            purchase_price: Number(it.purchasePrice || 0),
            sales_price: Number(it.salesPrice || 0),
            reorder_point: Number(it.reorderPoint || 0),
            qty_on_hand: Number(it.qtyOnHand || 0),
            is_tracked: it.isTracked !== undefined ? it.isTracked : true,
            created_at: it.createdAt || new Date().toISOString(),
          }));
          set({ items: formatted });
        }
      }
    } catch (e) {
      console.warn("Could not fetch items from Cloud SQL:", e);
    }
  },

  fetchWarehouses: async () => {
    try {
      const res = await fetch('/api/v1/spareflow/warehouses');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((wh: any) => ({
            id: String(wh.id),
            name: wh.name,
            is_active: wh.isActive !== undefined ? wh.isActive : true,
          }));
          set({ warehouses: formatted });
        }
      }
    } catch (e) {
      console.warn("Could not fetch warehouses:", e);
    }
  },

  fetchPurchaseOrders: async () => {
    try {
      const res = await fetch('/api/v1/spareflow/purchase-orders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((po: any) => ({
            id: String(po.id),
            po_number: po.poNumber,
            vendor_id: po.vendorId || 'v1',
            vendor_name: po.vendorName || 'General Vendor',
            status: po.status || 'draft',
            order_date: po.orderDate || new Date().toISOString().split('T')[0],
            total: Number(po.total || 0),
            items: Array.isArray(po.items) ? po.items.map((pi: any) => ({
              id: String(pi.id),
              productId: pi.productId,
              qtyOrdered: Number(pi.qtyOrdered),
              qtyReceived: Number(pi.qtyReceived),
              unitPrice: Number(pi.unitPrice)
            })) : []
          }));
          set({ purchaseOrders: formatted });
        }
      }
    } catch (e) {
      console.warn("Could not fetch purchase orders:", e);
    }
  },

  fetchSalesOrders: async () => {
    try {
      const res = await fetch('/api/v1/spareflow/sales-orders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const formatted = data.map((so: any) => ({
            id: String(so.id),
            so_number: so.soNumber,
            customer_id: so.customerId || 'c1',
            customer_name: so.customerName || 'General Customer',
            status: so.status || 'draft',
            order_date: so.orderDate || new Date().toISOString().split("T")[0],
            total: Number(so.total || 0),
            reference_number: so.referenceNumber || null,
            expected_shipment_date: so.expectedShipmentDate || null,
            payment_terms: so.paymentTerms || null,
            delivery_method: so.deliveryMethod || null,
            salesperson: so.salesperson || null,
            discount: so.discount ? Number(so.discount) : 0,
            discount_type: so.discountType || '%',
            tax_type: so.taxType || 'TDS',
            tax_name: so.taxName || 'None',
            adjustment: so.adjustment ? Number(so.adjustment) : 0,
            customer_notes: so.customerNotes || '',
            terms_conditions: so.termsConditions || '',
            items: Array.isArray(so.items) ? so.items.map((si: any) => ({
              id: String(si.id),
              productId: si.productId,
              qtyOrdered: Number(si.qtyOrdered),
              qtyShipped: Number(si.qtyShipped),
              unitPrice: Number(si.unitPrice)
            })) : []
          }));
          set({ salesOrders: formatted });
        }
      }
    } catch (e) {
      console.warn("Could not fetch sales orders:", e);
    }
  },

  fetchStockMovements: async () => {
    try {
      const res = await fetch('/api/v1/spareflow/stock-movements');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const formatted = data.map((sm: any) => ({
            id: String(sm.id),
            productId: sm.productId,
            warehouseId: sm.warehouseId,
            movementType: sm.movementType,
            qty: Number(sm.qty),
            referenceType: sm.referenceType,
            referenceId: sm.referenceId,
            notes: sm.notes,
            createdAt: sm.createdAt || new Date().toISOString()
          }));
          set({ stockMovements: formatted });
        }
      }
    } catch (e) {
      console.warn("Could not fetch stock movements:", e);
    }
  },

  fetchLocationInventory: async () => {
    try {
      const res = await fetch('/api/v1/spareflow/inventory');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const formatted = data.map((li: any) => ({
            id: String(li.id),
            productId: li.productId,
            warehouseId: li.warehouseId,
            qtyOnHand: Number(li.qtyOnHand),
            updatedAt: li.updatedAt
          }));
          set({ locationInventory: formatted });
        }
      }
    } catch (e) {
      console.warn("Could not fetch location inventory levels:", e);
    }
  },

  fetchMoveOrders: async () => {
    try {
      const res = await fetch('/api/v1/spareflow/move-orders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const formatted = data.map((mo: any) => ({
            id: String(mo.id),
            mo_number: mo.moNumber,
            date: mo.date,
            warehouse_id: mo.warehouseId ? Number(mo.warehouseId) : null,
            warehouse_name: mo.warehouseName,
            assignee: mo.assignee,
            notes: mo.notes,
            status: mo.status || 'draft',
            items: Array.isArray(mo.items) ? mo.items.map((mi: any) => ({
              id: String(mi.id),
              productId: Number(mi.productId),
              qty: Number(mi.qty || 0),
            })) : []
          }));
          set({ moveOrders: formatted });
        }
      }
    } catch (e) {
      console.warn("Could not fetch move orders:", e);
    }
  },

  fetchPutaways: async () => {
    try {
      const res = await fetch('/api/v1/spareflow/putaways');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const formatted = data.map((pw: any) => ({
            id: String(pw.id),
            pw_number: pw.pwNumber,
            date: pw.date,
            warehouse_id: pw.warehouseId ? Number(pw.warehouseId) : null,
            warehouse_name: pw.warehouseName,
            assignee: pw.assignee,
            notes: pw.notes,
            status: pw.status || 'draft',
            items: Array.isArray(pw.items) ? pw.items.map((pi: any) => ({
              id: String(pi.id),
              productId: Number(pi.productId),
              qty: Number(pi.qty || 0),
            })) : []
          }));
          set({ putaways: formatted });
        }
      }
    } catch (e) {
      console.warn("Could not fetch putaways:", e);
    }
  },

  fetchCustomers: async () => {
    try {
      const res = await fetch('/api/v1/spareflow/customers');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const formatted = data.map((c: any) => ({
            id: String(c.id),
            name: c.displayName,
            email: c.email || '',
            customer_type: c.customerType || 'Business',
            salutation: c.primaryContactSalutation || '',
            first_name: c.primaryContactFirstName || '',
            last_name: c.primaryContactLastName || '',
            company_name: c.companyName || '',
            work_phone: c.workPhone || '',
            mobile: c.mobile || '',
            language: c.language || 'English',
            pan: c.pan || '',
            currency: c.currency || 'INR- Indian Rupee',
            payment_terms: c.paymentTerms || 'Due on Receipt',
            enable_portal: !!c.enablePortal
          }));
          set({ customers: formatted });
        }
      }
    } catch (e) {
      console.warn("Could not fetch customers:", e);
    }
  },

  fetchVendors: async () => {
    try {
      const res = await fetch('/api/v1/spareflow/vendors');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const formatted = data.map((v: any) => ({
            id: String(v.id),
            name: v.displayName,
            email: v.email || '',
            vendor_type: v.vendorType || 'Business',
            salutation: v.primaryContactSalutation || '',
            first_name: v.primaryContactFirstName || '',
            last_name: v.primaryContactLastName || '',
            company_name: v.companyName || '',
            work_phone: v.workPhone || '',
            mobile: v.mobile || '',
            language: v.language || 'English',
            pan: v.pan || '',
            msme_registered: !!v.msmeRegistered,
            currency: v.currency || 'INR- Indian Rupee',
            payment_terms: v.paymentTerms || 'Due on Receipt',
            tds: v.tds || '',
            enable_portal: !!v.enablePortal,
            billing_address: v.billingAddress || '',
            shipping_address: v.shippingAddress || '',
            contact_persons: v.contactPersons || '',
            bank_details: v.bankDetails || '',
            custom_fields: v.customFields || '',
            reporting_tags: v.reportingTags || '',
            remarks: v.remarks || ''
          }));
          set({ vendors: formatted });
        }
      }
    } catch (e) {
      console.warn("Could not fetch vendors:", e);
    }
  },

  fetchInvoices: async () => {
    try {
      const res = await fetch('/api/v1/spareflow/invoices');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const formatted = data.map((inv: any) => ({
            id: String(inv.id),
            invoice_number: inv.invoiceNumber,
            customerId: inv.customerId || '',
            customerName: inv.customerName || 'General Customer',
            orderNumber: inv.orderNumber || '',
            invoiceDate: inv.invoiceDate || new Date().toISOString().split("T")[0],
            terms: inv.terms || 'Due on Receipt',
            dueDate: inv.dueDate || '',
            salesperson: inv.salesperson || '',
            subject: inv.subject || '',
            status: inv.status || 'draft',
            total: Number(inv.total || 0),
            discount: inv.discount ? Number(inv.discount) : 0,
            discount_type: inv.discountType || '%',
            tax_type: inv.taxType || 'TDS',
            tax_name: inv.taxName || 'None',
            adjustment: inv.adjustment ? Number(inv.adjustment) : 0,
            customer_notes: inv.customerNotes || '',
            terms_conditions: inv.termsConditions || '',
            items: Array.isArray(inv.items) ? inv.items.map((ii: any) => ({
              id: String(ii.id),
              productId: ii.productId,
              qty: Number(ii.qty),
              rate: Number(ii.rate)
            })) : []
          }));
          set({ invoices: formatted });
        }
      }
    } catch (e) {
      console.warn("Could not fetch invoices:", e);
    }
  },

  fetchInitialData: async () => {
    set({ isLoading: true });
    await Promise.all([
      get().fetchItems(),
      get().fetchWarehouses(),
      get().fetchPurchaseOrders(),
      get().fetchSalesOrders(),
      get().fetchStockMovements(),
      get().fetchLocationInventory(),
      get().fetchMoveOrders(),
      get().fetchPutaways(),
      get().fetchCustomers(),
      get().fetchVendors(),
      get().fetchInvoices()
    ]);
    set({ isLoading: false });
  },

  addItem: async (item) => {
    try {
      const res = await fetch('/api/v1/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        await get().fetchItems();
        await get().fetchLocationInventory();
        await get().fetchStockMovements();
      }
    } catch (e) {
      console.error(e);
    }
  },
  
  updateItem: (id, update) => set((state) => ({
    items: state.items.map(i => i.id === id ? { ...i, ...update } : i)
  })),

  addWarehouse: async (wh) => {
    try {
      const res = await fetch('/api/v1/spareflow/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wh),
      });
      if (res.ok) {
        await get().fetchWarehouses();
      }
    } catch (e) {
      console.error(e);
    }
  },

  addCustomer: async (customer) => {
    try {
      const res = await fetch('/api/v1/spareflow/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      });
      if (res.ok) {
        await get().fetchCustomers();
      }
    } catch (e) {
      console.error(e);
    }
  },

  addVendor: async (vendor) => {
    try {
      const res = await fetch('/api/v1/spareflow/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendor),
      });
      if (res.ok) {
        await get().fetchVendors();
      }
    } catch (e) {
      console.error(e);
    }
  },

  addPurchaseOrder: async (po) => {
    try {
      const payload = {
        po_number: po.po_number,
        vendor_id: po.vendor_id,
        vendor_name: po.vendor_name,
        order_date: po.order_date,
        status: po.status,
        total: po.total,
        items: po.items.map(pi => ({
          product_id: pi.productId,
          qty_ordered: pi.qtyOrdered,
          unit_price: pi.unitPrice
        }))
      };

      const res = await fetch('/api/v1/spareflow/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await get().fetchPurchaseOrders();
      }
    } catch (e) {
      console.error(e);
    }
  },

  receivePO: async (poId, warehouseId, items) => {
    try {
      const res = await fetch(`/api/v1/spareflow/purchase-orders/${poId}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warehouse_id: Number(warehouseId), items }),
      });
      if (res.ok) {
        await get().fetchPurchaseOrders();
        await get().fetchItems();
        await get().fetchLocationInventory();
        await get().fetchStockMovements();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  addSalesOrder: async (so) => {
    try {
      const payload = {
        so_number: so.so_number,
        customer_id: so.customer_id,
        customer_name: so.customer_name,
        order_date: so.order_date,
        status: so.status,
        total: so.total,
        reference_number: so.reference_number,
        expected_shipment_date: so.expected_shipment_date,
        payment_terms: so.payment_terms,
        delivery_method: so.delivery_method,
        salesperson: so.salesperson,
        discount: so.discount,
        discount_type: so.discount_type,
        tax_type: so.tax_type,
        tax_name: so.tax_name,
        adjustment: so.adjustment,
        customer_notes: so.customer_notes,
        terms_conditions: so.terms_conditions,
        items: so.items.map(si => ({
          product_id: si.productId,
          qty_ordered: si.qtyOrdered,
          unit_price: si.unitPrice
        }))
      };

      const res = await fetch('/api/v1/spareflow/sales-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await get().fetchSalesOrders();
      }
    } catch (e) {
      console.error(e);
    }
  },

  shipSO: async (soId, warehouseId, items) => {
    try {
      const res = await fetch(`/api/v1/spareflow/sales-orders/${soId}/ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warehouse_id: Number(warehouseId), items }),
      });
      if (res.ok) {
        await get().fetchSalesOrders();
        await get().fetchItems();
        await get().fetchLocationInventory();
        await get().fetchStockMovements();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  updateSalesOrderStatus: async (soId, status) => {
    try {
      const res = await fetch(`/api/v1/spareflow/sales-orders/${soId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await get().fetchSalesOrders();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  adjustStock: async (productId, warehouseId, qty, notes) => {
    try {
      const res = await fetch('/api/v1/spareflow/stock-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: Number(productId),
          warehouse_id: Number(warehouseId),
          qty,
          notes
        }),
      });
      if (res.ok) {
        await get().fetchItems();
        await get().fetchLocationInventory();
        await get().fetchStockMovements();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  transferStock: async (productId, fromWarehouseId, toWarehouseId, qty, notes) => {
    try {
      const res = await fetch('/api/v1/spareflow/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: Number(productId),
          from_warehouse_id: Number(fromWarehouseId),
          to_warehouse_id: Number(toWarehouseId),
          qty,
          notes
        }),
      });
      if (res.ok) {
        await get().fetchLocationInventory();
        await get().fetchStockMovements();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  addStockMovement: (mov) => set((state) => ({
    stockMovements: [{ ...mov, id: Math.random().toString(), createdAt: new Date().toISOString() } as any, ...state.stockMovements]
  })),

  addMoveOrder: async (mo) => {
    try {
      const payload = {
        mo_number: mo.mo_number,
        date: mo.date,
        warehouse_id: mo.warehouse_id,
        warehouse_name: mo.warehouse_name,
        assignee: mo.assignee,
        notes: mo.notes,
        status: mo.status,
        items: mo.items.map(mi => ({
          product_id: mi.productId,
          qty: mi.qty
        }))
      };

      const res = await fetch('/api/v1/spareflow/move-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await get().fetchMoveOrders();
        await get().fetchStockMovements();
        await get().fetchLocationInventory();
      }
    } catch (e) {
      console.error(e);
    }
  },

  addPutaway: async (pw) => {
    try {
      const payload = {
        pw_number: pw.pw_number,
        date: pw.date,
        warehouse_id: pw.warehouse_id,
        warehouse_name: pw.warehouse_name,
        assignee: pw.assignee,
        notes: pw.notes,
        status: pw.status,
        items: pw.items.map(pi => ({
          product_id: pi.productId,
          qty: pi.qty
        }))
      };

      const res = await fetch('/api/v1/spareflow/putaways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await get().fetchPutaways();
        await get().fetchStockMovements();
        await get().fetchLocationInventory();
        await get().fetchItems(); // Quantity on hand might have changed
      }
    } catch (e) {
      console.error(e);
    }
  },

  addInvoice: async (inv) => {
    try {
      const payload = {
        invoice_number: inv.invoice_number,
        customer_id: inv.customer_id,
        customer_name: inv.customer_name,
        order_number: inv.order_number,
        invoice_date: inv.invoice_date,
        terms: inv.terms,
        due_date: inv.due_date,
        salesperson: inv.salesperson,
        subject: inv.subject,
        status: inv.status,
        total: inv.total,
        discount: inv.discount,
        discount_type: inv.discount_type,
        tax_type: inv.tax_type,
        tax_name: inv.tax_name,
        adjustment: inv.adjustment,
        customer_notes: inv.customer_notes,
        terms_conditions: inv.terms_conditions,
        items: inv.items.map(ii => ({
          product_id: ii.productId,
          qty: ii.qty,
          rate: ii.rate
        }))
      };

      const res = await fetch('/api/v1/spareflow/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await get().fetchInvoices();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create invoice");
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}));
