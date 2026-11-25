import { beforeEach, describe, expect, it, vi } from "vitest"

import { ForbiddenError, UnauthorizedError } from "@/lib/errors"

const requireAdmin = vi.fn()
const rateLimit = vi.fn(() => true)
const create = vi.fn()
const list = vi.fn()
const setRead = vi.fn()
const remove = vi.fn()

vi.mock("@/lib/require-admin", () => ({ requireAdmin }))
vi.mock("@/lib/rate-limit", () => ({ rateLimit }))
vi.mock("@/server/services/contact.service", () => ({
  contactService: { create, list, setRead, delete: remove },
}))

const { contactController } = await import("../controllers/contact.controller")
const { NextRequest } = await import("next/server")

function post(body: unknown) {
  return new NextRequest("http://localhost/api/contact", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

const valid = { email: "Jane@Example.com", message: "Hello, I have a question." }

describe("POST /api/contact", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    rateLimit.mockReturnValue(true)
  })

  it("stores a valid message with a normalised email", async () => {
    const response = await contactController.create(post(valid))

    expect(response.status).toBe(201)
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ email: "jane@example.com", message: valid.message }),
    )
  })

  it("rejects a bad email with 400 and stores nothing", async () => {
    const response = await contactController.create(post({ ...valid, email: "foo@bar" }))

    expect(response.status).toBe(400)
    expect(create).not.toHaveBeenCalled()
  })

  it("silently drops honeypot submissions", async () => {
    const response = await contactController.create(post({ ...valid, website: "http://spam" }))

    expect(response.status).toBe(201)
    expect(create).not.toHaveBeenCalled()
  })

  it("rejects an oversized body and invalid JSON", async () => {
    const big = await contactController.create(post({ ...valid, message: "x".repeat(9000) }))
    expect(big.status).toBe(400)

    const bad = await contactController.create(post("{not json"))
    expect(bad.status).toBe(400)
    expect(create).not.toHaveBeenCalled()
  })

  it("returns 429 when rate limited", async () => {
    rateLimit.mockReturnValue(false)
    const response = await contactController.create(post(valid))

    expect(response.status).toBe(429)
    expect(create).not.toHaveBeenCalled()
  })
})

describe("admin queries endpoints", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects unauthenticated list (401) and non-admin delete (403)", async () => {
    requireAdmin.mockRejectedValueOnce(new UnauthorizedError())
    const listed = await contactController.list(new NextRequest("http://localhost/api/queries"))
    expect(listed.status).toBe(401)
    expect(list).not.toHaveBeenCalled()

    requireAdmin.mockRejectedValueOnce(new ForbiddenError())
    const deleted = await contactController.delete(
      new NextRequest("http://localhost/api/queries/x", { method: "DELETE" }),
      "x",
    )
    expect(deleted.status).toBe(403)
    expect(remove).not.toHaveBeenCalled()
  })

  it("lets an admin list unread and mark read, validating the body", async () => {
    requireAdmin.mockResolvedValue({})
    list.mockResolvedValue({ items: [], meta: {} })
    setRead.mockResolvedValue({})

    const listed = await contactController.list(
      new NextRequest("http://localhost/api/queries?status=unread&page=2"),
    )
    expect(listed.status).toBe(200)
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ page: 2, unreadOnly: true }))

    const ok = await contactController.setRead(
      new NextRequest("http://localhost/api/queries/x", {
        method: "PATCH",
        body: JSON.stringify({ read: true }),
      }),
      "x",
    )
    expect(ok.status).toBe(200)
    expect(setRead).toHaveBeenCalledWith("x", true)

    const bad = await contactController.setRead(
      new NextRequest("http://localhost/api/queries/x", {
        method: "PATCH",
        body: JSON.stringify({ read: "yes" }),
      }),
      "x",
    )
    expect(bad.status).toBe(400)
  })
})
