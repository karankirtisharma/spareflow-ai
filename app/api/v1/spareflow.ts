import { Router, Response } from "express";
import { db } from "../../../src/db/index.js";
import { 
  products, 
  warehouses, 
  customers,
  vendors,
  inventory, 
  stockMovements, 
  purchaseOrders, 
  purchaseOrderItems, 
  salesOrders, 
  salesOrderItems,
  moveOrders,
  moveOrderItems,
  putaways,
  putawayItems,
  invoices,
  invoiceItems
} from "../../../src/db/schema.js";
import { desc, eq, and } from "drizzle-orm";
import { authenticateUser, requireManager, AuthenticatedRequest } from "../../middleware/rbac.js";
import { sendSuccess, sendError } from "../../core/response.js";
import { encrypt, decrypt } from "../../core/encryption.js";

const router = Router();

// Enforce authentication globally on all inventory & stock management endpoints
router.use(authenticateUser as any);

// Help function: update global cumulative qty on hand for a product (run inside tx)
async function syncGlobalQty(tx: any, tenantId: string, productId: number) {
  const locStocks = await tx.select().from(inventory).where(
    and(
      eq(inventory.tenantId, tenantId),
      eq(inventory.productId, productId)
    )
  );
  const total = locStocks.reduce((sum: number, item: any) => sum + Number(item.qtyOnHand || 0), 0);
  await tx.update(products)
    .set({ qtyOnHand: String(total) })
    .where(
      and(
        eq(products.tenantId, tenantId),
        eq(products.id, productId)
      )
    );
}

// Help function: handle stock addition/deduction at a warehouse & log movement (run inside tx)
async function recordStockTransaction(
  tx: any,
  tenantId: string,
  productId: number,
  warehouseId: number,
  qtyChange: number,
  movementType: string,
  referenceType?: string,
  referenceId?: string,
  notes?: string
) {
  // 1. Log stock movement audit trail
  await tx.insert(stockMovements).values({
    tenantId,
    productId,
    warehouseId,
    movementType,
    qty: String(qtyChange),
    referenceType,
    referenceId,
    notes
  });

  // 2. Update warehouse inventory record
  const existing = await tx.select().from(inventory).where(
    and(
      eq(inventory.tenantId, tenantId),
      eq(inventory.productId, productId),
      eq(inventory.warehouseId, warehouseId)
    )
  );

  if (existing.length > 0) {
    const currentQty = Number(existing[0].qtyOnHand || 0);
    const newQty = Math.max(0, currentQty + qtyChange);
    await tx.update(inventory)
      .set({ qtyOnHand: String(newQty), updatedAt: new Date() })
      .where(
        and(
          eq(inventory.tenantId, tenantId),
          eq(inventory.id, existing[0].id)
        )
      );
  } else {
    const initialQty = Math.max(0, qtyChange);
    await tx.insert(inventory).values({
      tenantId,
      productId,
      warehouseId,
      qtyOnHand: String(initialQty),
      updatedAt: new Date()
    });
  }

  // 3. Sync cumulative global quantity
  await syncGlobalQty(tx, tenantId, productId);
}


// --- Products / Items APIs ---
router.get("/items", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const list = await db.select().from(products)
      .where(eq(products.tenantId, tenantId))
      .orderBy(desc(products.id));
    return sendSuccess(res, list, "Fetched items successfully");
  } catch (error: any) {
    console.error("Failed to query items:", error);
    return sendError(res, "Failed to fetch items from the database", 500);
  }
});

router.post("/items", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { name, sku, item_type, unit, purchase_price, sales_price, reorder_point, qty_on_hand, initial_warehouse_id } = req.body;
    
    if (!name || !sku) {
      return sendError(res, "Item name and SKU are required.", 400);
    }

    const result = await db.transaction(async (tx) => {
      // Check SKU unique
      const existing = await tx.select().from(products).where(
        and(
          eq(products.tenantId, tenantId),
          eq(products.sku, sku)
        )
      ).limit(1);

      if (existing.length > 0) {
        throw new Error("An item with this SKU already exists.");
      }

      const newItem = await tx.insert(products)
        .values({
          tenantId,
          name,
          sku,
          itemType: item_type || "single",
          unit: unit || "pcs",
          purchasePrice: purchase_price ? String(purchase_price) : "0",
          salesPrice: sales_price ? String(sales_price) : "0",
          reorderPoint: reorder_point ? String(reorder_point) : "0",
          qtyOnHand: "0",
          isTracked: true,
        })
        .returning();

      const productRecord = newItem[0];

      // If an initial quantities is received and warehouse specified, log initial receipt
      const initialQtyNum = Number(qty_on_hand || 0);
      const whIdNum = Number(initial_warehouse_id);

      if (initialQtyNum > 0 && whIdNum) {
        // Validate warehouse exists and belongs to the tenant
        const whCheck = await tx.select().from(warehouses).where(
          and(
            eq(warehouses.tenantId, tenantId),
            eq(warehouses.id, whIdNum)
          )
        ).limit(1);
        if (whCheck.length === 0) {
          throw new Error("Initial warehouse does not exist or belong to this tenant.");
        }

        await recordStockTransaction(
          tx,
          tenantId,
          productRecord.id,
          whIdNum,
          initialQtyNum,
          "stock_adjustment",
          "stock_adjustment",
          "INITIAL",
          "Initial stock configuration on creation"
        );
      }

      // Send final item with latest sync
      const finalItemQuery = await tx.select().from(products).where(
        and(
          eq(products.tenantId, tenantId),
          eq(products.id, productRecord.id)
        )
      ).limit(1);

      return finalItemQuery[0];
    });

    return sendSuccess(res, result, "Item created successfully", 201);
  } catch (error: any) {
    console.error("Failed to insert item:", error);
    return sendError(res, error.message || "Failed to create item in the database", 500);
  }
});


