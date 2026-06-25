import { Router, Response } from "express";
import { BranchService } from "../../services/branch.service.js";
import { authenticateUser, requireOwner, requireManager, AuthenticatedRequest } from "../../middleware/rbac.js";
import { validateRequired } from "../../schemas/schemas.js";

const router = Router();
const branchService = new BranchService();

// Enforce authentication on all branch routes
router.use(authenticateUser as any);

/**
 * GET /api/branches
 * Retrieves all branches for the authenticated user's tenant.
 * Scope: Owner sees all branches. Manager/Staff can see only their assigned branch.
 */
router.get("/", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const branches = await branchService.getBranchesForTenant(user.tenantId);

    // Enforce branch-level isolation if not Owner
    if (user.role !== "Owner") {
      if (!user.branchId) {
        res.json([]);
        return;
      }
      const filtered = branches.filter((b) => b.branch_id === user.branchId);
      res.json(filtered);
      return;
    }

    res.json(branches);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to retrieve branches." });
  }
});

/**
 * GET /api/branches/:id
 * Retrieves a single branch.
 */
router.get("/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const branchId = req.params.id;

    // Reject if Manager/Staff trying to see another branch
    if (user.role !== "Owner" && user.branchId !== branchId) {
       res.status(403).json({ error: "Access Denied: You do not have permissions to view this branch." });
       return;
    }

    const branch = await branchService.getBranch(branchId, user.tenantId);
    if (!branch) {
      res.status(404).json({ error: "Branch not found." });
      return;
    }

    res.json(branch);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to retrieve branch." });
  }
});

/**
 * POST /api/branches
 * Only the business Owner can add branches.
 */
router.post("/", requireOwner as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const err = validateRequired(req.body, ["branch_name", "location"]);
    if (err) {
      res.status(400).json({ error: err });
      return;
    }

    const user = req.user!;
    const newBranch = await branchService.createBranch(user.tenantId, {
      branch_name: req.body.branch_name,
      location: req.body.location,
      phone: req.body.phone || "",
      email: req.body.email || "",
    });

    res.status(201).json(newBranch);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to create branch." });
  }
});

/**
 * PATCH /api/branches/:id
 * Only the business Owner can update branches.
 */
router.patch("/:id", requireOwner as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const branchId = req.params.id;

    const updated = await branchService.updateBranch(branchId, user.tenantId, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to update branch." });
  }
});

/**
 * DELETE /api/branches/:id
 * Only the business Owner can delete branches.
 */
router.delete("/:id", requireOwner as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const branchId = req.params.id;

    await branchService.deleteBranch(branchId, user.tenantId);
    res.json({ message: "Branch deleted successfully." });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to delete branch." });
  }
});

export default router;
