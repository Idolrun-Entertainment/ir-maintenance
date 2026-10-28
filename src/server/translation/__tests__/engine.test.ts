import { describe, expect, it } from "vitest"

import { TARGET_LOCALES } from "@/i18n/config"

import { backfillAll, backfillPage } from "../backfill"
import { hashSource } from "../entities"
import { MAX_ATTEMPTS } from "../engine"
import { PermanentTranslationError } from "../types"
import { blogSource, createFakeTranslator, fakeTranslate, setup } from "./helpers"

describe("translation engine", () => {
  it("translates into all four locales with the right Google codes", async () => {
    const { translator, calls } = createFakeTranslator()
    const t = setup([blogSource("b1")], translator)

    await t.engine.enqueue("blog", "b1")
    const summary = await t.engine.drain()

    expect(summary.published).toBe(4)
    expect([...new Set(calls.map((c) => c.code))].sort()).toEqual(["id", "ja", "ko", "zh-CN"])
    expect(t.fieldsOf("blog", "b1", "ja")?.title).toBe("[ja]Hello")
    expect(t.fieldsOf("blog", "b1", "zh-CN")?.title).toBe("[zh-CN]Hello")

    const statuses = (await t.engine.statuses("blog", ["b1"])).get("b1")!
    expect(statuses.map((s) => s.status)).toEqual(Array(4).fill("PUBLISHED"))
    expect(TARGET_LOCALES).toHaveLength(4)
  })

  it("keeps successful locales when one fails permanently", async () => {
    const { translator } = createFakeTranslator((texts, code) => {
      if (code === "ko") throw new PermanentTranslationError("bad request")
      return texts.map((x) => fakeTranslate(x, code))
    })
    const t = setup([blogSource("b1")], translator)

    await t.engine.enqueue("blog", "b1")
    const summary = await t.engine.drain()

    expect(summary).toMatchObject({ published: 3, failed: 1 })
    expect(t.rowOf("blog", "b1", "ko")).toMatchObject({ jobState: "FAILED", publishedAt: null })
    expect(t.rowOf("blog", "b1", "ja")).toMatchObject({ jobState: "IDLE" })
    expect(t.rowOf("blog", "b1", "ja")?.publishedAt).not.toBeNull()
  })

  it("retries transient errors within a call with backoff", async () => {
    const sleeps: number[] = []
    const { translator, calls } = createFakeTranslator((texts, code, call) => {
      if (call <= 2) throw Object.assign(new Error("unavailable"), { code: 14 })
      return texts.map((x) => fakeTranslate(x, code))
    })
    const t = setup([blogSource("b1")], translator, {
      clock: { sleep: async (ms) => void sleeps.push(ms), random: () => 1 },
    })

    await t.engine.enqueue("blog", "b1")
    await t.engine.drain({ limit: 1 })

    expect(calls.length).toBe(3)
    expect(sleeps).toEqual([500, 1000])
  })

  it("schedules a delayed retry, then marks FAILED after the attempt cap", async () => {
    let now = new Date("2026-01-01T00:00:00Z")
    const { translator } = createFakeTranslator(() => {
      throw Object.assign(new Error("quota"), { code: 429 })
    })
    const t = setup([blogSource("b1")], translator, { clock: { now: () => now } })

    await t.engine.enqueue("blog", "b1")
    await t.engine.drain({ limit: 1 })

    const row = t.rowOf("blog", "b1", "ja")!
    expect(row.jobState).toBe("QUEUED")
    expect(row.nextAttemptAt!.getTime()).toBeGreaterThan(now.getTime())
    expect(row.lastError).toContain("quota")

    // Not due yet: nothing happens.
    expect((await t.engine.drain({ limit: 1 })).skipped + (await t.engine.drain({ limit: 1 })).failed).toBe(0)

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      now = new Date(now.getTime() + 24 * 3_600_000)
      await t.engine.drain({ limit: 4 })
    }

    expect(t.rowOf("blog", "b1", "ja")!.jobState).toBe("FAILED")
    expect(t.rowOf("blog", "b1", "ja")!.publishedAt).toBeNull()
  })

  it("is idempotent under duplicate execution and repeated enqueue", async () => {
    const { translator, calls } = createFakeTranslator()
    const t = setup([blogSource("b1")], translator)

    await t.engine.enqueue("blog", "b1")
    await t.engine.enqueue("blog", "b1")
    expect(t.rows.size).toBe(4)

    const [row] = await t.store.due(new Date(), { limit: 1 })
    const results = await Promise.all([t.engine.processRow(row), t.engine.processRow(row)])
    expect(results.sort()).toEqual(["published", "skipped"])

    await t.engine.drain()
    const callsAfterFirstPass = calls.length

    await t.engine.enqueue("blog", "b1")
    const again = await t.engine.drain()
    expect(again).toEqual({ published: 0, retried: 0, failed: 0, skipped: 0 })
    expect(calls.length).toBe(callsAfterFirstPass)
    expect(t.rows.size).toBe(4)
  })

  it("marks translations outdated after an English edit and keeps serving the old one", async () => {
    const { translator } = createFakeTranslator()
    const t = setup([blogSource("b1", "Hello", "World")], translator)
    await t.engine.enqueue("blog", "b1")
    await t.engine.drain()

    t.sources.set("blog:b1", blogSource("b1", "Hello v2", "World v2"))
    const outdated = (await t.engine.statuses("blog", ["b1"])).get("b1")!
    expect(outdated.every((s) => s.status === "OUTDATED")).toBe(true)

    await t.engine.enqueue("blog", "b1")
    expect(t.rowOf("blog", "b1", "ja")!.jobState).toBe("QUEUED")
    // Old translation is still there (and published) until the replacement lands.
    expect(t.fieldsOf("blog", "b1", "ja")?.title).toBe("[ja]Hello")
    expect(t.rowOf("blog", "b1", "ja")!.publishedAt).not.toBeNull()

    await t.engine.drain()
    expect(t.fieldsOf("blog", "b1", "ja")?.title).toBe("[ja]Hello v2")
    const current = (await t.engine.statuses("blog", ["b1"])).get("b1")!
    expect(current.every((s) => s.status === "PUBLISHED")).toBe(true)
  })

  it("re-queues a row edited while it was being translated", async () => {
    const ref = {} as { t: ReturnType<typeof setup> }
    const { translator } = createFakeTranslator(async (texts, code) => {
      if (code === "ja" && (ref.t.sources.get("blog:b1") as { title: string }).title === "Hello") {
        ref.t.sources.set("blog:b1", blogSource("b1", "Hello 2", "World"))
        await ref.t.engine.enqueue("blog", "b1") // the admin saved again mid-flight
      }
      return texts.map((x) => fakeTranslate(x, code))
    })
    const t = (ref.t = setup([blogSource("b1")], translator))

    await t.engine.enqueue("blog", "b1")
    await t.engine.drain({ limit: 1 })
    expect(t.rowOf("blog", "b1", "ja")).toMatchObject({ jobState: "QUEUED" })

    await t.engine.drain()
    expect(t.fieldsOf("blog", "b1", "ja")?.title).toBe("[ja]Hello 2")
  })

  it("rejects oversized sources permanently without calling the API", async () => {
    const { translator, calls } = createFakeTranslator()
    const t = setup([blogSource("b1", "Hello", "x".repeat(250_000))], translator)
    await t.engine.enqueue("blog", "b1")
    await t.engine.drain()

    expect(calls.length).toBe(0)
    expect(t.rowOf("blog", "b1", "ja")).toMatchObject({ jobState: "FAILED" })
    expect(t.rowOf("blog", "b1", "ja")!.lastError).toContain("too large")
  })

  it("admin retry requeues failed locales independently", async () => {
    let failKo = true
    const { translator } = createFakeTranslator((texts, code) => {
      if (code === "ko" && failKo) throw new PermanentTranslationError("nope")
      return texts.map((x) => fakeTranslate(x, code))
    })
    const t = setup([blogSource("b1")], translator)
    await t.engine.enqueue("blog", "b1")
    await t.engine.drain()
    expect(t.rowOf("blog", "b1", "ko")!.jobState).toBe("FAILED")

    failKo = false
    const { requeued } = await t.engine.retry("blog", "b1", { locales: ["ko"] })
    expect(requeued).toBe(1)
    await t.engine.drain()
    expect(t.rowOf("blog", "b1", "ko")).toMatchObject({ jobState: "IDLE" })
  })
})