// --- Warehouses APIs ---
router.get("/warehouses", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const list = await db.select().from(warehouses)
      .where(eq(warehouses.tenantId, tenantId))
      .orderBy(desc(warehouses.id));
    return sendSuccess(res, list, "Fetched warehouses successfully");
  } catch (error: any) {
    console.error("Failed to query warehouses:", error);
    return sendError(res, "Failed to fetch warehouses", 500);
  }
});

router.post("/warehouses", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { name, is_active } = req.body;
    if (!name) {
      return sendError(res, "Warehouse name is required.", 400);
    }

    const newWh = await db.insert(warehouses)
      .values({
        tenantId,
        name,
        isActive: is_active !== undefined ? is_active : true,
      })
      .returning();

    return sendSuccess(res, newWh[0], "Warehouse created successfully", 201);
  } catch (error: any) {
    console.error("Failed to insert warehouse:", error);
    return sendError(res, "Failed to create warehouse", 500);
  }
});


// --- Customers APIs ---
function decryptCustomer(cust: any) {
  if (!cust) return cust;
  return {
    ...cust,
    email: decrypt(cust.email),
    workPhone: decrypt(cust.workPhone),
    mobile: decrypt(cust.mobile),
    pan: decrypt(cust.pan)
  };
}

router.get("/customers", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    let list = await db.select().from(customers)
      .where(eq(customers.tenantId, tenantId))
      .orderBy(desc(customers.id));

    if (list.length === 0) {
      const defaults = [
        { tenantId, displayName: "ABC Motors", email: encrypt("service@abcmotors.com"), companyName: "ABC Motors", customerType: "Business" },
        { tenantId, displayName: "Pioneer Garage", email: encrypt("parts@pioneergarage.id"), companyName: "Pioneer Garage", customerType: "Business" },
        { tenantId, displayName: "Royal Auto Care", email: encrypt("contact@royalautocare.com"), companyName: "Royal Auto Care", customerType: "Business" },
        { tenantId, displayName: "Elite Wheeled Logistics", email: encrypt("procurement@elitewheels.co"), companyName: "Elite Wheeled Logistics", customerType: "Business" },
        { tenantId, displayName: "Zenith Turbochargers", email: encrypt("support@zenithturbo.com"), companyName: "Zenith Turbochargers", customerType: "Business" }
      ];
      await db.insert(customers).values(defaults);
      list = await db.select().from(customers)
        .where(eq(customers.tenantId, tenantId))
        .orderBy(desc(customers.id));
    }
    const decryptedList = list.map(decryptCustomer);
    return sendSuccess(res, decryptedList, "Fetched customers successfully");
  } catch (error: any) {
    console.error("Failed to query customers:", error);
    return sendError(res, "Failed to fetch customers from the database", 500);
  }
});

router.post("/customers", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { 
      customer_type, 
      primary_contact_salutation, 
      primary_contact_first_name, 
      primary_contact_last_name, 
      company_name, 
      display_name, 
      email, 
      work_phone, 
      mobile, 
      language, 
      pan, 
      currency, 
      payment_terms, 
      enable_portal 
    } = req.body;

    if (!display_name) {
      return sendError(res, "Display name is required.", 400);
    }

    const newCust = await db.insert(customers)
      .values({
        tenantId,
        customerType: customer_type || "Business",
        primaryContactSalutation: primary_contact_salutation || null,
        primaryContactFirstName: primary_contact_first_name || null,
        primaryContactLastName: primary_contact_last_name || null,
        companyName: company_name || null,
        displayName: display_name,
        email: email ? encrypt(email) : null,
        workPhone: work_phone ? encrypt(work_phone) : null,
        mobile: mobile ? encrypt(mobile) : null,
        language: language || "English",
        pan: pan ? encrypt(pan) : null,
        currency: currency || "INR- Indian Rupee",
        paymentTerms: payment_terms || "Due on Receipt",
        enablePortal: !!enable_portal,
      })
      .returning();

    return sendSuccess(res, decryptCustomer(newCust[0]), "Customer created successfully", 201);
  } catch (error: any) {
    console.error("Failed to insert customer:", error);
    return sendError(res, "Failed to create customer", 500);
  }
});


// --- Vendors APIs ---
function decryptVendor(vend: any) {
  if (!vend) return vend;
  return {
    ...vend,
    email: decrypt(vend.email),
    workPhone: decrypt(vend.workPhone),
    mobile: decrypt(vend.mobile),
    pan: decrypt(vend.pan)
  };
}

router.get("/vendors", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    let list = await db.select().from(vendors)
      .where(eq(vendors.tenantId, tenantId))
      .orderBy(desc(vendors.id));

    if (list.length === 0) {
      const defaults = [
        { tenantId, displayName: "Bosch India Spares", email: encrypt("bosch@india-spares.com"), companyName: "Bosch India Spares", vendorType: "Business", currency: "INR- Indian Rupee", paymentTerms: "Net 30" },
        { tenantId, displayName: "Lucas TVS Distributor", email: encrypt("orders@lucastvs-dist.co"), companyName: "Lucas TVS Distributor", vendorType: "Business", currency: "INR- Indian Rupee", paymentTerms: "Due on Receipt" },
        { tenantId, displayName: "Brembo Premium Linings", email: encrypt("procurement@brembo.in"), companyName: "Brembo Premium Linings", vendorType: "Business", currency: "INR- Indian Rupee", paymentTerms: "Net 15" },
        { tenantId, displayName: "TVS Girling Hydraulics", email: encrypt("tvs@girling-hydraulics.com"), companyName: "TVS Girling Hydraulics", vendorType: "Business", currency: "INR- Indian Rupee", paymentTerms: "Net 45" },
        { tenantId, displayName: "Gabriel Suspension Ltd", email: encrypt("suspension@gabriel.in"), companyName: "Gabriel Suspension Ltd", vendorType: "Business", currency: "INR- Indian Rupee", paymentTerms: "Net 60" }
      ];
      await db.insert(vendors).values(defaults);
      list = await db.select().from(vendors)
        .where(eq(vendors.tenantId, tenantId))
        .orderBy(desc(vendors.id));
    }
    const decryptedList = list.map(decryptVendor);
    return sendSuccess(res, decryptedList, "Fetched vendors successfully");
  } catch (error: any) {
    console.error("Failed to query vendors:", error);
    return sendError(res, "Failed to fetch vendors from the database", 500);
  }
});

