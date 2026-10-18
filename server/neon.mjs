import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "./schema-postgres.mjs";
import { createConfiguredAuth } from "./auth-options.mjs";
import { createPostgresDatabase } from "./postgres-db.mjs";
import worker from "./worker.mjs";

let environment;
export function getNeonEnvironment() {
  if (environment) return environment;
  const { DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL } = process.env;
  if (!DATABASE_URL || !BETTER_AUTH_SECRET || !BETTER_AUTH_URL)
    throw new Error(
      "Missing DATABASE_URL, BETTER_AUTH_SECRET or BETTER_AUTH_URL",
    );
  const sql = neon(DATABASE_URL);
  const env = { BETTER_AUTH_SECRET, BETTER_AUTH_URL };
  const DB = createPostgresDatabase(
    (text, values) => sql.query(text, values, { fullResults: true }),
    (statements) =>
      sql.transaction(
        statements.map((s) => sql.query(s.sql, s.params)),
        {
          fullResults: true,
          isolationLevel: "RepeatableRead",
          readOnly: true,
        },
      ),
  );
  const AUTH = createConfiguredAuth(
    env,
    BETTER_AUTH_URL,
    drizzleAdapter(drizzle(sql), {
      provider: "pg",
      schema,
      transaction: false,
    }),
    ["x-vercel-forwarded-for"],
  );
  environment = { ...env, DB, AUTH };
  return environment;
}

export async function handleNodeRequest(request) {
  try {
    return await worker.fetch(request, getNeonEnvironment());
  } catch {
    // Configuration/driver errors must never disclose connection strings.
    console.error("HEAT backend configuration is unavailable");
    return Response.json(
      { error: "El servicio no está configurado. Contacta con el club." },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
