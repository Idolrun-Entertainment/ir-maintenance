import { describe, expect, it } from "vitest"

import { planBlogContent } from "../tiptap"
import { fakeTranslate } from "./helpers"

const doc = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Release notes" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Read the " },
        { type: "text", text: "guide", marks: [{ type: "link", attrs: { href: "https://example.com/a?b=1&c=2" } }] },
        { type: "text", text: " and run " },
        { type: "text", text: "pnpm dev", marks: [{ type: "code" }] },
        { type: "hardBreak" },
        { type: "text", text: "Fast & easy", marks: [{ type: "bold" }] },
      ],
    },
    { type: "codeBlock", content: [{ type: "text", text: "const secret = 1 < 2" }] },
    { type: "image", attrs: { src: "https://res.cloudinary.com/x/a.png", alt: "A screenshot" } },
    {
      type: "bulletList",
      content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Item" }] }] }],
    },
  ],
}

const run = (translate: (html: string) => string) => {
  const plan = planBlogContent(JSON.stringify(doc))
  return { plan, out: JSON.parse(plan.apply(plan.units.map(translate))) }
}

describe("planBlogContent", () => {
  it("sends only text, never code blocks, URLs or image sources", () => {
    const plan = planBlogContent(JSON.stringify(doc))
    const sent = plan.units.join("\n")

    expect(sent).not.toContain("const secret")
    expect(sent).not.toContain("example.com")
    expect(sent).not.toContain("cloudinary")
    expect(sent).toContain("A screenshot")
    expect(sent).toContain("Fast &amp; easy")
    expect(sent).toContain('translate="no"')
  })

  it("restores marks, links, hard breaks, images and code blocks after translation", () => {
    const { out } = run((html) => fakeTranslate(html, "ja"))

    expect(out.content[0].content[0].text).toBe("[ja]Release notes")
    const para = out.content[1].content
    expect(para[1]).toMatchObject({
      text: "[ja]guide",
      marks: [{ type: "link", attrs: { href: "https://example.com/a?b=1&c=2" } }],
    })
    expect(para[3].marks).toEqual([{ type: "code" }])
    expect(para.some((n: { type: string }) => n.type === "hardBreak")).toBe(true)
    expect(para[para.length - 1]).toMatchObject({ text: "[ja]Fast & easy", marks: [{ type: "bold" }] })
    expect(out.content[2]).toEqual(doc.content[2])
    expect(out.content[3].attrs).toEqual({ src: "https://res.cloudinary.com/x/a.png", alt: "[ja]A screenshot" })
    expect(out.content[4].content[0].content[0].content[0].text).toBe("[ja]Item")
  })

  it("falls back to plain text when the API mangles the tag structure", () => {
    const { out } = run((html) => html.replace(/<span[^>]*>|<\/span>/g, "") + "<em>x</em>")
    const para = out.content[1].content

    expect(para.every((n: { marks?: unknown }) => !n.marks)).toBe(true)
    expect(JSON.stringify(out)).not.toContain("<em>")
  })

  it("strips unsafe link hrefs on output", () => {
    const plan = planBlogContent(
      JSON.stringify({
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] }],
      }),
    )
    const out = JSON.parse(plan.apply(plan.units))
    expect(JSON.stringify(out)).not.toContain("javascript:")
  })
})
