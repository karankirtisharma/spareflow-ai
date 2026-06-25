import crypto from "crypto";
import { CONFIG } from "./config.js";

// Deriving a standard 32-byte (256-bit) encryption key from the JWT_SECRET
const MASTER_KEY = crypto.createHash("sha256").update(CONFIG.JWT_SECRET || "spareflow-system-super-secret-master-key-value").digest();
const ALGORITHM = "aes-256-cbc";

/**
 * Encrypts cleartext using AES-256-CBC with a random IV
 */
export function encrypt(text: string | null | undefined): string | null {
  if (!text) return null;
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    // Return iv and encrypted hex joined by a colon
    return `${iv.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("Encryption failed:", error);
    return null;
  }
}

/**
 * Decrypts standard ciphertext string
 */
export function decrypt(cipherText: string | null | undefined): string | null {
  if (!cipherText) return null;
  try {
    const [ivHex, encryptedHex] = cipherText.split(":");
    if (!ivHex || !encryptedHex) return cipherText; // Return original if not formatted
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, MASTER_KEY, iv);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    // If decryption fails, it might be unencrypted legacy data or incorrect format. Return safe original
    return cipherText;
  }
}
