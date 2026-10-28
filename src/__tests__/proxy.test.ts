import { describe, expect, it } from "vitest"
import { NextRequest } from "next/server"

import { proxy } from "../proxy"

const req = (path: string, cookie?: string) =>
  new NextRequest(`http://localhost${path}`, { headers: cookie ? { cookie } : {} })

describe("proxy", () => {
  it("sends a visitor with a saved language to the same page in that language", () => {
    const response = proxy(req("/updates/my-post", "NEXT_LOCALE=ja"))

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get("location")!).pathname).toBe("/ja/updates/my-post")
    expect(new URL(proxy(req("/", "NEXT_LOCALE=ko")).headers.get("location")!).pathname).toBe("/ko")
  })

  it("leaves English visitors and unknown cookie values alone", () => {
    expect(proxy(req("/updates", "NEXT_LOCALE=en")).headers.get("location")).toBeNull()
    expect(proxy(req("/updates", "NEXT_LOCALE=fr")).headers.get("location")).toBeNull()
    expect(proxy(req("/updates")).headers.get("location")).toBeNull()
  })

  it("still requires a session cookie for /admin", () => {
    const response = proxy(req("/admin/blogs", "NEXT_LOCALE=ja"))

    expect(new URL(response.headers.get("location")!).pathname).toBe("/sign-in")
  })
})
