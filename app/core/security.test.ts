import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, signJwt, verifyJwt, TokenPayload } from "./security.js";

describe("Custom Security Helper Engine", () => {
  describe("PBKDF2 Password Hashing", () => {
    it("should hash passwords securely and generate standard structured strings", () => {
      const password = "my_secure_password_123";
      const storedHash = hashPassword(password);

      expect(storedHash).toContain(":");
      const [salt, iterationsStr, hash] = storedHash.split(":");
      expect(salt.length).toBe(32); // 16 random bytes as hex
      expect(iterationsStr).toBe("10000");
      expect(hash.length).toBeGreaterThan(30);
    });

    it("should verify correct password match against stored pbkdf2 hash", () => {
      const password = "correct_password";
      const storedHash = hashPassword(password);

      expect(verifyPassword(password, storedHash)).toBe(true);
      expect(verifyPassword("incorrect_password", storedHash)).toBe(false);
    });

    it("should handle corrupted or invalid hash string formats gracefully", () => {
      expect(verifyPassword("password", "invalid_hash_string")).toBe(false);
      expect(verifyPassword("password", "salt:notanumber:hash")).toBe(false);
    });
  });

  describe("Custom HS256 JWT Implementation", () => {
    const mockPayload: TokenPayload = {
      userId: "usr_12345",
      tenantId: "tnt_67890",
      branchId: "brn_11111",
      role: "Owner",
      email: "owner@spareflow.com"
    };

    it("should sign and verify JWT tokens successfully", () => {
      const token = signJwt(mockPayload, 300); // 5 min expiry
      expect(token.split(".").length).toBe(3);

      const verified = verifyJwt(token);
      expect(verified).not.toBeNull();
      expect(verified!.userId).toBe(mockPayload.userId);
      expect(verified!.tenantId).toBe(mockPayload.tenantId);
      expect(verified!.role).toBe(mockPayload.role);
    });

    it("should reject expired tokens", async () => {
      // Sign with a negative expiry (expired immediately)
      const token = signJwt(mockPayload, -10);
      const verified = verifyJwt(token);
      expect(verified).toBeNull();
    });

    it("should reject tokens with modified signatures", () => {
      const token = signJwt(mockPayload, 300);
      const parts = token.split(".");
      
      // Modify signature part
      parts[2] = "modified_signature_value";
      const tamperedToken = parts.join(".");
      
      const verified = verifyJwt(tamperedToken);
      expect(verified).toBeNull();
    });

    it("should reject malformed token strings", () => {
      expect(verifyJwt("not.a.token")).toBeNull();
      expect(verifyJwt("single_string_no_dots")).toBeNull();
    });
  });
});
