import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";

export async function migrationStatements() {
  const directory = new URL("../drizzle-postgres/", import.meta.url);
  const statements = [
    "SELECT pg_advisory_xact_lock(742019826)",
    "CREATE TABLE IF NOT EXISTS heat_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
  ];
  for (const file of (await readdir(directory))
    .filter((name) => name.endsWith(".sql"))
    .sort()) {
    if (!/^[a-zA-Z0-9_-]+\.sql$/.test(file))
      throw new Error("Invalid migration filename");
    const source = (await readFile(new URL(file, directory), "utf8")).replace(
      /\r\n/g,
      "\n",
    );
    const checksum = createHash("sha256").update(source).digest("hex");
    statements.push(`DO $heat_migration$
      BEGIN
        IF EXISTS (SELECT 1 FROM heat_migrations WHERE name='${file}' AND checksum<>'${checksum}') THEN
          RAISE EXCEPTION 'Previously applied HEAT migration was modified';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM heat_migrations WHERE name='${file}') THEN
          ${source}
          INSERT INTO heat_migrations(name,checksum) VALUES ('${file}','${checksum}');
        END IF;
      END $heat_migration$;`);
  }
  return statements;
}
