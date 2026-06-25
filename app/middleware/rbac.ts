import { Request, Response, NextFunction } from "express";
import { verifyJwt, TokenPayload } from "../core/security.js";

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Authentication Guard - Verifies Bearer JWT Access Token
 */
export function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Access token required. Please provide standard Bearer header." });
    return;
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyJwt(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired access token." });
    return;
  }

  req.user = payload;
  next();
}

/**
 * Owner-Only Decorator/Guard
 */
export function requireOwner(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  if (req.user.role !== "Owner") {
    res.status(403).json({ error: "Access Denied: Owner role required." });
    return;
  }

  next();
}

/**
 * Manager-Only/Owner Guard (Requires Owner or Manager role)
 */
export function requireManager(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  if (req.user.role !== "Owner" && req.user.role !== "Manager") {
    res.status(403).json({ error: "Access Denied: Only Owners and Managers are permitted." });
    return;
  }

  next();
}

/**
 * Standard Authenticated User Guard (Allows Owner, Manager, and Staff)
 */
export function requireAuthenticated(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }
  next();
}
