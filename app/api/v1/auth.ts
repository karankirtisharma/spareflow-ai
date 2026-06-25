import { Router, Response } from "express";
import { AuthService } from "../../services/auth.service.js";
import { authenticateUser, AuthenticatedRequest } from "../../middleware/rbac.js";
import { validateRequired, validateEmail } from "../../schemas/schemas.js";

const router = Router();
const authService = new AuthService();

/**
 * POST /api/auth/register
 * Registers a business (Tenant) and creates the initial Owner account.
 */
router.post("/register", async (req, res): Promise<void> => {
  try {
    const err = validateRequired(req.body, [
      "business_name",
      "business_type",
      "owner_name",
      "owner_email",
      "owner_password",
    ]);
    if (err) {
      res.status(400).json({ error: err });
      return;
    }

    if (!validateEmail(req.body.owner_email)) {
      res.status(400).json({ error: "Invalid email format for owner_email." });
      return;
    }

    if (req.body.owner_password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters long." });
      return;
    }

    const response = await authService.registerBusiness(req.body);
    res.status(201).json(response);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Registration failed." });
  }
});

/**
 * POST /api/auth/login
 * Standard username (email) and password validation.
 */
router.post("/login", async (req, res): Promise<void> => {
  try {
    const err = validateRequired(req.body, ["email", "password"]);
    if (err) {
      res.status(400).json({ error: err });
      return;
    }

    const response = await authService.login(req.body);
    res.json(response);
  } catch (error: any) {
    res.status(401).json({ error: error.message || "Authentication failed." });
  }
});

/**
 * POST /api/auth/refresh
 * Renews access tokens using a secure refresh token.
 */
router.post("/refresh", async (req, res): Promise<void> => {
  try {
    const err = validateRequired(req.body, ["refresh_token"]);
    if (err) {
      res.status(400).json({ error: err });
      return;
    }

    const tokens = await authService.refreshToken(req.body.refresh_token);
    res.json(tokens);
  } catch (error: any) {
    res.status(401).json({ error: error.message || "Invalid refresh token." });
  }
});

/**
 * POST /api/auth/logout
 * Logs out the user (revokes session/token in client; server validates log in client context).
 */
router.post("/logout", (req, res) => {
  res.json({ message: "Successfully logged out clean. Clear all client tokens." });
});

/**
 * POST /api/auth/change-password
 * Updates the user's password securely (Requires auth).
 */
router.post("/change-password", authenticateUser as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const err = validateRequired(req.body, ["old_password", "new_password"]);
    if (err) {
      res.status(400).json({ error: err });
      return;
    }

    if (req.body.new_password.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters long." });
      return;
    }

    const user = req.user!;
    await authService.changePassword(user.userId, user.tenantId, req.body.old_password, req.body.new_password);
    res.json({ message: "Password updated successfully." });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Password change failed." });
  }
});

export default router;
