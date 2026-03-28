import { Pool, PoolClient, QueryResult } from "pg";
import crypto from "crypto";

type DeploymentMode = "supabase" | "self_hosted";

const deploymentMode = (() => {
  const raw = (process.env.DEPLOYMENT_MODE ?? "supabase").toLowerCase();
  return raw === "self_hosted" ? "self_hosted" : "supabase";
})();

const connectionString = (() => {
  if (deploymentMode === "supabase") {
    return process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
  }
  return process.env.SELF_HOSTED_DATABASE_URL ?? process.env.DATABASE_URL;
})();

if (!connectionString) {
  throw new Error(
    "Missing database connection string. Set SUPABASE_DB_URL (supabase) or SELF_HOSTED_DATABASE_URL (self_hosted)."
  );
}

const pool = new Pool({ connectionString, max: Number(process.env.DB_POOL_SIZE ?? 10) });

export const withDb = async <T>(worker: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await worker(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const query = async <T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> => {
  return pool.query<T>(sql, params);
};

export const dbInfo = {
  mode: deploymentMode,
  connectionHash: crypto.createHash("sha256").update(connectionString).digest("hex").slice(0, 8),
};

export const healthCheck = async () => {
  const start = Date.now();
  await query("SELECT 1");
  return { latencyMs: Date.now() - start, mode: deploymentMode };
};

// Create a simple client wrapper for compatibility
export const createClient = () => ({
  query: pool.query.bind(pool),
});
