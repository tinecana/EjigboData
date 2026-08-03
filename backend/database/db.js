/**
 * PWMS ENTERPRISE REFACTOR — SPRINT 2: DATABASE LAYER
 * =====================================================================
 * Uses `pg` directly (not the Supabase JS client) specifically so real
 * BEGIN/COMMIT/ROLLBACK transactions are available — the Supabase REST
 * client has no multi-statement transaction primitive, and faking
 * atomicity with sequential calls would silently violate the "Support
 * transactions" requirement rather than fulfill it.
 *
 * Requires:
 *   DATABASE_URL   — a standard Postgres connection string (Supabase
 *                     exposes this under Project Settings > Database).
 */

const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("[DB] Missing DATABASE_URL environment variable.");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL && DATABASE_URL.includes("supabase") ? { rejectUnauthorized: false } : undefined
});

pool.on("error", (err) => {
  // A background/idle client error must never crash the server.
  console.error("[DB] Unexpected error on idle client", err);
});

async function query(text, params) {
  return pool.query(text, params);
}

// Runs `fn(client)` inside a real transaction. Any thrown error rolls
// back everything the callback did; success commits it all atomically.
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {}); // never let rollback itself throw over the original error
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
