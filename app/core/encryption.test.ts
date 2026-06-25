import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "./encryption.js";

describe("Cryptographic Masking Engine (AES-256-CBC)", () => {
  it("should encrypt text correctly with deterministic formats", () => {
    const rawData = "john.doe@spareflow.com";
    const encrypted = encrypt(rawData);
    
    expect(encrypted).not.toBeNull();
    expect(encrypted).toContain(":"); // Must be joined by colon (ivHex:encryptedHex)
    
    const [iv, cipher] = encrypted!.split(":");
    expect(iv.length).toBe(32); // 16 bytes IV in hex is 32 chars
    expect(cipher.length).toBeGreaterThan(0);
  });

  it("should decrypt encrypted payload back to identical cleartext", () => {
    const original = "+91 98765 43210";
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(original);
  });

  it("should return the original input gracefully if parsing or format fails during decrypt", () => {
    const nonEncryptedValue = "invalid_format_string";
    const decrypted = decrypt(nonEncryptedValue);

    expect(decrypted).toBe(nonEncryptedValue);
  });

  it("should return null/undefined for empty or nullable parameters", () => {
    expect(encrypt(null)).toBeNull();
    expect(encrypt(undefined)).toBeNull();
    expect(decrypt(null)).toBeNull();
    expect(decrypt(undefined)).toBeNull();
  });
});