router.post("/vendors", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { 
      vendor_type, 
      primary_contact_salutation, 
      primary_contact_first_name, 
      primary_contact_last_name, 
      company_name, 
      display_name, 
      email, 
      work_phone, 
      mobile, 
      language, 
      pan, 
      msme_registered,
      currency, 
      payment_terms, 
      tds,
      enable_portal,
      billing_address,
      shipping_address,
      contact_persons,
      bank_details,
      custom_fields,
      reporting_tags,
      remarks
    } = req.body;

    if (!display_name) {
      return sendError(res, "Display name is required.", 400);
    }

    const newVend = await db.insert(vendors)
      .values({
        tenantId,
        vendorType: vendor_type || "Business",
        primaryContactSalutation: primary_contact_salutation || null,
        primaryContactFirstName: primary_contact_first_name || null,
        primaryContactLastName: primary_contact_last_name || null,
        companyName: company_name || null,
        displayName: display_name,
        email: email ? encrypt(email) : null,
        workPhone: work_phone ? encrypt(work_phone) : null,
        mobile: mobile ? encrypt(mobile) : null,
        language: language || "English",
        pan: pan ? encrypt(pan) : null,
        msmeRegistered: !!msme_registered,
        currency: currency || "INR- Indian Rupee",
        paymentTerms: payment_terms || "Due on Receipt",
        tds: tds || null,
        enablePortal: !!enable_portal,
        billingAddress: billing_address || null,
        shippingAddress: shipping_address || null,
        contactPersons: contact_persons || null,
        bankDetails: bank_details || null,
        customFields: custom_fields || null,
        reportingTags: reporting_tags || null,
        remarks: remarks || null
      })
      .returning();

    return sendSuccess(res, decryptVendor(newVend[0]), "Vendor created successfully", 201);
  } catch (error: any) {
    console.error("Failed to insert vendor:", error);
    return sendError(res, "Failed to create vendor", 500);
  }
});


// --- Multi-location Inventory Levels ---
router.get("/inventory", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const currentLocStocks = await db.select().from(inventory)
      .where(eq(inventory.tenantId, tenantId));
    return sendSuccess(res, currentLocStocks, "Fetched inventory levels successfully");
  } catch (error: any) {
    console.error("Failed to fetch multi-location inventory levels:", error);
    return sendError(res, "Failed to fetch inventory levels", 500);
  }
});


// --- Stock Movement Log ---
router.get("/stock-movements", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const list = await db.select().from(stockMovements)
      .where(eq(stockMovements.tenantId, tenantId))
      .orderBy(desc(stockMovements.id));
    return sendSuccess(res, list, "Fetched stock movements successfully");
  } catch (error: any) {
    console.error("Failed to query stock movements:", error);
    return sendError(res, "Failed to fetch stock movements", 500);
  }
});

// Create manual Stock Adjustment
router.post("/stock-movements", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { product_id, warehouse_id, qty, notes } = req.body;

    const pId = Number(product_id);
    const whId = Number(warehouse_id);
    const delta = Number(qty);

    if (!pId || !whId || isNaN(delta)) {
      return sendError(res, "Product ID, Warehouse ID, and Qty change are required.", 400);
    }

    await db.transaction(async (tx) => {
      // Validate product
      const productCheck = await tx.select().from(products).where(
        and(
          eq(products.tenantId, tenantId),
          eq(products.id, pId)
        )
      ).limit(1);
      if (productCheck.length === 0) {
        throw new Error("Product does not exist or belong to this tenant.");
      }

      // Validate warehouse
      const whCheck = await tx.select().from(warehouses).where(
        and(
          eq(warehouses.tenantId, tenantId),
          eq(warehouses.id, whId)
        )
      ).limit(1);
      if (whCheck.length === 0) {
        throw new Error("Warehouse does not exist or belong to this tenant.");
      }

      await recordStockTransaction(
        tx,
        tenantId,
        pId,
        whId,
        delta,
        "stock_adjustment",
        "stock_adjustment",
        "MANUAL",
        notes || "Manual stock adjustment"
      );
    });

    return sendSuccess(res, { success: true }, "Stock adjusted successfully");
  } catch (error: any) {
    console.error("Failed to execute stock adjustment:", error);
    return sendError(res, error.message || "Failed to adjust stock", 500);
  }
});


// --- Purchase Orders with detailed items ---
router.get("/purchase-orders", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const orders = await db.select().from(purchaseOrders)
      .where(eq(purchaseOrders.tenantId, tenantId))
      .orderBy(desc(purchaseOrders.id));
    
    // Nest line items inside
    const result = [];
    for (const po of orders) {
      const items = await db.select().from(purchaseOrderItems).where(
        and(
          eq(purchaseOrderItems.tenantId, tenantId),
          eq(purchaseOrderItems.purchaseOrderId, po.id)
        )
      );
      result.push({
        ...po,
        items
      });
    }
    return sendSuccess(res, result, "Fetched purchase orders successfully");
  } catch (error: any) {
    console.error("Failed to fetch detailed POs:", error);
    return sendError(res, "Failed to fetch purchase orders", 500);
  }
});

