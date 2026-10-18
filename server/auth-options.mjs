import { betterAuth } from "better-auth";

export function createConfiguredAuth(
  env,
  origin,
  database,
  ipHeaders = ["cf-connecting-ip"],
) {
  if (!env.BETTER_AUTH_SECRET)
    throw new Error("Authentication secret is not configured");
  return betterAuth({
    appName: "HEAT Pádel & Pickleball",
    baseURL: origin,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [origin],
    database,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
    },
    user: {
      additionalFields: {
        firstName: { type: "string", required: true },
        lastName: { type: "string", required: true },
        birthDate: { type: "string", required: true },
        nationality: { type: "string", required: true },
      },
    },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/email": { window: 60, max: 8 },
        "/sign-up/email": { window: 60, max: 5 },
      },
    },
    advanced: {
      ipAddress: { ipAddressHeaders: ipHeaders },
      useSecureCookies: origin.startsWith("https:"),
    },
  });
}
