import crypto from "crypto";
import { CONFIG } from "./config.js";

export interface TokenPayload {
  userId: string;
  tenantId: string;
  branchId: string | null;
  role: string;
  email: string;
  exp?: number;
}

/**
 * Enterprise-grade PBKDF2 Password Hashing
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 10000;
  const hash = crypto
    .pbkdf2Sync(password, salt, iterations, 64, "sha512")
    .toString("hex");
  return `${salt}:${iterations}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, iterationsStr, hash] = storedHash.split(":");
    const iterations = parseInt(iterationsStr, 10);
    const newHash = crypto
      .pbkdf2Sync(password, salt, iterations, 64, "sha512")
      .toString("hex");
    return newHash === hash;
  } catch (err) {
    return false;
  }
}

/**
 * Base64 URL Encoding & Decoding helpers
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

/**
 * Custom Secure HS256 JWT Implementation (Zero native dependencies)
 */
export function signJwt(payload: TokenPayload, expirySeconds: number): string {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + expirySeconds;
  
  const fullPayload = { ...payload, exp };
  
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const hmac = crypto.createHmac("sha256", CONFIG.JWT_SECRET);
  const signature = base64UrlEncode(hmac.update(signatureInput).digest("base64"));
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyJwt(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const [encodedHeader, encodedPayload, signature] = parts;
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    
    const hmac = crypto.createHmac("sha256", CONFIG.JWT_SECRET);
    const expectedSignature = base64UrlEncode(hmac.update(signatureInput).digest("base64"));
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    const payloadJson = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(payloadJson) as TokenPayload;
    
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null; // Expired
    }
    
    return payload;
  } catch (err) {
    return null;
  }
}