router.post("/purchase-orders", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { po_number, vendor_id, vendor_name, order_date, status, total, items: pItems } = req.body;
    
    if (!po_number) {
      return sendError(res, "Purchase order number is required.", 400);
    }

    const result = await db.transaction(async (tx) => {
      // Create PO header
      const newPO = await tx.insert(purchaseOrders)
        .values({
          tenantId,
          poNumber: po_number,
          vendorId: vendor_id,
          vendorName: vendor_name,
          status: status || "draft",
          orderDate: order_date || new Date().toISOString().split("T")[0],
          total: total ? String(total) : "0",
        })
        .returning();

      const poId = newPO[0].id;

      // Add PO Line Items if supplied
      if (Array.isArray(pItems)) {
        for (const pItem of pItems) {
          // Validate product belongs to tenant
          const prodId = Number(pItem.product_id);
          const prodCheck = await tx.select().from(products).where(
            and(
              eq(products.tenantId, tenantId),
              eq(products.id, prodId)
            )
          ).limit(1);
          if (prodCheck.length === 0) {
            throw new Error(`Product ID ${prodId} does not exist or belong to this tenant.`);
          }

          await tx.insert(purchaseOrderItems).values({
            tenantId,
            purchaseOrderId: poId,
            productId: prodId,
            qtyOrdered: String(pItem.qty_ordered || 0),
            qtyReceived: "0",
            unitPrice: String(pItem.unit_price || 0),
          });
        }
      }

      // Query back complete nested PO
      const createdPO = await tx.select().from(purchaseOrders).where(
        and(
          eq(purchaseOrders.tenantId, tenantId),
          eq(purchaseOrders.id, poId)
        )
      ).limit(1);
      const detailItems = await tx.select().from(purchaseOrderItems).where(
        and(
          eq(purchaseOrderItems.tenantId, tenantId),
          eq(purchaseOrderItems.purchaseOrderId, poId)
        )
      );

      return {
        ...createdPO[0],
        items: detailItems
      };
    });

    return sendSuccess(res, result, "Purchase order created successfully", 201);
  } catch (error: any) {
    console.error("Failed to create PO:", error);
    return sendError(res, error.message || "Failed to create purchase order", 500);
  }
});

// Receive goods (Goods Receipt) for a Purchase Order
router.post("/purchase-orders/:id/receive", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const poId = Number(req.params.id);
    const { warehouse_id, items: receivedQuantities } = req.body; // Array of { product_id, qty_received }
    const whId = Number(warehouse_id);

    if (!whId) {
      return sendError(res, "Destination warehouse_id is required for Goods Receipt", 400);
    }
    if (!Array.isArray(receivedQuantities) || receivedQuantities.length === 0) {
      return sendError(res, "Received items are missing or empty", 400);
    }

    const finalStatus = await db.transaction(async (tx) => {
      // Validate warehouse
      const whCheck = await tx.select().from(warehouses).where(
        and(
          eq(warehouses.tenantId, tenantId),
          eq(warehouses.id, whId)
        )
      ).limit(1);
      if (whCheck.length === 0) {
        throw new Error("Warehouse does not exist or belong to this tenant.");
      }

      // Pull current order
      const currentPO = await tx.select().from(purchaseOrders).where(
        and(
          eq(purchaseOrders.tenantId, tenantId),
          eq(purchaseOrders.id, poId)
        )
      ).limit(1);
      if (currentPO.length === 0) {
        throw new Error("Purchase Order not found");
      }

      const orderNumber = currentPO[0].poNumber;

      // Process receipts
      for (const receipt of receivedQuantities) {
        const prodId = Number(receipt.product_id);
        const incQty = Number(receipt.qty_received);

        if (incQty <= 0) continue;

        // Update PO items Received qty
        const oItems = await tx.select().from(purchaseOrderItems).where(
          and(
            eq(purchaseOrderItems.tenantId, tenantId),
            eq(purchaseOrderItems.purchaseOrderId, poId),
            eq(purchaseOrderItems.productId, prodId)
          )
        );

        if (oItems.length > 0) {
          const curRec = Number(oItems[0].qtyReceived || 0);
          const nextRec = curRec + incQty;
          await tx.update(purchaseOrderItems)
            .set({ qtyReceived: String(nextRec) })
            .where(
              and(
                eq(purchaseOrderItems.tenantId, tenantId),
                eq(purchaseOrderItems.id, oItems[0].id)
              )
            );
        }

        // Record positive stock transaction
        await recordStockTransaction(
          tx,
          tenantId,
          prodId,
          whId,
          incQty,
          "purchase_receipt",
          "purchase_order",
          orderNumber,
          `Goods received into warehouse id ${whId} for ${orderNumber}`
        );
      }

      // Recalculate PO Status (Draft -> Sent -> Partially Received -> Received)
      const updatedItems = await tx.select().from(purchaseOrderItems).where(
        and(
          eq(purchaseOrderItems.tenantId, tenantId),
          eq(purchaseOrderItems.purchaseOrderId, poId)
        )
      );
      let allReceived = true;
      let anyReceived = false;

      for (const itm of updatedItems) {
        const ordered = Number(itm.qtyOrdered);
        const received = Number(itm.qtyReceived);
        if (received > 0) {
          anyReceived = true;
        }
        if (received < ordered) {
          allReceived = false;
        }
      }

      let nextStatus = "partially_received";
      if (allReceived) {
        nextStatus = "received";
      } else if (!anyReceived) {
        nextStatus = "sent";
      }

      await tx.update(purchaseOrders)
        .set({ status: nextStatus })
        .where(
          and(
            eq(purchaseOrders.tenantId, tenantId),
            eq(purchaseOrders.id, poId)
          )
        );

      return nextStatus;
    });

    return sendSuccess(res, { success: true, status: finalStatus }, "Goods Receipt processed successfully. Inventory updated.");
  } catch (error: any) {
    console.error("Failed to process Goods Receipt:", error);
    return sendError(res, error.message || "Failed to process Goods Receipt.", 500);
  }
});


