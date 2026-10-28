import { TARGET_LOCALES, LOCALE_META, type TargetLocale } from "@/i18n/config"

import { hashSource, planSource } from "./entities"
import {
  PermanentTranslationError,
  type Kind,
  type LocaleStatus,
  type Row,
  type Source,
  type TranslationStatus,
  type TranslationStore,
  type Translator,
} from "./types"

export const MAX_ATTEMPTS = 5
export const LEASE_MS = 5 * 60_000
const MAX_SOURCE_CHARS = 200_000
const MAX_BATCH_STRINGS = 100
const MAX_BATCH_CHARS = 20_000
const CALL_RETRIES = 3

type Clock = {
  now: () => Date
  sleep: (ms: number) => Promise<void>
  random: () => number
}

const systemClock: Clock = {
  now: () => new Date(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  random: Math.random,
}

// gRPC codes that are worth retrying: ABORTED, RESOURCE_EXHAUSTED, INTERNAL,
// UNAVAILABLE, DEADLINE_EXCEEDED.
const TRANSIENT_GRPC = new Set([4, 8, 10, 13, 14])
const PERMANENT_GRPC = new Set([3, 5, 7, 12, 16])
const TRANSIENT_NET = new Set(["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED"])

export function isTransient(error: unknown): boolean {
  if (error instanceof PermanentTranslationError) return false

  const e = error as { code?: unknown; status?: unknown; statusCode?: unknown } | null
  const http =
    typeof e?.status === "number"
      ? e.status
      : typeof e?.statusCode === "number"
        ? e.statusCode
        : typeof e?.code === "number" && e.code >= 400
          ? e.code
          : null

  if (http !== null) return http === 408 || http === 429 || http >= 500
  if (typeof e?.code === "number") return !PERMANENT_GRPC.has(e.code) || TRANSIENT_GRPC.has(e.code)
  if (typeof e?.code === "string" && TRANSIENT_NET.has(e.code)) return true

  // Unknown errors are retried, but the per-row attempt cap bounds them.
  return true
}

/** Full-jitter exponential backoff. */
export function backoffMs(attempt: number, baseMs: number, capMs: number, random = Math.random) {
  return Math.floor(random() * Math.min(capMs, baseMs * 2 ** attempt))
}

export async function retryTransient<T>(
  fn: () => Promise<T>,
  clock: Pick<Clock, "sleep" | "random"> = systemClock,
  retries = CALL_RETRIES,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt >= retries || !isTransient(error)) throw error
      await clock.sleep(backoffMs(attempt, 500, 8_000, clock.random))
    }
  }
}

function toChunks(units: string[]): string[][] {
  const chunks: string[][] = []
  let current: string[] = []
  let chars = 0

  for (const unit of units) {
    if (current.length && (current.length >= MAX_BATCH_STRINGS || chars + unit.length > MAX_BATCH_CHARS)) {
      chunks.push(current)
      current = []
      chars = 0
    }

    current.push(unit)
    chars += unit.length
  }

  if (current.length) chunks.push(current)

  return chunks
}

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.slice(0, 500)
}

export function deriveStatus(
  row: Row | undefined,
  currentHash: string | null,
  now: Date,
): TranslationStatus {
  if (!row) return "NOT_TRANSLATED"
  if (row.jobState === "FAILED") return "FAILED"
  if (row.jobState === "RUNNING" && row.lockedUntil && row.lockedUntil > now) return "TRANSLATING"
  if (row.jobState === "QUEUED" || row.jobState === "RUNNING") return "QUEUED"

  return currentHash !== null && row.translatedHash === currentHash ? "PUBLISHED" : "OUTDATED"
}

export type DrainSummary = { published: number; retried: number; failed: number; skipped: number }

