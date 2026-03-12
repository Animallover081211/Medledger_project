import {defineConfig} from "drizzle-kit";

export default defineConfig({
  schema: "./lib/server/repositories/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
});
