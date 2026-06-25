import { BranchRepository } from "../repositories/branch.repository.js";
import { BranchRecord } from "../database/db.js";
import crypto from "crypto";

export class BranchService {
  private branchRepository: BranchRepository;

  constructor() {
    this.branchRepository = new BranchRepository();
  }

  async getBranch(id: string, tenantId: string): Promise<BranchRecord | null> {
    return this.branchRepository.findById(id, tenantId);
  }

  async getBranchesForTenant(tenantId: string): Promise<BranchRecord[]> {
    return this.branchRepository.findAll(tenantId);
  }

  async createBranch(tenantId: string, model: Omit<BranchRecord, "branch_id" | "tenant_id" | "created_at">): Promise<BranchRecord> {
    const branch_id = `br_${crypto.randomBytes(8).toString("hex")}`;
    const newBranch: BranchRecord = {
      branch_id,
      tenant_id: tenantId,
      branch_name: model.branch_name,
      location: model.location,
      phone: model.phone,
      email: model.email,
      created_at: new Date().toISOString(),
    };
    return this.branchRepository.create(newBranch);
  }

  async updateBranch(id: string, tenantId: string, updates: Partial<Omit<BranchRecord, "branch_id" | "tenant_id" | "created_at">>): Promise<BranchRecord> {
    return this.branchRepository.update(id, tenantId, updates);
  }

  async deleteBranch(id: string, tenantId: string): Promise<boolean> {
    return this.branchRepository.delete(id, tenantId);
  }
}