describe("admin retry scope", () => {
  it("only requeues the requested locales", async () => {
    const { translator } = createFakeTranslator(() => {
      throw new PermanentTranslationError("nope")
    })
    const t = setup([blogSource("b1")], translator)
    await t.engine.enqueue("blog", "b1")
    await t.engine.drain()
    expect(t.rowOf("blog", "b1", "ja")!.jobState).toBe("FAILED")
    expect(t.rowOf("blog", "b1", "ko")!.jobState).toBe("FAILED")

    await t.engine.retry("blog", "b1", { locales: ["ko"] })

    expect(t.rowOf("blog", "b1", "ko")!.jobState).toBe("QUEUED")
    expect(t.rowOf("blog", "b1", "ja")!.jobState).toBe("FAILED")
  })
})

describe("backfill", () => {
  const sources = ["a", "b", "c", "d", "e"].map((id) => blogSource(id))

  it("dry run changes nothing", async () => {
    const { translator } = createFakeTranslator()
    const t = setup(sources, translator)
    const totals = await backfillAll(t, { kinds: ["blog"], take: 2, dryRun: true })

    expect(totals).toMatchObject({ scanned: 5, needing: 5, queuedLocales: 20 })
    expect(t.rows.size).toBe(0)
  })

  it("queues in cursor-paged batches, then a re-run finds nothing to do", async () => {
    const { translator, calls } = createFakeTranslator()
    const t = setup(sources, translator)

    const first = await backfillPage(t, { kind: "blog", take: 2 })
    expect(first).toMatchObject({ scanned: 2, nextCursor: "b" })
    const second = await backfillPage(t, { kind: "blog", take: 2, cursor: first.nextCursor })
    expect(second.nextCursor).toBe("d")

    await backfillAll(t, { kinds: ["blog"], take: 2 })
    await t.engine.drain({ limit: 100 })
    expect(t.rows.size).toBe(20)

    const before = calls.length
    const rerun = await backfillAll(t, { kinds: ["blog"], take: 2 })
    expect(rerun).toMatchObject({ scanned: 5, needing: 0, queuedLocales: 0 })
    expect((await t.engine.drain({ limit: 100 })).published).toBe(0)
    expect(calls.length).toBe(before)
  })

  it("only redoes posts whose English changed", async () => {
    const { translator } = createFakeTranslator()
    const t = setup(sources, translator)
    await backfillAll(t, { kinds: ["blog"] })
    await t.engine.drain({ limit: 100 })

    t.sources.set("blog:c", blogSource("c", "Changed", "Changed"))
    const rerun = await backfillAll(t, { kinds: ["blog"] })
    expect(rerun.needing).toBe(1)
    expect(hashSource(t.sources.get("blog:c")!)).not.toBe(hashSource(blogSource("c")))
  })
})
