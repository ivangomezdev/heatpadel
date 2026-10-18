import { spawn } from "node:child_process";
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "--hostname", "0.0.0.0"],
  {
    stdio: "inherit",
    env: { ...process.env, HEAT_RUNTIME: "node" },
  },
);
child.on("exit", (code) => process.exit(code || 0));
