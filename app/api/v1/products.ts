import { Router, Response } from "express";
import { db } from "../../../src/db/index.js";
import { products, inventory } from "../../../src/db/schema.js";
import { eq, desc, and } from "drizzle-orm";
import { authenticateUser, requireManager, AuthenticatedRequest } from "../../middleware/rbac.js";
import { sendSuccess, sendError } from "../../core/response.js";

const router = Router();

// Enforce auth globally
router.use(authenticateUser as any);

// GET all products for the tenant
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const list = await db.select().from(products)
      .where(eq(products.tenantId, tenantId))
      .orderBy(desc(products.id));
    return sendSuccess(res, list, "Fetched products successfully");
  } catch (error: any) {
    console.error("Failed to fetch products:", error);
    return sendError(res, "Failed to fetch products", 500);
  }
});

// GET single product
router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const pId = Number(req.params.id);
    const item = await db.select().from(products)
      .where(
        and(
          eq(products.tenantId, tenantId),
          eq(products.id, pId)
        )
      )
      .limit(1);
    
    if (item.length === 0) {
      return sendError(res, "Product not found or access denied", 404);
    }
    return sendSuccess(res, item[0], "Product fetched successfully");
  } catch (error: any) {
    console.error("Failed to fetch product:", error);
    return sendError(res, "Failed to fetch product", 500);
  }
});

// POST create product (Requires Manager or Owner role)
router.post("/", requireManager as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { name, sku, item_type, unit, purchase_price, sales_price, reorder_point } = req.body;
    if (!name || !sku) {
      return sendError(res, "Name and SKU are required", 400);
    }

    const newItem = await db.transaction(async (tx) => {
      // Check SKU uniqueness within the tenant
      const existing = await tx.select().from(products).where(
        and(
          eq(products.tenantId, tenantId),
          eq(products.sku, sku)
        )
      ).limit(1);

      if (existing.length > 0) {
        throw new Error("SKU already exists");
      }

      const inserted = await tx.insert(products).values({
        tenantId,
        name,
        sku,
        itemType: item_type || "single",
        unit: unit || "pcs",
        purchasePrice: purchase_price ? String(purchase_price) : "0",
        salesPrice: sales_price ? String(sales_price) : "0",
        reorderPoint: reorder_point ? String(reorder_point) : "0",
        qtyOnHand: "0",
        isTracked: true
      }).returning();

      return inserted[0];
    });

    return sendSuccess(res, newItem, "Product created successfully", 201);
  } catch (error: any) {
    console.error("Create product failed:", error);
    return sendError(res, error.message || "Failed to create product", 500);
  }
});

// PUT update product (Requires Manager or Owner role)
router.put("/:id", requireManager as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const pId = Number(req.params.id);
    const { name, sku, item_type, unit, purchase_price, sales_price, reorder_point } = req.body;
    
    const updatedItem = await db.transaction(async (tx) => {
      const existing = await tx.select().from(products).where(
        and(
          eq(products.tenantId, tenantId),
          eq(products.id, pId)
        )
      ).limit(1);

      if (existing.length === 0) {
        throw new Error("Product not found or access denied");
      }

      if (sku && sku !== existing[0].sku) {
        // Validate SKU uniqueness
        const skuCheck = await tx.select().from(products).where(
          and(
            eq(products.tenantId, tenantId),
            eq(products.sku, sku)
          )
        ).limit(1);
        if (skuCheck.length > 0) {
          throw new Error("SKU already exists");
        }
      }

      const updated = await tx.update(products).set({
        name: name || existing[0].name,
        sku: sku || existing[0].sku,
        itemType: item_type || existing[0].itemType,
        unit: unit || existing[0].unit,
        purchasePrice: purchase_price ? String(purchase_price) : existing[0].purchasePrice,
        salesPrice: sales_price ? String(sales_price) : existing[0].salesPrice,
        reorderPoint: reorder_point ? String(reorder_point) : existing[0].reorderPoint,
      }).where(
        and(
          eq(products.tenantId, tenantId),
          eq(products.id, pId)
        )
      ).returning();

      return updated[0];
    });

    return sendSuccess(res, updatedItem, "Product updated successfully");
  } catch (error: any) {
    console.error("Update product failed:", error);
    return sendError(res, error.message || "Failed to update product", 500);
  }
});

// DELETE delete product (Requires Manager or Owner role)
router.delete("/:id", requireManager as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const pId = Number(req.params.id);

    await db.transaction(async (tx) => {
      const existing = await tx.select().from(products).where(
        and(
          eq(products.tenantId, tenantId),
          eq(products.id, pId)
        )
      ).limit(1);

      if (existing.length === 0) {
        throw new Error("Product not found or access denied");
      }

      await tx.delete(products).where(
        and(
          eq(products.tenantId, tenantId),
          eq(products.id, pId)
        )
      );
    });

    return sendSuccess(res, { success: true }, "Product deleted successfully");
  } catch (error: any) {
    console.error("Delete product failed:", error);
    return sendError(res, error.message || "Failed to delete product", 500);
  }
});

export default router;
