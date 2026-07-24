import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` runs on fresh installs (CI, Vercel previews) where no
// DIRECT_URL exists and no DB is needed; connecting commands (db push,
// migrate) fail loudly on the placeholder host instead of at config load.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx ./prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? "postgresql://direct-url-not-set.invalid:5432/quorum",
  },
});
