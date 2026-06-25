import dotenv from "dotenv";

dotenv.config();

export const CONFIG = {
  PORT: parseInt(process.env.PORT || "3000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  JWT_SECRET: process.env.JWT_SECRET || "spareflow_jwt_secret_super_secure_key_2026",
  JWT_ACCESS_EXPIRY: "15m", // 15 minutes
  JWT_REFRESH_EXPIRY: "7d",   // 7 days
  ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET || "spareflow_encryption_master_key_default_32bytes_value_2026",
  APP_URL: process.env.APP_URL || "http://localhost:3000",
};
