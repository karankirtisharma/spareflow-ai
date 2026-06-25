import { db } from "../../src/db/index.js";
import { tenants, users } from "../../src/db/schema.js";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, signJwt, verifyJwt, TokenPayload } from "../core/security.js";
import { RegisterBusinessRequest, LoginRequest, AuthResponse, sanitizeUser } from "../schemas/schemas.js";
import crypto from "crypto";
import { UserRepository } from "../repositories/user.repository.js";
// Using straight drizzle for tenants since we didn't implement TenantRepository yet

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async registerBusiness(req: RegisterBusinessRequest): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findByEmail(req.owner_email);
    if (existingUser) {
      throw new Error(`Email ${req.owner_email} is already registered.`);
    }

    // 1. Create Tenant (Business)
    const tenant_id = `tnt_${crypto.randomBytes(8).toString("hex")}`;
    const newTenantData = {
      id: tenant_id,
      businessName: req.business_name,
      businessType: req.business_type,
      plan: req.plan || "growth",
      isActive: true,
    };
    const tResults = await db.insert(tenants).values(newTenantData).returning();
    const newTenant = {
      tenant_id: tResults[0].id,
      business_name: tResults[0].businessName,
      business_type: tResults[0].businessType,
      plan: tResults[0].plan!,
      is_active: tResults[0].isActive!,
      created_at: String(tResults[0].createdAt),
      updated_at: String(tResults[0].updatedAt)
    };

    // 2. Create Owner Account
    const user_id = `usr_${crypto.randomBytes(8).toString("hex")}`;
    const password_hash = hashPassword(req.owner_password);
    const newOwner = await this.userRepository.create({
      user_id,
      tenant_id,
      branch_id: null,
      full_name: req.owner_name,
      email: req.owner_email,
      phone: req.owner_phone || "",
      password_hash,
      role: "Owner",
      is_active: true,
      last_login: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // 3. Issue Tokens
    const payload: TokenPayload = {
      userId: newOwner.user_id,
      tenantId: newOwner.tenant_id,
      branchId: newOwner.branch_id,
      role: newOwner.role,
      email: newOwner.email,
    };

    const accessToken = signJwt(payload, 15 * 60); // 15 minutes
    const refreshToken = signJwt(payload, 7 * 24 * 60 * 60); // 7 days

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "Bearer",
      user: sanitizeUser(newOwner as any),
      tenant: newTenant,
    };
  }

  async login(req: LoginRequest): Promise<AuthResponse> {
    const emailSanitized = (req.email || "").toLowerCase().trim();
    console.log(`[AuthService.login] Attempting login for email: "${emailSanitized}"`);
    const user = await this.userRepository.findByEmail(emailSanitized);
    if (!user) {
      console.log(`[AuthService.login] Authentication failed: User not found for email: "${emailSanitized}"`);
      throw new Error("Invalid email or password");
    }

    if (!user.is_active) {
      console.log(`[AuthService.login] Authentication failed: User account is inactive: "${emailSanitized}"`);
      throw new Error("User account is deactivated");
    }

    const isValid = verifyPassword(req.password, user.password_hash);
    console.log(`[AuthService.login] Password verification for "${emailSanitized}": ${isValid ? "SUCCESS" : "FAILED"}`);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    // Update last login
    const updatedUser = await this.userRepository.update(user.user_id, user.tenant_id, {
      last_login: new Date().toISOString()
    });

    const tenantRes = await db.select().from(tenants).where(eq(tenants.id, user.tenant_id)).limit(1);
    if (tenantRes.length === 0 || !tenantRes[0].isActive) {
      throw new Error("Business subscription is inactive.");
    }
    const tenant = {
      tenant_id: tenantRes[0].id,
      business_name: tenantRes[0].businessName,
      business_type: tenantRes[0].businessType,
      plan: tenantRes[0].plan!,
      is_active: tenantRes[0].isActive!,
      created_at: String(tenantRes[0].createdAt),
      updated_at: String(tenantRes[0].updatedAt)
    };

    const payload: TokenPayload = {
      userId: user.user_id,
      tenantId: user.tenant_id,
      branchId: user.branch_id,
      role: user.role,
      email: user.email,
    };

    const accessToken = signJwt(payload, 15 * 60); // 15 minutes
    const refreshToken = signJwt(payload, 7 * 24 * 60 * 60); // 7 days

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "Bearer",
      user: sanitizeUser(updatedUser as any),
      tenant,
    };
  }

  async refreshToken(rToken: string): Promise<{ access_token: string; refresh_token: string }> {
    const payload = verifyJwt(rToken);
    if (!payload) {
      throw new Error("Invalid or expired refresh token");
    }

    const res = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
    if (res.length === 0 || !res[0].isActive) {
      throw new Error("User associated with this token is no longer active");
    }
    const user = res[0];

    const nextPayload: TokenPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      branchId: user.branchId,
      role: user.role,
      email: user.email,
    };

    const accessToken = signJwt(nextPayload, 15 * 60);
    const refreshToken = signJwt(nextPayload, 7 * 24 * 60 * 60);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async changePassword(userId: string, tenantId: string, oldPw: string, newPw: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId, tenantId);
    if (!user) {
      throw new Error("User not found");
    }

    const isValid = verifyPassword(oldPw, user.password_hash);
    if (!isValid) {
      throw new Error("Incorrect current password");
    }

    await this.userRepository.update(userId, tenantId, {
      password_hash: hashPassword(newPw),
    });

    return true;
  }
}
