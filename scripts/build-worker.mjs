import { build } from "esbuild";
import { cp, mkdir, writeFile, readFile } from "node:fs/promises";

await mkdir("dist/server", { recursive: true });
await mkdir("dist/.openai", { recursive: true });
await build({
  entryPoints: ["server/worker.mjs"],
  outfile: "dist/server/index.js",
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "es2022",
  conditions: ["workerd", "worker", "browser"],
  mainFields: ["module", "main"],
  external: ["node:*", "cloudflare:*"],
  minify: true,
});
await cp("out", "dist/client", { recursive: true });
await cp(".openai/hosting.json", "dist/.openai/hosting.json");
await cp("drizzle", "dist/.openai/drizzle", { recursive: true });
const config = JSON.parse(await readFile("wrangler.json", "utf8"));
await writeFile(
  "dist/server/wrangler.json",
  JSON.stringify(
    {
      ...config,
      main: "index.js",
      assets: { ...config.assets, directory: "../client" },
    },
    null,
    2,
  ),
);
console.log("HEAT Worker, Next.js pages and migrations built in dist/");