// --- Sales Orders with detailed items ---
router.get("/sales-orders", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const orders = await db.select().from(salesOrders)
      .where(eq(salesOrders.tenantId, tenantId))
      .orderBy(desc(salesOrders.id));
    
    // Nest items inside
    const result = [];
    for (const so of orders) {
      const items = await db.select().from(salesOrderItems).where(
        and(
          eq(salesOrderItems.tenantId, tenantId),
          eq(salesOrderItems.salesOrderId, so.id)
        )
      );
      result.push({
        ...so,
        items
      });
    }
    return sendSuccess(res, result, "Fetched sales orders successfully");
  } catch (error: any) {
    console.error("Failed to fetch detailed SOs:", error);
    return sendError(res, "Failed to fetch sales orders", 500);
  }
});

router.post("/sales-orders", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { 
      so_number, 
      customer_id, 
      customer_name, 
      order_date, 
      status, 
      total, 
      reference_number,
      expected_shipment_date,
      payment_terms,
      delivery_method,
      salesperson,
      discount,
      discount_type,
      tax_type,
      tax_name,
      adjustment,
      customer_notes,
      terms_conditions,
      items: sItems 
    } = req.body;
    
    if (!so_number) {
      return sendError(res, "Sales order number is required.", 400);
    }

    const result = await db.transaction(async (tx) => {
      // Create SO header
      const newSO = await tx.insert(salesOrders)
        .values({
          tenantId,
          soNumber: so_number,
          customerId: customer_id,
          customerName: customer_name,
          status: status || "draft",
          orderDate: order_date || new Date().toISOString().split("T")[0],
          total: total ? String(total) : "0",
          referenceNumber: reference_number,
          expectedShipmentDate: expected_shipment_date,
          paymentTerms: payment_terms,
          deliveryMethod: delivery_method,
          salesperson: salesperson,
          discount: discount ? String(discount) : null,
          discountType: discount_type,
          taxType: tax_type,
          taxName: tax_name,
          adjustment: adjustment ? String(adjustment) : null,
          customerNotes: customer_notes,
          termsConditions: terms_conditions,
        })
        .returning();

      const soId = newSO[0].id;

      // Add SO Line Items
      if (Array.isArray(sItems)) {
        for (const sItem of sItems) {
          const prodId = Number(sItem.product_id);
          // Validate product belongs to tenant
          const prodCheck = await tx.select().from(products).where(
            and(
              eq(products.tenantId, tenantId),
              eq(products.id, prodId)
            )
          ).limit(1);
          if (prodCheck.length === 0) {
            throw new Error(`Product ID ${prodId} does not exist or belong to this tenant.`);
          }

          await tx.insert(salesOrderItems).values({
            tenantId,
            salesOrderId: soId,
            productId: prodId,
            qtyOrdered: String(sItem.qty_ordered || 0),
            qtyShipped: "0",
            unitPrice: String(sItem.unit_price || 0),
          });
        }
      }

      // Query back complete nested SO
      const createdSO = await tx.select().from(salesOrders).where(
        and(
          eq(salesOrders.tenantId, tenantId),
          eq(salesOrders.id, soId)
        )
      ).limit(1);
      const detailItems = await tx.select().from(salesOrderItems).where(
        and(
          eq(salesOrderItems.tenantId, tenantId),
          eq(salesOrderItems.salesOrderId, soId)
        )
      );

      return {
        ...createdSO[0],
        items: detailItems
      };
    });

    return sendSuccess(res, result, "Sales order created successfully", 201);
  } catch (error: any) {
    console.error("Failed to create SO:", error);
    return sendError(res, error.message || "Failed to create sales order", 500);
  }
});

