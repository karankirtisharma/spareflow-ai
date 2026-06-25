import { TenantRecord, BranchRecord, UserRecord } from "../database/db.js";

// Helper validator functions
export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validateRequired(fields: Record<string, any>, requiredKeys: string[]): string | null {
  for (const key of requiredKeys) {
    if (fields[key] === undefined || fields[key] === null || fields[key] === "") {
      return `Missing required field: ${key}`;
    }
  }
  return null;
}

// Interfaces for Requests
export interface RegisterBusinessRequest {
  business_name: string;
  business_type: string;
  plan: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  owner_password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface CreateBranchRequest {
  branch_name: string;
  location: string;
  phone: string;
  email: string;
}

export interface CreateUserRequest {
  full_name: string;
  email: string;
  phone: string;
  password?: string; // Optional if we auto-generate, but let's make it required or optional
  role: "Owner" | "Manager" | "Staff";
  branch_id?: string | null;
}

// Response DTO Sanitizers
export interface UserResponse {
  user_id: string;
  tenant_id: string;
  branch_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export function sanitizeUser(user: UserRecord): UserResponse {
  return {
    user_id: user.user_id,
    tenant_id: user.tenant_id,
    branch_id: user.branch_id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    is_active: user.is_active,
    last_login: user.last_login,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserResponse;
  tenant: TenantRecord;
}
