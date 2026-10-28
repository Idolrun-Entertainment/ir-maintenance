import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/prisma", () => ({ prisma: {} }))

import { isPublishedTranslation, localizeBlog } from "../read"

const blog = {
  id: "b1", slug: "hello", title: "Hello", content: "{}", date: new Date(), views: 0, imageUrl: "",
}
const translation = {
  blogId: "b1", title: "こんにちは", content: '{"type":"doc"}', seoTitle: "こんにちは", seoDescription: "d",
  publishedAt: new Date(),
}

describe("public translation exposure", () => {
  it("serves a published translation", () => {
    const result = localizeBlog(blog, translation, "ja")
    expect(result).toMatchObject({ title: "こんにちは", isFallback: false })
  })

  it("never exposes a draft (unpublished) translation", () => {
    const result = localizeBlog(blog, { ...translation, publishedAt: null }, "ja")
    expect(result).toMatchObject({ title: "Hello", isFallback: true })
  })

  it("never exposes empty translated text", () => {
    expect(localizeBlog(blog, { ...translation, content: "  " }, "ja").isFallback).toBe(true)
    expect(isPublishedTranslation<{ publishedAt: Date | null; title: string | null }>(null, ["title"])).toBe(false)
  })

  it("falls back to English when no translation exists, but English itself is not a fallback", () => {
    expect(localizeBlog(blog, undefined, "ko")).toMatchObject({ title: "Hello", isFallback: true })
    expect(localizeBlog(blog, translation, "en")).toMatchObject({ title: "Hello", isFallback: false })
  })
})
