import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./server/schema.mjs",
  out: "./drizzle",
  dialect: "sqlite",
});
