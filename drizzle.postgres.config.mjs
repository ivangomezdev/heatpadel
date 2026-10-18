import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./server/schema-postgres.mjs",
  out: "./drizzle-postgres",
  dialect: "postgresql",
});
