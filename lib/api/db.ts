import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
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

export const query = async <T extends QueryResultRow = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> => {
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
// Returns db object with query builder for Phase 3A code
export const createClient = () => db;

// Export db object for email/trust APIs with compatibility methods
export const db = {
  query: pool.query.bind(pool),
  
  // Compatibility methods for Phase 3A code
  // TODO: Refactor Phase 3A code to use withDb/query directly
  async queryOne<T extends QueryResultRow = any>(sql: string, params: any[] = []): Promise<T | null> {
    const result = await pool.query<T>(sql, params);
    return result.rows[0] || null;
  },
  
  // Query builder compatibility (minimal implementation)
  from(table: string) {
    let selectCols = '*';
    let whereClauses: string[] = [];
    let whereValues: any[] = [];
    let orderClause = '';
    
    return {
      select: (columns: string = '*') => {
        selectCols = columns;
        return {
          eq: (column: string, value: any) => {
            whereClauses.push(`${column} = $${whereValues.length + 1}`);
            whereValues.push(value);
            return {
              order: (col: string, opts?: { ascending?: boolean }) => {
                orderClause = `ORDER BY ${col} ${opts?.ascending ? 'ASC' : 'DESC'}`;
                return {
                  async execute() {
                    const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
                    const result = await pool.query(
                      `SELECT ${selectCols} FROM ${table} ${where} ${orderClause}`,
                      whereValues
                    );
                    return { data: result.rows, error: null };
                  }
                };
              },
              single: async () => {
                const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
                const result = await pool.query(
                  `SELECT ${selectCols} FROM ${table} ${where} LIMIT 1`,
                  whereValues
                );
                return { data: result.rows[0] || null, error: null };
              },
            };
          },
          gte: (column: string, value: any) => {
            whereClauses.push(`${column} >= $${whereValues.length + 1}`);
            whereValues.push(value);
            return {
              order: (col: string, opts?: { ascending?: boolean }) => {
                orderClause = `ORDER BY ${col} ${opts?.ascending ? 'ASC' : 'DESC'}`;
                return {
                  async execute() {
                    const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
                    const result = await pool.query(
                      `SELECT ${selectCols} FROM ${table} ${where} ${orderClause}`,
                      whereValues
                    );
                    return { data: result.rows, error: null };
                  }
                };
              },
              async execute() {
                const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
                const result = await pool.query(
                  `SELECT ${selectCols} FROM ${table} ${where}`,
                  whereValues
                );
                return { data: result.rows, error: null };
              }
            };
          },
          order: (col: string, opts?: { ascending?: boolean }) => {
            orderClause = `ORDER BY ${col} ${opts?.ascending ? 'ASC' : 'DESC'}`;
            return {
              async execute() {
                const result = await pool.query(
                  `SELECT ${selectCols} FROM ${table} ${orderClause}`
                );
                return { data: result.rows, error: null };
              }
            };
          },
          async execute() {
            const result = await pool.query(`SELECT ${selectCols} FROM ${table}`);
            return { data: result.rows, error: null };
          },
        };
      },
      insert: (values: any) => ({
        async execute() {
          const keys = Object.keys(values);
          const vals = Object.values(values);
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
          const result = await pool.query(
            `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
            vals
          );
          return { data: result.rows[0], error: null };
        },
      }),
      update: (values: any) => ({
        eq: (column: string, value: any) => ({
          async execute() {
            const keys = Object.keys(values);
            const vals = Object.values(values);
            const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
            const result = await pool.query(
              `UPDATE ${table} SET ${sets} WHERE ${column} = $${vals.length + 1} RETURNING *`,
              [...vals, value]
            );
            return { data: result.rows[0], error: null };
          },
        }),
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({
          async execute() {
            await pool.query(`DELETE FROM ${table} WHERE ${column} = $1`, [value]);
            return { error: null };
          },
        }),
      }),
    };
  },
};
