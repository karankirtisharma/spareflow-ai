import { db } from "../../src/db/index.js";
import { tenants } from "../../src/db/schema.js";
import { TenantRecord } from "../database/db.js";
import { eq } from "drizzle-orm";

export interface ITenantRepository {
  findById(id: string): Promise<TenantRecord | null>;
  findAll(): Promise<TenantRecord[]>;
  create(tenant: TenantRecord): Promise<TenantRecord>;
}

function mapToRecord(row: any): TenantRecord {
  return {
    tenant_id: row.id,
    business_name: row.businessName,
    business_type: row.businessType,
    plan: row.plan || "free",
    is_active: !!row.isActive,
    created_at: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    updated_at: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export class TenantRepository implements ITenantRepository {
  async findById(id: string): Promise<TenantRecord | null> {
    const res = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    if (res.length === 0) return null;
    return mapToRecord(res[0]);
  }

  async findAll(): Promise<TenantRecord[]> {
    const res = await db.select().from(tenants);
    return res.map(mapToRecord);
  }

  async create(tenant: TenantRecord): Promise<TenantRecord> {
    const res = await db.insert(tenants).values({
      id: tenant.tenant_id,
      businessName: tenant.business_name,
      businessType: tenant.business_type,
      plan: tenant.plan,
      isActive: tenant.is_active,
    }).returning();
    return mapToRecord(res[0]);
  }
}

