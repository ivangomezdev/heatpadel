import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema.mjs";
import { createConfiguredAuth } from "./auth-options.mjs";

export function createAuth(env, origin) {
  return createConfiguredAuth(
    env,
    origin,
    drizzleAdapter(drizzle(env.DB), {
      provider: "sqlite",
      schema,
      transaction: false,
    }),
  );
}