// Process shipment (Goods Issue / Shipment) for Sales Order
router.post("/sales-orders/:id/ship", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const soId = Number(req.params.id);
    const { warehouse_id, items: shippedQuantities } = req.body; // Array of { product_id, qty_shipped }
    const whId = Number(warehouse_id);

    if (!whId) {
      return sendError(res, "Source warehouse_id is required for process Shipment", 400);
    }
    if (!Array.isArray(shippedQuantities) || shippedQuantities.length === 0) {
      return sendError(res, "Shipped items list are missing or empty", 400);
    }

    const finalStatus = await db.transaction(async (tx) => {
      // Validate warehouse
      const whCheck = await tx.select().from(warehouses).where(
        and(
          eq(warehouses.tenantId, tenantId),
          eq(warehouses.id, whId)
        )
      ).limit(1);
      if (whCheck.length === 0) {
        throw new Error("Source warehouse does not exist or belong to this tenant.");
      }

      // Pull current order
      const currentSO = await tx.select().from(salesOrders).where(
        and(
          eq(salesOrders.tenantId, tenantId),
          eq(salesOrders.id, soId)
        )
      ).limit(1);
      if (currentSO.length === 0) {
        throw new Error("Sales Order not found");
      }

      const orderNumber = currentSO[0].soNumber;

      // Check available inventory in source warehouse first to secure accurate accounting
      for (const ship of shippedQuantities) {
        const prodId = Number(ship.product_id);
        const decQty = Number(ship.qty_shipped);
        if (decQty <= 0) continue;

        const currentLocStock = await tx.select().from(inventory).where(
          and(
            eq(inventory.tenantId, tenantId),
            eq(inventory.productId, prodId),
            eq(inventory.warehouseId, whId)
          )
        );

        const availableNum = currentLocStock.length > 0 ? Number(currentLocStock[0].qtyOnHand || 0) : 0;
        if (availableNum < decQty) {
          throw new Error(`Insufficient stock for product id ${prodId} at source warehouse. Available: ${availableNum}, Required: ${decQty}`);
        }
      }

      // Process shipments
      for (const ship of shippedQuantities) {
        const prodId = Number(ship.product_id);
        const decQty = Number(ship.qty_shipped);

        if (decQty <= 0) continue;

        // Update Sales Order Line Item shipped qty
        const oItems = await tx.select().from(salesOrderItems).where(
          and(
            eq(salesOrderItems.tenantId, tenantId),
            eq(salesOrderItems.salesOrderId, soId),
            eq(salesOrderItems.productId, prodId)
          )
        );

        if (oItems.length > 0) {
          const curShip = Number(oItems[0].qtyShipped || 0);
          const nextShip = curShip + decQty;
          await tx.update(salesOrderItems)
            .set({ qtyShipped: String(nextShip) })
            .where(
              and(
                eq(salesOrderItems.tenantId, tenantId),
                eq(salesOrderItems.id, oItems[0].id)
              )
            );
        }

        // Record negative stock transaction (Note quantum is input as negative for subtraction)
        await recordStockTransaction(
          tx,
          tenantId,
          prodId,
          whId,
          -decQty,
          "sale_shipment",
          "sales_order",
          orderNumber,
          `Goods shipped from warehouse id ${whId} for ${orderNumber}`
        );
      }

      // Recalculate SO Status (Draft -> Confirmed -> Packed -> Shipped)
      const updatedItems = await tx.select().from(salesOrderItems).where(
        and(
          eq(salesOrderItems.tenantId, tenantId),
          eq(salesOrderItems.salesOrderId, soId)
        )
      );
      let allShipped = true;
      let anyShipped = false;

      for (const itm of updatedItems) {
        const ordered = Number(itm.qtyOrdered);
        const shipped = Number(itm.qtyShipped);
        if (shipped > 0) {
          anyShipped = true;
        }
        if (shipped < ordered) {
          allShipped = false;
        }
      }

      let nextStatus = "packed";
      if (allShipped) {
        nextStatus = "shipped";
      } else if (!anyShipped) {
        nextStatus = "confirmed";
      }

      await tx.update(salesOrders)
        .set({ status: nextStatus })
        .where(
          and(
            eq(salesOrders.tenantId, tenantId),
            eq(salesOrders.id, soId)
          )
        );

      return nextStatus;
    });

    return sendSuccess(res, { success: true, status: finalStatus }, "Shipment processed successfully. Inventory deducted.");
  } catch (error: any) {
    console.error("Failed to process Shipment:", error);
    return sendError(res, error.message || "Failed to process Shipment.", 500);
  }
});

// Update Sales Order status directly
router.put("/sales-orders/:id/status", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const id = Number(req.params.id);
    const { status } = req.body;
    
    await db.update(salesOrders)
      .set({ status })
      .where(
        and(
          eq(salesOrders.tenantId, tenantId),
          eq(salesOrders.id, id)
        )
      );
    return sendSuccess(res, { success: true }, `Sales order status updated to ${status}.`);
  } catch (error: any) {
    console.error("Failed to update Sales Order status:", error);
    return sendError(res, "Failed to update sales order status.", 500);
  }
});


// --- Multi-location Warehouse Stock Transfer ---
router.post("/transfers", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { product_id, from_warehouse_id, to_warehouse_id, qty, notes } = req.body;
    const pId = Number(product_id);
    const sourceWh = Number(from_warehouse_id);
    const destWh = Number(to_warehouse_id);
    const transQty = Number(qty);

    if (!pId || !sourceWh || !destWh || isNaN(transQty) || transQty <= 0) {
      return sendError(res, "Product ID, source/dest warehouse, and positive qty are required.", 400);
    }

    if (sourceWh === destWh) {
      return sendError(res, "Source and destination warehouses must be different.", 400);
    }

    const trackingRef = await db.transaction(async (tx) => {
      // Validate warehouses belong to tenant
      const sourceWhCheck = await tx.select().from(warehouses).where(
        and(
          eq(warehouses.tenantId, tenantId),
          eq(warehouses.id, sourceWh)
        )
      ).limit(1);
      if (sourceWhCheck.length === 0) {
        throw new Error("Source warehouse does not exist or belong to this tenant.");
      }

      const destWhCheck = await tx.select().from(warehouses).where(
        and(
          eq(warehouses.tenantId, tenantId),
          eq(warehouses.id, destWh)
        )
      ).limit(1);
      if (destWhCheck.length === 0) {
        throw new Error("Destination warehouse does not exist or belong to this tenant.");
      }

      // Check availability at source warehouse
      const currentLocStock = await tx.select().from(inventory).where(
        and(
          eq(inventory.tenantId, tenantId),
          eq(inventory.productId, pId),
          eq(inventory.warehouseId, sourceWh)
        )
      );

      const availableNum = currentLocStock.length > 0 ? Number(currentLocStock[0].qtyOnHand || 0) : 0;
      if (availableNum < transQty) {
        throw new Error(`Insufficient stock. Warehouse ID ${sourceWh} only has ${availableNum} of product ${pId}. Cannot transfer ${transQty}`);
      }

      const transferRef = "TR-" + Math.floor(Math.random() * 900000 + 100000);

      // 1. Process Deduction from Source (negative qty transaction)
      await recordStockTransaction(
        tx,
        tenantId,
        pId,
        sourceWh,
        -transQty,
        "warehouse_transfer_out",
        "warehouse_transfer",
        transferRef,
        notes || `Warehouse Transfer - Outbound to WH ID ${destWh}`
      );

      // 2. Process Addition into Destination (positive qty transaction)
      await recordStockTransaction(
        tx,
        tenantId,
        pId,
        destWh,
        transQty,
        "warehouse_transfer_in",
        "warehouse_transfer",
        transferRef,
        notes || `Warehouse Transfer - Inbound from WH ID ${sourceWh}`
      );

      return transferRef;
    });

    return sendSuccess(res, { success: true, trackingRef }, `Successfully transferred ${transQty} units.`);
  } catch (error: any) {
    console.error("Failed to process stock transfer:", error);
    return sendError(res, error.message || "Failed to process warehouse stock transfer.", 500);
  }
});


