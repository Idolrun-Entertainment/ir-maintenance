import type { JSONContent } from "@tiptap/react"

import { parseBlogContent, sanitizeBlogContent } from "@/lib/blog-content"
import { escapeHtml, stripTags, unescapeHtml } from "./html"

type Mark = NonNullable<JSONContent["marks"]>[number]

export type ContentPlan = {
  /** HTML fragments to send to the API, in document order. */
  units: string[]
  /** Rebuilds the document from translated fragments (same length/order as `units`). */
  apply(translated: string[]): string
}

const INLINE_TYPES = new Set(["text", "hardBreak"])

function isTextBlock(node: JSONContent): boolean {
  return (
    node.type !== "codeBlock" &&
    Boolean(node.content?.length) &&
    node.content!.every((child) => INLINE_TYPES.has(child.type ?? ""))
  )
}

function hasText(node: JSONContent): boolean {
  return Boolean(node.content?.some((child) => child.text?.trim()))
}

/**
 * Text runs are sent as `<span data-m="n">` wrappers so formatting (bold,
 * links, ...) survives translation without sending hrefs or attributes to the
 * API. `data-m` indexes a table of the original mark sets, kept locally.
 * `code` runs are additionally marked translate="no".
 */
function inlineToHtml(inline: JSONContent[], markSets: Mark[][]): string {
  return inline
    .map((node) => {
      if (node.type === "hardBreak") {
        return "<br>"
      }

      const text = escapeHtml(node.text ?? "")

      if (!node.marks?.length) {
        return text
      }

      const key = JSON.stringify(node.marks)
      let index = markSets.findIndex((set) => JSON.stringify(set) === key)

      if (index === -1) {
        index = markSets.push(node.marks) - 1
      }

      const noTranslate = node.marks.some((mark) => mark.type === "code")
        ? ' translate="no" class="notranslate"'
        : ""

      return `<span data-m="${index}"${noTranslate}>${text}</span>`
    })
    .join("")
}

const RUN = /<span\b[^>]*?data-m="(\d+)"[^>]*>([\s\S]*?)<\/span>/g

/**
 * Parses translated HTML back into inline nodes. If the API changed the tag
 * structure (dropped/duplicated a run, added tags) we fall back to the plain
 * translated text without marks rather than risk corrupting the document.
 */
export function htmlToInline(
  html: string,
  markSets: Mark[][],
  expectedRuns: number[],
): JSONContent[] {
  const out: JSONContent[] = []
  const seen: number[] = []
  let valid = true
  let last = 0

  const pushText = (raw: string, marks?: Mark[]) => {
    // Split on <br> into hardBreak nodes; any other tag means a broken structure.
    const parts = raw.split(/<br\s*\/?>/i)

    parts.forEach((part, i) => {
      if (/<[^>]+>/.test(part)) {
        valid = false
      }

      const text = unescapeHtml(part)

      if (text) {
        out.push(marks ? { type: "text", text, marks } : { type: "text", text })
      }

      if (i < parts.length - 1) {
        out.push({ type: "hardBreak" })
      }
    })
  }

  for (const match of html.matchAll(RUN)) {
    const index = Number(match[1])
    const marks = markSets[index]

    if (!marks) {
      valid = false
      break
    }

    seen.push(index)
    pushText(html.slice(last, match.index), undefined)
    pushText(match[2], marks)
    last = match.index + match[0].length
  }

  pushText(html.slice(last), undefined)

  const sameRuns =
    seen.length === expectedRuns.length &&
    [...seen].sort().join() === [...expectedRuns].sort().join()

  if (!valid || !sameRuns) {
    const plain = stripTags(html.replace(/<br\s*\/?>/gi, "\n"))
    return plain ? [{ type: "text", text: plain }] : []
  }

  return out
}

function runIndexes(inline: JSONContent[], markSets: Mark[][]): number[] {
  return inline.flatMap((node) => {
    if (!node.marks?.length) return []
    const key = JSON.stringify(node.marks)
    return [markSets.findIndex((set) => JSON.stringify(set) === key)]
  })
}

/**
 * Splits a Tiptap document into translatable fragments (text blocks and image
 * alt/title). Structure, URLs, image sources and code blocks never leave the
 * server and are restored untouched.
 */
export function planBlogContent(raw: string): ContentPlan {
  const doc = structuredClone(parseBlogContent(raw))
  const units: string[] = []
  const slots: Array<(translated: string) => void> = []

  const visit = (node: JSONContent) => {
    if (node.type === "image" && node.attrs) {
      for (const attr of ["alt", "title"] as const) {
        const value = node.attrs[attr]

        if (typeof value === "string" && value.trim()) {
          units.push(escapeHtml(value))
          slots.push((translated) => {
            node.attrs![attr] = stripTags(translated)
          })
        }
      }

      return
    }

    if (isTextBlock(node)) {
      if (hasText(node)) {
        const markSets: Mark[][] = []
        const original = node.content!
        units.push(inlineToHtml(original, markSets))
        const expected = runIndexes(original, markSets)

        slots.push((translated) => {
          node.content = htmlToInline(translated, markSets, expected)
        })
      }

      return
    }

    node.content?.forEach(visit)
  }

  visit(doc)

  return {
    units,
    apply(translated) {
      if (translated.length !== units.length) {
        throw new Error("Translated fragment count does not match the source")
      }

      slots.forEach((apply, i) => apply(translated[i]))

      return sanitizeBlogContent(JSON.stringify(doc))
    },
  }
}

/** First non-empty paragraph, trimmed for a meta description. */
export function describeContent(raw: string, maxLength = 160): string {
  const doc = parseBlogContent(raw)

  const collect = (node: JSONContent): string =>
    node.text ?? node.content?.map(collect).join("") ?? ""

  for (const block of doc.content ?? []) {
    if (block.type === "paragraph") {
      const text = collect(block).replace(/\s+/g, " ").trim()

      if (text) {
        return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text
      }
    }
  }

  return ""
}
