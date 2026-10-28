import { beforeEach, describe, expect, it, vi } from "vitest"

import { ForbiddenError, UnauthorizedError } from "@/lib/errors"

const requireAdmin = vi.fn()
const statuses = vi.fn()
const drain = vi.fn()
const retry = vi.fn()

vi.mock("@/lib/require-admin", () => ({ requireAdmin }))
vi.mock("next/server", async () => ({
  ...(await vi.importActual<object>("next/server")),
  after: (fn: () => unknown) => void fn(),
}))
vi.mock("@/server/translation", () => ({
  getTranslationEngine: () => ({ statuses, drain, retry }),
}))
vi.mock("@/server/translation/store.prisma", () => ({ prismaTranslationStore: {} }))
vi.mock("@/server/translation/backfill", () => ({ backfillPage: vi.fn() }))

const { translationController } = await import("../controllers/translation.controller")
const { NextRequest } = await import("next/server")

function request(url: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`http://localhost${url}`, init)
}

describe("admin translation endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("CRON_SECRET", "s3cret")
  })

  it("rejects unauthenticated callers (401) before doing any work", async () => {
    requireAdmin.mockRejectedValueOnce(new UnauthorizedError())
    const response = await translationController.status(request("/api/admin/translations?kind=blog&ids=a"))

    expect(response.status).toBe(401)
    expect(statuses).not.toHaveBeenCalled()
  })

  it("rejects non-admins (403) on retry", async () => {
    requireAdmin.mockRejectedValueOnce(new ForbiddenError())
    const response = await translationController.retry(
      request("/api/admin/translations/retry", { method: "POST", body: JSON.stringify({ kind: "blog", id: "a" }) }),
    )

    expect(response.status).toBe(403)
    expect(retry).not.toHaveBeenCalled()
  })

  it("lets an admin retry, validating input", async () => {
    requireAdmin.mockResolvedValue({})
    retry.mockResolvedValue({ requeued: 1 })

    const ok = await translationController.retry(
      request("/api/admin/translations/retry", {
        method: "POST",
        body: JSON.stringify({ kind: "blog", id: "a", locales: ["ko"] }),
      }),
    )
    expect(ok.status).toBe(200)
    expect(retry).toHaveBeenCalledWith("blog", "a", { locales: ["ko"], force: undefined })

    const bad = await translationController.retry(
      request("/api/admin/translations/retry", {
        method: "POST",
        body: JSON.stringify({ kind: "blog", id: "a", locales: ["fr"] }),
      }),
    )
    expect(bad.status).toBe(400)
  })

  it("protects the cron sweep with CRON_SECRET (and fails closed without it)", async () => {
    drain.mockResolvedValue({ published: 0, retried: 0, failed: 0, skipped: 0 })

    expect((await translationController.cron(request("/api/cron/translations"))).status).toBe(401)
    expect(
      (await translationController.cron(request("/api/cron/translations", { headers: { authorization: "Bearer nope" } }))).status,
    ).toBe(401)
    expect(
      (await translationController.cron(request("/api/cron/translations", { headers: { authorization: "Bearer s3cret" } }))).status,
    ).toBe(200)

    vi.stubEnv("CRON_SECRET", "")
    expect(
      (await translationController.cron(request("/api/cron/translations", { headers: { authorization: "Bearer " } }))).status,
    ).toBe(401)
  })
})
