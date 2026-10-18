import { spawnSync } from "node:child_process";

function run(file, args = []) {
  const result = spawnSync(process.execPath, [file, ...args], {
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status || 1);
}

const nodeRuntime =
  process.env.VERCEL === "1" || process.env.HEAT_RUNTIME === "node";
// Vercel Production applies versioned additive migrations before deploying.
// Previews require a separate database, migrated explicitly, to protect Production.
if (process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production")
  run("scripts/migrate-postgres.mjs");
run("node_modules/next/dist/bin/next", ["build"]);
if (!nodeRuntime) run("scripts/build-worker.mjs");
