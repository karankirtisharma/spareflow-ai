export interface Tenant {
  tenant_id: string;
  business_name: string;
  business_type: string;
  plan: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  branch_id: string;
  tenant_id: string;
  branch_name: string;
  location: string;
  phone: string;
  email: string;
  created_at: string;
}

export interface User {
  user_id: string;
  tenant_id: string;
  branch_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  role: "Owner" | "Manager" | "Staff";
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
  tenant: Tenant;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  url: string;
  status: number;
  requestBody?: any;
  responseBody?: any;
}
