import { timingSafeEqual } from "node:crypto"

import { after } from "next/server"
import type { NextRequest } from "next/server"

import { TooManyRequestsError, UnauthorizedError } from "@/lib/errors"
import { handleError, successResponse } from "@/lib/http"
import { rateLimit } from "@/lib/rate-limit"
import { requireAdmin } from "@/lib/require-admin"
import {
  translationBackfillSchema,
  translationRetrySchema,
  translationStatusQuerySchema,
} from "@/lib/schemas/translation"
import { backfillPage } from "@/server/translation/backfill"
import { getTranslationEngine } from "@/server/translation"
import { prismaTranslationStore } from "@/server/translation/store.prisma"

// Vercel Cron's function budget (see maxDuration on the route) minus headroom.
const CRON_BUDGET_MS = 50_000
const ADMIN_LIMIT = { limit: 30, windowMs: 60_000 }

function isCronAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET

  // Fail closed: with no secret configured nobody can trigger the sweep.
  if (!secret) return false

  const expected = Buffer.from(`Bearer ${secret}`)
  const actual = Buffer.from(request.headers.get("authorization") ?? "")

  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export const translationController = {
  /** Per-locale status for admin lists. Includes error text, so admin only. */
  async status(request: NextRequest) {
    try {
      await requireAdmin({ mode: "api" })
      const { searchParams } = new URL(request.url)
      const query = translationStatusQuerySchema.parse({
        kind: searchParams.get("kind"),
        ids: searchParams.get("ids"),
      })

      const statuses = await getTranslationEngine().statuses(query.kind, query.ids)

      return successResponse(
        Object.fromEntries(statuses),
        "Translation status retrieved successfully",
      )
    } catch (error) {
      return handleError(error)
    }
  },

  async retry(request: NextRequest) {
    try {
      await requireAdmin({ mode: "api" })

      if (!rateLimit(request, "translation-admin", ADMIN_LIMIT)) {
        throw new TooManyRequestsError()
      }

      const body = translationRetrySchema.parse(await request.json())
      const engine = getTranslationEngine()
      const result = await engine.retry(body.kind, body.id, {
        locales: body.locales,
        force: body.force,
      })

      after(async () => {
        await engine.drain({ kind: body.kind, entityId: body.id })
      })

      return successResponse(result, "Translation retry queued")
    } catch (error) {
      return handleError(error)
    }
  },

  /**
   * Queues one page of missing/outdated translations and returns the cursor
   * for the next call. Processing is left to the cron sweep (and an immediate
   * best-effort drain), so this stays within a normal request budget.
   */
  async backfill(request: NextRequest) {
    try {
      await requireAdmin({ mode: "api" })

      if (!rateLimit(request, "translation-admin", ADMIN_LIMIT)) {
        throw new TooManyRequestsError()
      }

      const body = translationBackfillSchema.parse(await request.json())
      const engine = getTranslationEngine()
      const result = await backfillPage(
        { store: prismaTranslationStore, engine },
        { kind: body.kind, cursor: body.cursor, take: body.limit, dryRun: body.dryRun },
      )

      if (!body.dryRun) {
        after(async () => {
          await engine.drain({ limit: 20 })
        })
      }

      return successResponse(result, body.dryRun ? "Dry run complete" : "Backfill page queued")
    } catch (error) {
      return handleError(error)
    }
  },

  /** Vercel Cron sweep: retries, expired leases, anything the inline drain missed. */
  async cron(request: NextRequest) {
    try {
      if (!isCronAuthorized(request)) {
        throw new UnauthorizedError()
      }

      const summary = await getTranslationEngine().drain({
        limit: 50,
        deadline: Date.now() + CRON_BUDGET_MS,
      })

      return successResponse(summary, "Translation sweep complete")
    } catch (error) {
      return handleError(error)
    }
  },
}
