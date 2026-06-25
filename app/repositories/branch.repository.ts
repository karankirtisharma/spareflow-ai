import { db } from "../../src/db/index.js";
import { branches } from "../../src/db/schema.js";
import { BranchRecord } from "../database/db.js";
import { eq, and } from "drizzle-orm";

export interface IBranchRepository {
  findById(id: string, tenantId: string): Promise<BranchRecord | null>;
  findAll(tenantId: string): Promise<BranchRecord[]>;
  create(branch: BranchRecord): Promise<BranchRecord>;
  update(id: string, tenantId: string, updates: Partial<Omit<BranchRecord, "branch_id" | "tenant_id" | "created_at">>): Promise<BranchRecord>;
  delete(id: string, tenantId: string): Promise<boolean>;
}

function mapToRecord(row: any): BranchRecord {
  return {
    branch_id: row.id,
    tenant_id: row.tenantId,
    branch_name: row.branchName,
    location: row.location || "",
    phone: row.phone || "",
    email: row.email || "",
    created_at: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
  };
}

export class BranchRepository implements IBranchRepository {
  async findById(id: string, tenantId: string): Promise<BranchRecord | null> {
    const res = await db.select().from(branches).where(and(eq(branches.id, id), eq(branches.tenantId, tenantId))).limit(1);
    if (res.length === 0) return null;
    return mapToRecord(res[0]);
  }

  async findAll(tenantId: string): Promise<BranchRecord[]> {
    const res = await db.select().from(branches).where(eq(branches.tenantId, tenantId));
    return res.map(mapToRecord);
  }

  async create(branch: BranchRecord): Promise<BranchRecord> {
    const res = await db.insert(branches).values({
      id: branch.branch_id,
      tenantId: branch.tenant_id,
      branchName: branch.branch_name,
      location: branch.location,
      phone: branch.phone,
      email: branch.email,
    }).returning();
    return mapToRecord(res[0]);
  }

  async update(
    id: string,
    tenantId: string,
    updates: Partial<Omit<BranchRecord, "branch_id" | "tenant_id" | "created_at">>
  ): Promise<BranchRecord> {
    const payload: any = {};
    if (updates.branch_name !== undefined) payload.branchName = updates.branch_name;
    if (updates.location !== undefined) payload.location = updates.location;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.email !== undefined) payload.email = updates.email;

    const res = await db.update(branches)
      .set(payload)
      .where(and(eq(branches.id, id), eq(branches.tenantId, tenantId)))
      .returning();
      
    if (res.length === 0) {
      throw new Error(`Branch with ID ${id} not found in Tenant ${tenantId}`);
    }
    return mapToRecord(res[0]);
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const res = await db.delete(branches)
      .where(and(eq(branches.id, id), eq(branches.tenantId, tenantId)))
      .returning();
    return res.length > 0;
  }
}

