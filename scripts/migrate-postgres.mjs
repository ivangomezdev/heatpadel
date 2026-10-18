import { neon } from "@neondatabase/serverless";
import { migrationStatements } from "../server/postgres-migrations.mjs";

try {
  if (!process.env.DATABASE_URL) throw new Error("Missing DATABASE_URL");
  const sql = neon(process.env.DATABASE_URL);
  const statements = await migrationStatements();
  await sql.transaction(statements.map((text) => sql.query(text)));
  console.log("HEAT PostgreSQL migrations applied successfully.");
} catch (error) {
  console.error(
    "HEAT database migration failed. Check DATABASE_URL and Neon availability.",
    { code: error.code || "CONFIGURATION_OR_CONNECTION" },
  );
  process.exitCode = 1;
}
