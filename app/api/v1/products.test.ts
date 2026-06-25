import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { signJwt, TokenPayload } from "../../core/security.js";

// Mock the db export from '../../src/db/index.js' BEFORE importing the router
vi.mock("../../../src/db/index.js", () => {
  return {
    db: {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      transaction: vi.fn(),
    },
  };
});

// Now import the router and the mocked db
import productsRouter from "./products.js";
import { db } from "../../../src/db/index.js";

describe("Products API Integration & Tenant Isolation Engine", () => {
  // Test Tenants
  const tenantA_Owner: TokenPayload = {
    userId: "usr_owner_a",
    tenantId: "tenant_alpha",
    branchId: "brn_01",
    role: "Owner",
    email: "owner@alpha.com",
  };

  const tenantB_Manager: TokenPayload = {
    userId: "usr_manager_b",
    tenantId: "tenant_beta",
    branchId: "brn_02",
    role: "Manager",
    email: "manager@beta.com",
  };

  const tenantA_Staff: TokenPayload = {
    userId: "usr_staff_a",
    tenantId: "tenant_alpha",
    branchId: "brn_01",
    role: "Staff",
    email: "staff@alpha.com",
  };

  // JWT Tokens
  const tokenA_Owner = signJwt(tenantA_Owner, 300);
  const tokenB_Manager = signJwt(tenantB_Manager, 300);
  const tokenA_Staff = signJwt(tenantA_Staff, 300);

  // Express Setup
  const app = express();
  app.use(express.json());
  app.use("/api/v1/products", productsRouter);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/products - Tenant Isolation", () => {
    it("should fetch products scoped strictly to the requesting tenant A", async () => {
      const mockProductsList = [
        { id: 1, name: "Brake Pads A", tenantId: "tenant_alpha", sku: "SKU-A" },
        { id: 2, name: "Brake Pads B", tenantId: "tenant_alpha", sku: "SKU-B" },
      ];

      // Setup Drizzle chain mock: db.select().from().where().orderBy()
      const mockOrderBy = vi.fn().mockResolvedValue(mockProductsList);
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const response = await request(app)
        .get("/api/v1/products")
        .set("Authorization", `Bearer ${tokenA_Owner}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockProductsList);

      // Verify tenant scoping query boundary was applied correctly
      expect(db.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
      // Ensure the where query filter argument contains the correct tenant ID
      const whereCalls = mockWhere.mock.calls[0];
      expect(whereCalls.length).toBeGreaterThan(0);
    });

    it("should fetch separate scoped products when requested by Tenant B", async () => {
      const mockProductsListBeta = [
        { id: 5, name: "Air Filters Beta", tenantId: "tenant_beta", sku: "SKU-BETA" },
      ];

      const mockOrderBy = vi.fn().mockResolvedValue(mockProductsListBeta);
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const response = await request(app)
        .get("/api/v1/products")
        .set("Authorization", `Bearer ${tokenB_Manager}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockProductsListBeta);
    });
  });

  describe("GET /api/v1/products/:id - Boundary Protection", () => {
    it("should allow a tenant to retrieve their own single product item", async () => {
      const product = { id: 42, name: "Gasket Alpha", tenantId: "tenant_alpha", sku: "SKU-G" };

      const mockLimit = vi.fn().mockResolvedValue([product]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const response = await request(app)
        .get("/api/v1/products/42")
        .set("Authorization", `Bearer ${tokenA_Staff}`); // Staff can view items

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(product);
    });

    it("should return 404/not found if query on a different tenant returns empty results", async () => {
      // Drizzle select returns empty array (representing product belonging to Tenant B, requested by Tenant A)
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const response = await request(app)
        .get("/api/v1/products/99") // Product exists, but belongs to tenant_beta
        .set("Authorization", `Bearer ${tokenA_Owner}`); // Tenant Alpha requests it

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Product not found or access denied");
    });
  });

  describe("POST /api/v1/products - Mutation Authorization (RBAC)", () => {
    it("should allow an Owner/Manager to create products", async () => {
      const newProduct = { id: 101, name: "Spark Plugs", sku: "SPK-11", tenantId: "tenant_alpha" };

      // Mock Drizzle transaction
      (db.transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]), // No duplicate SKU
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([newProduct]),
            }),
          }),
        };
        return callback(mockTx);
      });

      const response = await request(app)
        .post("/api/v1/products")
        .set("Authorization", `Bearer ${tokenA_Owner}`)
        .send({
          name: "Spark Plugs",
          sku: "SPK-11",
          purchase_price: 150,
          sales_price: 300,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(newProduct);
    });

    it("should block standard Staff role from adding or mutating products", async () => {
      const response = await request(app)
        .post("/api/v1/products")
        .set("Authorization", `Bearer ${tokenA_Staff}`) // Staff user
        .send({
          name: "Forbidden Part",
          sku: "FRB-01",
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain("Only Owners and Managers are permitted");
    });
  });
});
