import type { TranslationEngine } from "./engine"
import { hashSource } from "./entities"
import { KINDS, type Kind, type TranslationStore } from "./types"
import { TARGET_LOCALES } from "@/i18n/config"

export type BackfillSummary = {
  scanned: number
  /** Posts with at least one missing or outdated locale. */
  needing: number
  /** Locale translations that were (or, in a dry run, would be) queued. */
  queuedLocales: number
  nextCursor: string | null
}

/**
 * Walks one page of source rows (cursor = last id seen) and queues whatever is
 * missing or outdated. Idempotent: current translations are skipped, so
 * re-running - or resuming from a saved cursor - never repeats finished work.
 * Source rows are only read.
 */
export async function backfillPage(
  deps: { store: TranslationStore; engine: TranslationEngine },
  options: { kind: Kind; cursor?: string | null; take?: number; dryRun?: boolean },
): Promise<BackfillSummary> {
  const { store, engine } = deps
  const take = options.take ?? 50
  const sources = await store.pageSources(options.kind, options.cursor ?? null, take)
  const rows = await store.listRows(options.kind, sources.map((s) => s.id))

  let needing = 0
  let queuedLocales = 0

  for (const source of sources) {
    const hash = hashSource(source)
    const stale = TARGET_LOCALES.filter((locale) => {
      const row = rows.find((r) => r.entityId === source.id && r.locale === locale)
      return !row || row.translatedHash !== hash || row.jobState === "FAILED"
    })

    if (stale.length === 0) continue

    needing++
    queuedLocales += stale.length

    if (!options.dryRun) {
      await engine.enqueue(source.kind, source.id, source)
    }
  }

  return {
    scanned: sources.length,
    needing,
    queuedLocales,
    nextCursor: sources.length === take ? sources[sources.length - 1].id : null,
  }
}

export async function backfillAll(
  deps: { store: TranslationStore; engine: TranslationEngine },
  options: { kinds?: Kind[]; take?: number; dryRun?: boolean; log?: (line: string) => void } = {},
) {
  const totals = { scanned: 0, needing: 0, queuedLocales: 0 }

  for (const kind of options.kinds ?? KINDS) {
    let cursor: string | null = null

    do {
      const page: BackfillSummary = await backfillPage(deps, { kind, cursor, take: options.take, dryRun: options.dryRun })
      totals.scanned += page.scanned
      totals.needing += page.needing
      totals.queuedLocales += page.queuedLocales
      options.log?.(`${kind}: scanned ${page.scanned}, needing ${page.needing}, locales ${page.queuedLocales}`)
      cursor = page.nextCursor
    } while (cursor)
  }

  return totals
}
