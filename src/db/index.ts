import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
const { Pool } = pg;
import * as schema from "./schema.ts";

export const createPool = () => {
  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 10000, // close idle connections after 10s to avoid using terminated sockets
    max: process.env.SQL_POOL_MAX ? parseInt(process.env.SQL_POOL_MAX, 10) : 15,                  // limit pool size to conserve connections, configurable under load
    keepAlive: true,          // enable TCP keep-alive to maintain active connection tunnels
  });
};

const pool = createPool();

pool.on("error", (err) => {
  console.error("Unexpected error on idle SQL pool client:", err);
});

export const db = drizzle(pool, { schema });
