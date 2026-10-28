import { describe, expect, it } from "vitest"

import { buildAlternates, buildOpenGraph } from "@/lib/seo"

import { LOCALE_META, LOCALES, TARGET_LOCALES, isTargetLocale, localePath } from "../config"
import { getDictionary } from "../dictionary"
import { buildLanguageLinks } from "../links"

describe("locale config", () => {
  it("maps locales to native names and Google codes", () => {
    expect(LOCALES).toEqual(["en", "ja", "id", "ko", "zh-CN"])
    expect(TARGET_LOCALES).toEqual(["ja", "id", "ko", "zh-CN"])
    expect(LOCALES.map((l) => LOCALE_META[l].nativeName)).toEqual([
      "English", "日本語", "Bahasa Indonesia", "한국어", "简体中文",
    ])
    expect(LOCALES.map((l) => LOCALE_META[l].googleCode)).toEqual(["en", "ja", "id", "ko", "zh-CN"])
  })

  it("prefixes only non-English paths and rejects unknown locales", () => {
    expect(localePath("en", "/updates")).toBe("/updates")
    expect(localePath("ja", "/")).toBe("/ja")
    expect(localePath("zh-CN", "/updates/a-b")).toBe("/zh-CN/updates/a-b")
    expect(isTargetLocale("en")).toBe(false)
    expect(isTargetLocale("fr")).toBe(false)
    expect(isTargetLocale("ko")).toBe(true)
  })

  it("has a complete dictionary for every locale", () => {
    const shape = (o: unknown): unknown =>
      typeof o === "object" && o ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, shape(v)])) : typeof o

    for (const locale of LOCALES) {
      expect(shape(getDictionary(locale))).toEqual(shape(getDictionary("en")))
    }
  })
})

describe("language switcher links", () => {
  it("links every language to the equivalent article", () => {
    const links = buildLanguageLinks("/updates/my-post")

    expect(links.map((l) => l.href)).toEqual([
      "/updates/my-post",
      "/ja/updates/my-post",
      "/id/updates/my-post",
      "/ko/updates/my-post",
      "/zh-CN/updates/my-post",
    ])
    expect(links.map((l) => l.nativeName)).toContain("한국어")
  })

  it("keeps the home page on the home page", () => {
    expect(buildLanguageLinks("/").map((l) => l.href)).toEqual(["/", "/ja", "/id", "/ko", "/zh-CN"])
  })
})

describe("SEO alternates", () => {
  it("lists only published translations plus x-default", () => {
    const alternates = buildAlternates({ path: "/updates/p", available: ["ja", "ko"], canonicalLocale: "ja" })

    expect(alternates.canonical).toMatch(/\/ja\/updates\/p$/)
    expect(Object.keys(alternates.languages!)).toEqual(["en", "ja", "ko", "x-default"])
    expect(alternates.languages!["x-default"]).toMatch(/\/updates\/p$/)
    expect(alternates.languages!["x-default"]).not.toContain("/ja/")
  })

  it("points the canonical of a not-yet-translated page at English", () => {
    const alternates = buildAlternates({ path: "/updates/p", available: [], canonicalLocale: "en" })

    expect(alternates.canonical).toMatch(/\/updates\/p$/)
    expect(Object.keys(alternates.languages!)).toEqual(["en", "x-default"])
  })

  it("localizes Open Graph metadata", () => {
    const og = buildOpenGraph({
      locale: "zh-CN", path: "/updates/p", title: "T", description: "D", type: "article", available: ["zh-CN"],
    })

    expect(og).toMatchObject({ locale: "zh_CN", type: "article" })
    expect(String(og.url)).toMatch(/\/zh-CN\/updates\/p$/)
    expect(og.alternateLocale).toEqual(["en_GB"])
  })
})