// --- Move Orders APIs ---
router.get("/move-orders", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const list = await db.select().from(moveOrders)
      .where(eq(moveOrders.tenantId, tenantId))
      .orderBy(desc(moveOrders.createdAt));
    const result = [];
    for (const mo of list) {
      const items = await db.select().from(moveOrderItems).where(
        and(
          eq(moveOrderItems.tenantId, tenantId),
          eq(moveOrderItems.moveOrderId, mo.id)
        )
      );
      result.push({
        ...mo,
        items
      });
    }
    return sendSuccess(res, result, "Fetched move orders successfully");
  } catch (error: any) {
    console.error("Failed to query move orders:", error);
    return sendError(res, "Failed to fetch move orders.", 500);
  }
});

router.post("/move-orders", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { mo_number, date, warehouse_id, warehouse_name, assignee, notes, status, items: mItems } = req.body;
    
    if (!mo_number) {
      return sendError(res, "Move order number is required.", 400);
    }

    const result = await db.transaction(async (tx) => {
      // Validate warehouse belongs to tenant
      if (warehouse_id) {
        const whCheck = await tx.select().from(warehouses).where(
          and(
            eq(warehouses.tenantId, tenantId),
            eq(warehouses.id, Number(warehouse_id))
          )
        ).limit(1);
        if (whCheck.length === 0) {
          throw new Error("Warehouse does not exist or belong to this tenant.");
        }
      }

      // Insert move order header
      const newMO = await tx.insert(moveOrders)
        .values({
          tenantId,
          moNumber: mo_number,
          date: date || new Date().toISOString().split("T")[0],
          warehouseId: warehouse_id ? Number(warehouse_id) : null,
          warehouseName: warehouse_name,
          assignee,
          notes,
          status: status || "draft",
        })
        .returning();

      const moId = newMO[0].id;

      // Insert move order line items
      if (Array.isArray(mItems)) {
        for (const mItem of mItems) {
          const prodId = Number(mItem.product_id);
          // Validate product belongs to tenant
          const prodCheck = await tx.select().from(products).where(
            and(
              eq(products.tenantId, tenantId),
              eq(products.id, prodId)
            )
          ).limit(1);
          if (prodCheck.length === 0) {
            throw new Error(`Product ID ${prodId} does not exist or belong to this tenant.`);
          }

          await tx.insert(moveOrderItems).values({
            tenantId,
            moveOrderId: moId,
            productId: prodId,
            qty: String(mItem.qty || 0),
          });

          // If move order is saved as "completed", record stock audit log within the warehouse
          if (status === "completed" && warehouse_id) {
            await recordStockTransaction(
              tx,
              tenantId,
              prodId,
              Number(warehouse_id),
              0, // No net qty change to warehouse balance, but recorded as move order relocation audit
              "stock_relocation",
              "move_order",
              mo_number,
              notes || `Item relocated within warehouse ${warehouse_name || warehouse_id}`
            );
          }
        }
      }

      // Return the inserted move order with nested items
      const createdMO = await tx.select().from(moveOrders).where(
        and(
          eq(moveOrders.tenantId, tenantId),
          eq(moveOrders.id, moId)
        )
      ).limit(1);
      const detailItems = await tx.select().from(moveOrderItems).where(
        and(
          eq(moveOrderItems.tenantId, tenantId),
          eq(moveOrderItems.moveOrderId, moId)
        )
      );

      return {
        ...createdMO[0],
        items: detailItems
      };
    });

    return sendSuccess(res, result, "Move order created successfully", 201);
  } catch (error: any) {
    console.error("Failed to create move order:", error);
    return sendError(res, error.message || "Failed to create move order.", 500);
  }
});


// --- Putaways APIs ---
router.get("/putaways", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const list = await db.select().from(putaways)
      .where(eq(putaways.tenantId, tenantId))
      .orderBy(desc(putaways.createdAt));
    const result = [];
    for (const pw of list) {
      const items = await db.select().from(putawayItems).where(
        and(
          eq(putawayItems.tenantId, tenantId),
          eq(putawayItems.putawayId, pw.id)
        )
      );
      result.push({
        ...pw,
        items
      });
    }
    return sendSuccess(res, result, "Fetched putaways successfully");
  } catch (error: any) {
    console.error("Failed to query putaways:", error);
    return sendError(res, "Failed to fetch putaways.", 500);
  }
});

