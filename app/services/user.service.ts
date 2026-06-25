import { UserRepository, UserDTO } from "../repositories/user.repository.js";
import { hashPassword } from "../core/security.js";
import crypto from "crypto";

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getUser(id: string, tenantId: string): Promise<UserDTO | null> {
    return this.userRepository.findById(id, tenantId);
  }

  async getUsersForTenant(tenantId: string): Promise<UserDTO[]> {
    return this.userRepository.findAll(tenantId);
  }

  async createUser(
    tenantId: string,
    model: Omit<UserDTO, "user_id" | "tenant_id" | "password_hash" | "is_active" | "last_login" | "created_at" | "updated_at"> & { password?: string }
  ): Promise<UserDTO> {
    const user_id = `usr_${crypto.randomBytes(8).toString("hex")}`;
    const plainPassword = model.password || "Spareflow@2026"; // Default password if not specified
    const password_hash = hashPassword(plainPassword);

    const newUser: UserDTO = {
      user_id,
      tenant_id: tenantId,
      branch_id: model.branch_id || null,
      full_name: model.full_name,
      email: model.email.toLowerCase().trim(),
      phone: model.phone,
      password_hash,
      role: model.role,
      is_active: true,
      last_login: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return this.userRepository.create(newUser);
  }

  async updateUser(
    id: string,
    tenantId: string,
    updates: Partial<Omit<UserDTO, "user_id" | "tenant_id" | "created_at">> & { password?: string }
  ): Promise<UserDTO> {
    const formattedUpdates: any = { ...updates };
    if (updates.password) {
      formattedUpdates.password_hash = hashPassword(updates.password);
      delete formattedUpdates.password;
    }
    return this.userRepository.update(id, tenantId, formattedUpdates);
  }

  async deleteUser(id: string, tenantId: string): Promise<boolean> {
    return this.userRepository.delete(id, tenantId);
  }
}
