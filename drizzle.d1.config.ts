import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations/d1",
  schema: "./shared/schema.d1.ts",
  dialect: "sqlite",
});
