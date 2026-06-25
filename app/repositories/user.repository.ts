import { db } from "../../src/db/index.js";
import { users, type UserRecord } from "../../src/db/schema.js"; // Wait, user record type is different. We should just define the interface or use drizzle's infer type
import { eq, and } from "drizzle-orm";

export interface UserDTO {
  user_id: string;
  tenant_id: string;
  branch_id: string | null;
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

function mapToDTO(row: any): UserDTO {
  return {
    user_id: row.id,
    tenant_id: row.tenantId,
    branch_id: row.branchId,
    full_name: row.fullName,
    email: row.email,
    phone: row.phone || "",
    password_hash: row.passwordHash,
    role: row.role as "Owner" | "Manager" | "Staff",
    is_active: row.isActive,
    last_login: row.lastLogin ? String(row.lastLogin) : null,
    created_at: String(row.createdAt),
    updated_at: String(row.updatedAt),
  };
}

export interface IUserRepository {
  findById(id: string, tenantId: string): Promise<UserDTO | null>;
  findByEmail(email: string): Promise<UserDTO | null>;
  findAll(tenantId: string): Promise<UserDTO[]>;
  create(user: UserDTO): Promise<UserDTO>;
  update(id: string, tenantId: string, updates: Partial<Omit<UserDTO, "user_id" | "tenant_id" | "created_at">>): Promise<UserDTO>;
  delete(id: string, tenantId: string): Promise<boolean>;
}

export class UserRepository implements IUserRepository {
  async findById(id: string, tenantId: string): Promise<UserDTO | null> {
    const res = await db.select().from(users).where(and(eq(users.id, id), eq(users.tenantId, tenantId))).limit(1);
    if (res.length === 0) return null;
    return mapToDTO(res[0]);
  }

  async findByEmail(email: string): Promise<UserDTO | null> {
    const res = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
    if (res.length === 0) return null;
    return mapToDTO(res[0]);
  }

  async findAll(tenantId: string): Promise<UserDTO[]> {
    const res = await db.select().from(users).where(eq(users.tenantId, tenantId));
    return res.map(mapToDTO);
  }

  async create(user: UserDTO): Promise<UserDTO> {
    const res = await db.insert(users).values({
      id: user.user_id,
      tenantId: user.tenant_id,
      branchId: user.branch_id,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      passwordHash: user.password_hash,
      role: user.role,
      isActive: user.is_active,
    }).returning();
    return mapToDTO(res[0]);
  }

  async update(
    id: string,
    tenantId: string,
    updates: Partial<Omit<UserDTO, "user_id" | "tenant_id" | "created_at">>
  ): Promise<UserDTO> {
    const payload: any = {};
    if (updates.full_name !== undefined) payload.fullName = updates.full_name;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.password_hash !== undefined) payload.passwordHash = updates.password_hash;
    if (updates.role !== undefined) payload.role = updates.role;
    if (updates.is_active !== undefined) payload.isActive = updates.is_active;
    if (updates.branch_id !== undefined) payload.branchId = updates.branch_id;
    if (updates.last_login !== undefined) payload.lastLogin = updates.last_login ? new Date(updates.last_login) : null;
    payload.updatedAt = new Date();

    const res = await db.update(users).set(payload).where(and(eq(users.id, id), eq(users.tenantId, tenantId))).returning();
    if (res.length === 0) throw new Error("User not found for update");
    return mapToDTO(res[0]);
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const res = await db.delete(users).where(and(eq(users.id, id), eq(users.tenantId, tenantId))).returning();
    return res.length > 0;
  }
}
