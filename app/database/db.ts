export interface TenantRecord {
  tenant_id: string;
  business_name: string;
  business_type: string;
  plan: string; // e.g. "free" | "growth" | "enterprise"
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BranchRecord {
  branch_id: string;
  tenant_id: string;
  branch_name: string;
  location: string;
  phone: string;
  email: string;
  created_at: string;
}

export interface UserRecord {
  user_id: string;
  tenant_id: string;
  branch_id: string | null; // NULL for global Owner, specific for Branch Managers and Staff
  full_name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: "Owner" | "Manager" | "Staff";
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}
