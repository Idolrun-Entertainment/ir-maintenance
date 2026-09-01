// Applies pending Prisma migrations before the Next.js build.
//
// On Vercel this only runs for Production deployments (pushes to `main`).
// Preview deployments are skipped so an unmerged branch can never apply its
// migrations to the production database.
import "dotenv/config"

import { spawnSync } from "node:child_process"

const { VERCEL_ENV } = process.env
const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL

if (VERCEL_ENV && VERCEL_ENV !== "production") {
  console.log(`[migrate] VERCEL_ENV=${VERCEL_ENV} — skipping migrate deploy.`)
  process.exit(0)
}

if (!migrationUrl) {
  console.error(
    "[migrate] No database URL. Set DIRECT_URL (unpooled) in the Vercel " +
      "project environment variables, Production scope, then redeploy."
  )
  process.exit(1)
}

console.log("[migrate] Running prisma migrate deploy...")

const result = spawnSync("prisma", ["migrate", "deploy"], {
  stdio: "inherit",
  shell: process.platform === "win32",
})

if (result.error) {
  console.error("[migrate] Failed to spawn prisma:", result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
