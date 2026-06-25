import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { authenticateUser, requireOwner, requireManager, requireAuthenticated, AuthenticatedRequest } from "./rbac.js";
import { signJwt, TokenPayload } from "../core/security.js";

describe("Role-Based Access Control (RBAC) Middleware Guards", () => {
  // Setup standard mock users
  const ownerUser: TokenPayload = {
    userId: "usr_owner",
    tenantId: "tnt_alpha",
    branchId: "brn_01",
    role: "Owner",
    email: "owner@spareflow.com"
  };

  const managerUser: TokenPayload = {
    userId: "usr_manager",
    tenantId: "tnt_alpha",
    branchId: "brn_01",
    role: "Manager",
    email: "manager@spareflow.com"
  };

  const staffUser: TokenPayload = {
    userId: "usr_staff",
    tenantId: "tnt_alpha",
    branchId: "brn_01",
    role: "Staff",
    email: "staff@spareflow.com"
  };

  // Generate tokens
  const ownerToken = signJwt(ownerUser, 300);
  const managerToken = signJwt(managerUser, 300);
  const staffToken = signJwt(staffUser, 300);

  // Setup a test Express application specifically for RBAC assertions
  const app = express();
  app.use(express.json());

  // Public endpoint
  app.get("/test/public", (req, res) => {
    res.json({ message: "public" });
  });

  // Protected / Standard Authenticated endpoint
  app.get(
    "/test/authenticated",
    authenticateUser as any,
    requireAuthenticated as any,
    (req: AuthenticatedRequest, res) => {
      res.json({ message: "authenticated", user: req.user });
    }
  );

  // Manager-Only endpoint
  app.get(
    "/test/manager",
    authenticateUser as any,
    requireManager as any,
    (req: AuthenticatedRequest, res) => {
      res.json({ message: "manager-approved" });
    }
  );

  // Owner-Only endpoint
  app.get(
    "/test/owner",
    authenticateUser as any,
    requireOwner as any,
    (req: AuthenticatedRequest, res) => {
      res.json({ message: "owner-approved" });
    }
  );

  describe("Public Routes", () => {
    it("should allow any guest to access public routes without headers", async () => {
      const response = await request(app).get("/test/public");
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("public");
    });
  });

  describe("Authentication Guard", () => {
    it("should block requests with missing authorization headers", async () => {
      const response = await request(app).get("/test/authenticated");
      expect(response.status).toBe(401);
      expect(response.body.error).toContain("Access token required");
    });

    it("should block requests with invalid tokens", async () => {
      const response = await request(app)
        .get("/test/authenticated")
        .set("Authorization", "Bearer invalid_token_here");
      expect(response.status).toBe(401);
      expect(response.body.error).toContain("Invalid or expired access token");
    });

    it("should allow verified user with standard claims", async () => {
      const response = await request(app)
        .get("/test/authenticated")
        .set("Authorization", `Bearer ${staffToken}`);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("authenticated");
      expect(response.body.user.userId).toBe("usr_staff");
    });
  });

  describe("Manager & Owner Access Levels", () => {
    it("should allow Owner to access Owner-only routes", async () => {
      const response = await request(app)
        .get("/test/owner")
        .set("Authorization", `Bearer ${ownerToken}`);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("owner-approved");
    });

    it("should block Manager from accessing Owner-only routes", async () => {
      const response = await request(app)
        .get("/test/owner")
        .set("Authorization", `Bearer ${managerToken}`);
      expect(response.status).toBe(403);
      expect(response.body.error).toContain("Owner role required");
    });

    it("should block Staff from accessing Owner-only routes", async () => {
      const response = await request(app)
        .get("/test/owner")
        .set("Authorization", `Bearer ${staffToken}`);
      expect(response.status).toBe(403);
      expect(response.body.error).toContain("Owner role required");
    });

    it("should allow Owner to access Manager-level routes", async () => {
      const response = await request(app)
        .get("/test/manager")
        .set("Authorization", `Bearer ${ownerToken}`);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("manager-approved");
    });

    it("should allow Manager to access Manager-level routes", async () => {
      const response = await request(app)
        .get("/test/manager")
        .set("Authorization", `Bearer ${managerToken}`);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("manager-approved");
    });

    it("should block Staff from accessing Manager-level routes", async () => {
      const response = await request(app)
        .get("/test/manager")
        .set("Authorization", `Bearer ${staffToken}`);
      expect(response.status).toBe(403);
      expect(response.body.error).toContain("Only Owners and Managers are permitted");
    });
  });
});
