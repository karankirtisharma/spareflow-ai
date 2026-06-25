import { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: { message: string; code?: string } | null;
  message: string;
  timestamp: string;
  requestId: string;
}

export function sendSuccess(res: Response, data: any, message = "Operation completed successfully", statusCode = 200) {
  const requestId = (res.req as any).requestId || "";
  const payload: ApiResponse = {
    success: true,
    data,
    error: null,
    message,
    timestamp: new Date().toISOString(),
    requestId,
  };
  return res.status(statusCode).json(payload);
}

export function sendError(res: Response, message: string, statusCode = 500, errorCode?: string) {
  const requestId = (res.req as any).requestId || "";
  const payload: ApiResponse = {
    success: false,
    data: null,
    error: {
      message,
      code: errorCode,
    },
    message,
    timestamp: new Date().toISOString(),
    requestId,
  };
  return res.status(statusCode).json(payload);
}