export function createTranslationEngine(deps: {
  store: TranslationStore
  translator: Translator
  clock?: Partial<Clock>
  /** Called after a translation is stored, e.g. to revalidate cached pages. */
  onPublished?: (kind: Kind, entityId: string, locale: TargetLocale) => Promise<void> | void
  log?: (event: string, data: Record<string, unknown>) => void
}) {
  const { store, translator } = deps
  const clock: Clock = { ...systemClock, ...deps.clock }
  const log = deps.log ?? ((event, data) => console.log(JSON.stringify({ scope: "translation", event, ...data })))

  async function translateUnits(units: string[], googleCode: string): Promise<string[]> {
    const out: string[] = []

    for (const chunk of toChunks(units)) {
      const result = await retryTransient(() => translator.translateHtml(chunk, googleCode), clock)

      if (result.length !== chunk.length) {
        throw new Error("Translation API returned an unexpected number of results")
      }

      out.push(...result)
    }

    return out
  }

  /** Makes sure every target locale is queued if its translation is missing/stale. */
  async function enqueue(kind: Kind, entityId: string, source?: Source | null) {
    const src = source ?? (await store.getSource(kind, entityId))
    if (!src) return { queued: [] as TargetLocale[] }

    const hash = hashSource(src)
    const queued: TargetLocale[] = []

    for (const locale of TARGET_LOCALES) {
      await store.createRowIfMissing(kind, entityId, locale)
    }

    for (const row of await store.listRows(kind, [entityId])) {
      if (row.jobState === "IDLE" && row.translatedHash === hash) continue

      if (row.jobState === "RUNNING") {
        // Lease still valid: let it finish, then it re-queues itself.
        if (row.lockedUntil && row.lockedUntil > clock.now()) {
          await store.markDirty(kind, row.id, clock.now())
          queued.push(row.locale as TargetLocale)
          continue
        }
      }

      if (row.translatedHash !== hash || row.jobState === "IDLE") {
        await store.requeue(kind, row.id)
        queued.push(row.locale as TargetLocale)
      }
    }

    return { queued }
  }

  async function processRow(candidate: Row): Promise<"published" | "retried" | "failed" | "skipped"> {
    const now = clock.now()
    const row = await store.claim(candidate.kind, candidate.id, now, new Date(now.getTime() + LEASE_MS))
    if (!row) return "skipped"

    const locale = row.locale as TargetLocale
    const meta = LOCALE_META[locale]
    const base = { kind: row.kind, entityId: row.entityId, locale, attempt: row.attempts }

    try {
      const source = await store.getSource(row.kind, row.entityId)

      if (!source) {
        await store.fail(row.kind, row, { state: "FAILED", error: "Source no longer exists", nextAttemptAt: null })
        return "failed"
      }

      const hash = hashSource(source)

      if (!meta) {
        throw new PermanentTranslationError(`Unsupported locale: ${row.locale}`)
      }

      const plan = planSource(source)
      const chars = plan.units.reduce((sum, unit) => sum + unit.length, 0)

      if (chars > MAX_SOURCE_CHARS) {
        throw new PermanentTranslationError(`Source too large to translate (${chars} > ${MAX_SOURCE_CHARS} characters)`)
      }

      const translated = await translateUnits(plan.units, meta.googleCode)
      const fields = plan.assemble(translated)

      await store.complete(row.kind, row, fields, hash, clock.now())
      log("published", { ...base, chars })

      try {
        await deps.onPublished?.(row.kind, row.entityId, locale)
      } catch (hookError) {
        log("hook_failed", { ...base, error: errorMessage(hookError) })
      }

      return "published"
    } catch (error) {
      const message = errorMessage(error)
      const retry = isTransient(error) && row.attempts < MAX_ATTEMPTS

      await store.fail(row.kind, row, {
        state: retry ? "QUEUED" : "FAILED",
        error: message,
        nextAttemptAt: retry
          ? new Date(clock.now().getTime() + 30_000 + backoffMs(row.attempts, 60_000, 3_600_000, clock.random))
          : null,
      })
      log(retry ? "retry_scheduled" : "failed", { ...base, error: message })

      return retry ? "retried" : "failed"
    }
  }

  async function drain(options: {
    kind?: Kind
    entityId?: string
    limit?: number
    /** Stop starting new rows after this time (serverless time budget). */
    deadline?: number
  } = {}): Promise<DrainSummary> {
    const summary: DrainSummary = { published: 0, retried: 0, failed: 0, skipped: 0 }
    const rows = await store.due(clock.now(), {
      kind: options.kind,
      entityId: options.entityId,
      limit: options.limit ?? 20,
    })

    for (const row of rows) {
      if (options.deadline && clock.now().getTime() > options.deadline) break
      summary[await processRow(row)]++
    }

    return summary
  }

  async function statuses(kind: Kind, entityIds: string[]) {
    const rows = await store.listRows(kind, entityIds)
    const now = clock.now()
    const result = new Map<string, LocaleStatus[]>()

    for (const entityId of entityIds) {
      const source = await store.getSource(kind, entityId)
      const hash = source ? hashSource(source) : null

      result.set(
        entityId,
        TARGET_LOCALES.map((locale) => {
          const row = rows.find((r) => r.entityId === entityId && r.locale === locale)

          return {
            locale,
            status: deriveStatus(row, hash, now),
            attempts: row?.attempts ?? 0,
            lastError: row?.lastError ?? null,
            publishedAt: row?.publishedAt ?? null,
          }
        }),
      )
    }

    return result
  }

  /** Admin retry: failed/stale rows go back to the queue; `force` also redoes current ones. */
  async function retry(kind: Kind, entityId: string, opts: { locales?: TargetLocale[]; force?: boolean } = {}) {
    const rows = await store.listRows(kind, [entityId])
    let count = 0

    for (const row of rows) {
      if (opts.locales && !opts.locales.includes(row.locale as TargetLocale)) continue
      if (row.jobState === "RUNNING" && row.lockedUntil && row.lockedUntil > clock.now()) continue
      if (row.jobState === "IDLE" && !opts.force && row.translatedHash !== null) {
        const source = await store.getSource(kind, entityId)
        if (source && hashSource(source) === row.translatedHash) continue
      }

      await store.requeue(kind, row.id, { resetHash: opts.force })
      count++
    }

    // Locales with no row yet (e.g. a language added after the post).
    for (const locale of opts.locales ?? TARGET_LOCALES) {
      if (!rows.some((row) => row.locale === locale)) {
        await store.createRowIfMissing(kind, entityId, locale)
      }
    }

    return { requeued: count }
  }

  return { enqueue, processRow, drain, statuses, retry }
}

export type TranslationEngine = ReturnType<typeof createTranslationEngine>
