import "dotenv/config"
import { defineConfig } from "prisma/config"

// Migrations must run over a direct (unpooled) connection. Neon's `-pooler`
// endpoint is PgBouncer, which breaks the advisory locks and session-level
// DDL state that `prisma migrate` depends on. The app itself still uses the
// pooled DATABASE_URL at runtime (see src/lib/prisma.ts).
const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL

if (!migrationUrl) {
  throw new Error("Set DIRECT_URL (preferred) or DATABASE_URL for Prisma CLI.")
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: migrationUrl,
  },
})
