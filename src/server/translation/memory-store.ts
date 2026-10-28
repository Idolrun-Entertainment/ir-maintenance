import type { Fields, Kind, Row, Source, TranslationStore } from "./types"

type StoredRow = Row & { fields: Fields }

/**
 * In-memory TranslationStore with the same semantics as the Prisma one.
 * Used by tests; not imported by application code.
 */
export function createMemoryStore(initial: Source[] = []) {
  const sources = new Map<string, Source>()
  const rows = new Map<string, StoredRow>()
  let seq = 0

  const sourceKey = (kind: Kind, id: string) => `${kind}:${id}`
  initial.forEach((s) => sources.set(sourceKey(s.kind, s.id), s))

  const find = (kind: Kind, id: string) => {
    const row = rows.get(id)
    return row && row.kind === kind ? row : undefined
  }

  const claimable = (row: StoredRow, now: Date) =>
    (row.jobState === "QUEUED" && (!row.nextAttemptAt || row.nextAttemptAt <= now)) ||
    (row.jobState === "RUNNING" && !!row.lockedUntil && row.lockedUntil < now)

  const store: TranslationStore = {
    async getSource(kind, id) {
      return sources.get(sourceKey(kind, id)) ?? null
    },
    async pageSources(kind, afterId, take) {
      return [...sources.values()]
        .filter((s) => s.kind === kind && (!afterId || s.id > afterId))
        .sort((a, b) => (a.id < b.id ? -1 : 1))
        .slice(0, take)
    },
    async listRows(kind, entityIds) {
      return [...rows.values()].filter((r) => r.kind === kind && entityIds.includes(r.entityId))
    },
    async createRowIfMissing(kind, entityId, locale) {
      const exists = [...rows.values()].some(
        (r) => r.kind === kind && r.entityId === entityId && r.locale === locale,
      )
      if (exists) return

      const id = `row${++seq}`
      rows.set(id, {
        kind, id, entityId, locale, jobState: "QUEUED", attempts: 0, nextAttemptAt: null,
        lockedUntil: null, translatedHash: null, publishedAt: null, lastError: null, fields: {},
      })
    },
    async requeue(kind, rowId, opts) {
      const row = find(kind, rowId)
      if (!row || row.jobState === "RUNNING") return
      Object.assign(row, {
        jobState: "QUEUED", attempts: 0, nextAttemptAt: null, lockedUntil: null, lastError: null,
        ...(opts?.resetHash ? { translatedHash: null } : {}),
      })
    },
    async markDirty(kind, rowId, now) {
      const row = find(kind, rowId)
      if (row?.jobState === "RUNNING") row.nextAttemptAt = now
    },
    async claim(kind, rowId, now, leaseUntil) {
      const row = find(kind, rowId)
      if (!row || !claimable(row, now)) return null
      Object.assign(row, { jobState: "RUNNING", lockedUntil: leaseUntil, nextAttemptAt: null, attempts: row.attempts + 1 })
      return { ...row }
    },
    async complete(kind, claimed, fields, hash, now) {
      const row = find(kind, claimed.id)
      if (!row || row.jobState !== "RUNNING") return
      const dirty = row.nextAttemptAt !== null
      Object.assign(row, {
        fields: { ...row.fields, ...fields },
        translatedHash: hash,
        publishedAt: row.publishedAt ?? now,
        lockedUntil: null, lastError: null, attempts: 0, nextAttemptAt: null,
        jobState: dirty ? "QUEUED" : "IDLE",
      })
    },
    async fail(kind, claimed, result) {
      const row = find(kind, claimed.id)
      if (!row || row.jobState !== "RUNNING") return
      Object.assign(row, {
        jobState: result.state, lockedUntil: null, lastError: result.error, nextAttemptAt: result.nextAttemptAt,
      })
    },
    async due(now, opts) {
      return [...rows.values()]
        .filter(
          (r) =>
            (!opts.kind || r.kind === opts.kind) &&
            (!opts.entityId || r.entityId === opts.entityId) &&
            claimable(r, now),
        )
        .slice(0, opts.limit)
        .map((r) => ({ ...r }))
    },
  }

  return {
    store,
    sources,
    rows,
    fieldsOf: (kind: Kind, entityId: string, locale: string) =>
      [...rows.values()].find((r) => r.kind === kind && r.entityId === entityId && r.locale === locale)?.fields,
    rowOf: (kind: Kind, entityId: string, locale: string) =>
      [...rows.values()].find((r) => r.kind === kind && r.entityId === entityId && r.locale === locale),
  }
}
