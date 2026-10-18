import { spawnSync } from "node:child_process";
const result = spawnSync(
  process.execPath,
  ["--test", "tests/reservations.test.mjs"],
  {
    stdio: "inherit",
    env: { ...process.env, HEAT_TEST_DATABASE: "postgres" },
  },
);
process.exit(result.status ?? 1);
