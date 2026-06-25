import crypto from "crypto";
import { Request, Response, NextFunction } from "express";

export interface LogPayload {
  level: "info" | "warn" | "error" | "critical";
  message: string;
  timestamp: string;
  requestId?: string;
  tenantId?: string;
  userId?: string;
  endpoint?: string;
  duration?: number;
  statusCode?: number;
  error?: any;
  [key: string]: any;
}

export function writeLog(payload: Omit<LogPayload, "timestamp">) {
  const log: LogPayload = {
    level: payload.level,
    message: payload.message,
    timestamp: new Date().toISOString(),
    ...payload,
  };
  // Output as structured JSON string for modern observability/logging platforms
  console.log(JSON.stringify(log));
}

export function logRequest(req: Request & { user?: any; requestId?: string }, res: Response, next: NextFunction) {
  const start = Date.now();
  const requestId = req.headers["x-request-id"] as string || `req_${crypto.randomBytes(8).toString("hex")}`;
  req.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);

  res.on("finish", () => {
    const duration = Date.now() - start;
    const userId = req.user?.userId || null;
    const tenantId = req.user?.tenantId || null;

    writeLog({
      level: res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
      message: `HTTP ${req.method} ${req.originalUrl}`,
      requestId,
      tenantId,
      userId,
      endpoint: req.originalUrl,
      duration,
      statusCode: res.statusCode,
    });
  });

  next();
}