router.post("/putaways", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { pw_number, date, warehouse_id, warehouse_name, assignee, notes, status, items: pItems } = req.body;
    
    if (!pw_number) {
      return sendError(res, "Putaway number is required.", 400);
    }

    const result = await db.transaction(async (tx) => {
      // Validate warehouse belongs to tenant
      if (warehouse_id) {
        const whCheck = await tx.select().from(warehouses).where(
          and(
            eq(warehouses.tenantId, tenantId),
            eq(warehouses.id, Number(warehouse_id))
          )
        ).limit(1);
        if (whCheck.length === 0) {
          throw new Error("Warehouse does not exist or belong to this tenant.");
        }
      }

      // Insert putaway header
      const newPW = await tx.insert(putaways)
        .values({
          tenantId,
          pwNumber: pw_number,
          date: date || new Date().toISOString().split("T")[0],
          warehouseId: warehouse_id ? Number(warehouse_id) : null,
          warehouseName: warehouse_name,
          assignee: assignee || "Unassigned",
          notes,
          status: status || "draft",
        })
        .returning();

      const pwId = newPW[0].id;

      // Insert putaway items
      if (Array.isArray(pItems)) {
        for (const pItem of pItems) {
          const prodId = Number(pItem.product_id);
          // Validate product belongs to tenant
          const prodCheck = await tx.select().from(products).where(
            and(
              eq(products.tenantId, tenantId),
              eq(products.id, prodId)
            )
          ).limit(1);
          if (prodCheck.length === 0) {
            throw new Error(`Product ID ${prodId} does not exist or belong to this tenant.`);
          }

          await tx.insert(putawayItems).values({
            tenantId,
            putawayId: pwId,
            productId: prodId,
            qty: String(pItem.qty || 0),
          });

          // If putaway is saved as "completed", record stock translation (increases stock in target warehouse)
          if (status === "completed" && warehouse_id) {
            await recordStockTransaction(
              tx,
              tenantId,
              prodId,
              Number(warehouse_id),
              Number(pItem.qty || 0), // Increments stock of target warehouse
              "stock_in",
              "putaway",
              pw_number,
              notes || `Items putaway to warehouse ${warehouse_name || warehouse_id}`
            );
          }
        }
      }

      // Return the inserted putaway with nested items
      const createdPW = await tx.select().from(putaways).where(
        and(
          eq(putaways.tenantId, tenantId),
          eq(putaways.id, pwId)
        )
      ).limit(1);
      const detailItems = await tx.select().from(putawayItems).where(
        and(
          eq(putawayItems.tenantId, tenantId),
          eq(putawayItems.putawayId, pwId)
        )
      );

      return {
        ...createdPW[0],
        items: detailItems
      };
    });

    return sendSuccess(res, result, "Putaway created successfully", 201);
  } catch (error: any) {
    console.error("Failed to create putaway:", error);
    return sendError(res, error.message || "Failed to create putaway.", 500);
  }
});


// --- Invoices APIs ---
router.get("/invoices", requireManager as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const list = await db.select().from(invoices)
      .where(eq(invoices.tenantId, tenantId))
      .orderBy(desc(invoices.id));
    const result = [];
    for (const inv of list) {
      const items = await db.select().from(invoiceItems).where(
        and(
          eq(invoiceItems.tenantId, tenantId),
          eq(invoiceItems.invoiceId, inv.id)
        )
      );
      result.push({
        ...inv,
        items
      });
    }
    return sendSuccess(res, result, "Fetched invoices successfully");
  } catch (error: any) {
    console.error("Failed to fetch invoices:", error);
    return sendError(res, "Failed to fetch invoices", 500);
  }
});

router.post("/invoices", requireManager as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { 
      invoice_number, 
      customer_id, 
      customer_name, 
      order_number, 
      invoice_date, 
      terms, 
      due_date, 
      salesperson, 
      subject, 
      status, 
      total, 
      discount, 
      discount_type, 
      tax_type, 
      tax_name, 
      adjustment, 
      customer_notes, 
      terms_conditions, 
      items: pItems 
    } = req.body;

    if (!invoice_number) {
      return sendError(res, "Invoice number is required.", 400);
    }

    const result = await db.transaction(async (tx) => {
      // Create Invoice Header
      const newInv = await tx.insert(invoices)
        .values({
          tenantId,
          invoiceNumber: invoice_number,
          customerId: customer_id,
          customerName: customer_name,
          orderNumber: order_number,
          invoiceDate: invoice_date || new Date().toISOString().split("T")[0],
          terms: terms || "Due on Receipt",
          dueDate: due_date || invoice_date || new Date().toISOString().split("T")[0],
          salesperson: salesperson || "",
          subject: subject || "",
          status: status || "draft",
          total: total ? String(total) : "0",
          discount: discount ? String(discount) : "0",
          discountType: discount_type || "%",
          taxType: tax_type || "TDS",
          taxName: tax_name || "None",
          adjustment: adjustment ? String(adjustment) : "0",
          customerNotes: customer_notes || "",
          termsConditions: terms_conditions || "",
        })
        .returning();

      const invId = newInv[0].id;

      // Add Invoice items
      if (Array.isArray(pItems)) {
        for (const pItem of pItems) {
          const prodId = Number(pItem.product_id);
          // Validate product belongs to tenant
          const prodCheck = await tx.select().from(products).where(
            and(
              eq(products.tenantId, tenantId),
              eq(products.id, prodId)
            )
          ).limit(1);
          if (prodCheck.length === 0) {
            throw new Error(`Product ID ${prodId} does not exist or belong to this tenant.`);
          }

          await tx.insert(invoiceItems).values({
            tenantId,
            invoiceId: invId,
            productId: prodId,
            qty: String(pItem.qty || 1),
            rate: String(pItem.rate || 0),
          });
        }
      }

      // Query back complete nested Invoice
      const createdInv = await tx.select().from(invoices).where(
        and(
          eq(invoices.tenantId, tenantId),
          eq(invoices.id, invId)
        )
      ).limit(1);
      const detailItems = await tx.select().from(invoiceItems).where(
        and(
          eq(invoiceItems.tenantId, tenantId),
          eq(invoiceItems.invoiceId, invId)
        )
      );

      return {
        ...createdInv[0],
        items: detailItems
      };
    });

    return sendSuccess(res, result, "Invoice created successfully", 201);
  } catch (error: any) {
    console.error("Failed to create invoice:", error);
    return sendError(res, error.message || "Failed to create invoice.", 500);
  }
});

export default router;
