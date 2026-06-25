import { Router, Response } from "express";
import { UserService } from "../../services/user.service.js";
import { authenticateUser, requireOwner, requireManager, AuthenticatedRequest } from "../../middleware/rbac.js";
import { validateRequired, sanitizeUser, validateEmail } from "../../schemas/schemas.js";

const router = Router();
const userService = new UserService();

// Enforce auth on all user admin routes
router.use(authenticateUser as any);

/**
 * GET /api/users
 * Returns users belonging to the tenant.
 * - Owner: lists all users in the tenant.
 * - Manager: lists only users in their specific branch.
 * - Staff: forbidden from listing users (can only get own profile).
 */
router.get("/", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    
    if (user.role === "Staff") {
      res.status(403).json({ error: "Access Denied: Staff cannot list other users." });
      return;
    }

    const allUsers = await userService.getUsersForTenant(user.tenantId);

    // Filter by branch for Manager
    if (user.role === "Manager") {
      const branchUsers = allUsers.filter((u) => u.branch_id === user.branchId);
      res.json(branchUsers.map(sanitizeUser));
      return;
    }

    res.json(allUsers.map(sanitizeUser));
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to retrieve users." });
  }
});

/**
 * GET /api/users/:id
 * Retrieve a single user.
 * Authorized if: Owner, Manager (same branch), or self-request.
 */
router.get("/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const actor = req.user!;
    const userId = req.params.id;

    const user = await userService.getUser(userId, actor.tenantId);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    // Role verification
    if (actor.role !== "Owner" && actor.userId !== userId) {
      if (actor.role === "Manager" && user.branch_id === actor.branchId) {
        // Permit manager to view same branch
      } else {
        res.status(403).json({ error: "Access Denied: Insufficient permissions." });
        return;
      }
    }

    res.json(sanitizeUser(user));
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to get user." });
  }
});

/**
 * POST /api/users
 * Create a new user.
 * - Owners can create Owner/Manager/Staff in their Tenant.
 * - Managers can create Staff users in their specific branch only.
 * - Staff cannot create users.
 */
router.post("/", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const actor = req.user!;
    const err = validateRequired(req.body, ["full_name", "email", "role", "password"]);
    if (err) {
      res.status(400).json({ error: err });
      return;
    }

    if (!validateEmail(req.body.email)) {
      res.status(400).json({ error: "Invalid email structure." });
      return;
    }

    const targetRole = req.body.role;
    const targetBranchId = req.body.branch_id || null;

    // RBAC and branch matching validation
    if (actor.role === "Staff") {
      res.status(403).json({ error: "Access Denied: Staff cannot create users." });
      return;
    }

    if (actor.role === "Manager") {
      if (targetRole !== "Staff") {
        res.status(403).json({ error: "Access Denied: Managers can only create Staff roles." });
        return;
      }
      if (targetBranchId !== actor.branchId) {
        res.status(403).json({ error: "Access Denied: Managers can only create users in their own branch." });
        return;
      }
    }

    // Ensure branch_id is set for Manager/Staff roles
    if ((targetRole === "Manager" || targetRole === "Staff") && !targetBranchId) {
      res.status(400).json({ error: `A valid branch_id is required for ${targetRole} users.` });
      return;
    }

    const created = await userService.createUser(actor.tenantId, {
      full_name: req.body.full_name,
      email: req.body.email,
      phone: req.body.phone || "",
      password: req.body.password,
      role: targetRole,
      branch_id: targetBranchId,
    });

    res.status(201).json(sanitizeUser(created));
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to create user." });
  }
});

/**
 * PATCH /api/users/:id
 * Update user details.
 */
router.patch("/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const actor = req.user!;
    const userId = req.params.id;

    const userToEdit = await userService.getUser(userId, actor.tenantId);
    if (!userToEdit) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    // RBAC validation
    if (actor.role === "Staff") {
      if (actor.userId !== userId) {
        res.status(403).json({ error: "Access Denied: Staff can only edit their own profile." });
        return;
      }
      // Staff cannot change their own role or active status
      delete req.body.role;
      delete req.body.is_active;
    }

    if (actor.role === "Manager") {
      if (userToEdit.branch_id !== actor.branchId && actor.userId !== userId) {
        res.status(403).json({ error: "Access Denied: You can only edit users in your branch." });
        return;
      }
      // Manager cannot elevate anyone to Owner/Manager, or demote Owner
      if (req.body.role && req.body.role === "Owner") {
        res.status(403).json({ error: "Access Denied: Managers cannot assign Owner role." });
        return;
      }
    }

    const updated = await userService.updateUser(userId, actor.tenantId, req.body);
    res.json(sanitizeUser(updated));
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to update user." });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user account.
 * - Owner: can delete anyone (except themselves!).
 * - Manager: can delete Staff in their branch.
 * - Staff: forbidden.
 */
router.delete("/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const actor = req.user!;
    const userId = req.params.id;

    if (actor.userId === userId) {
      res.status(400).json({ error: "Self-deletion is forbidden. Please contact another system owner." });
      return;
    }

    const userToDelete = await userService.getUser(userId, actor.tenantId);
    if (!userToDelete) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    if (actor.role === "Staff") {
      res.status(403).json({ error: "Access Denied: Staff cannot delete users." });
      return;
    }

    if (actor.role === "Manager") {
      if (userToDelete.branch_id !== actor.branchId || userToDelete.role !== "Staff") {
        res.status(403).json({ error: "Access Denied: Managers can only delete Staff users in their own branch." });
        return;
      }
    }

    await userService.deleteUser(userId, actor.tenantId);
    res.json({ message: "User deleted successfully." });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to delete user." });
  }
});

export default router;
