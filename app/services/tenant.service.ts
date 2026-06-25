import { TenantRepository } from "../repositories/tenant.repository.js";
import { TenantRecord } from "../database/db.js";

export class TenantService {
  private tenantRepository: TenantRepository;

  constructor() {
    this.tenantRepository = new TenantRepository();
  }

  async getTenant(tenantId: string): Promise<TenantRecord | null> {
    return this.tenantRepository.findById(tenantId);
  }

  async getAllTenants(): Promise<TenantRecord[]> {
    return this.tenantRepository.findAll();
  }
}
