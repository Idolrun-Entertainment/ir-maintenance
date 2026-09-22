import type { JSONContent } from "@tiptap/react"

import { sanitizeBlogHref } from "@/lib/sanitize-href"

function createEmptyDoc(): JSONContent {
  return {
    type: "doc",
    content: [{ type: "paragraph" }],
  }
}

export function parseBlogContent(raw: string): JSONContent {
  if (!raw.trim()) {
    return createEmptyDoc()
  }

  try {
    const parsed = JSON.parse(raw) as JSONContent

    if (parsed?.type === "doc") {
      return parsed
    }
  } catch {
    // Fall through to legacy plain-text handling.
  }

  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: raw }],
      },
    ],
  }
}

export function serializeBlogContent(doc: JSONContent): string {
  return JSON.stringify(doc)
}

function nodeHasContent(node: JSONContent): boolean {
  if (node.type === "image") {
    return Boolean(node.attrs?.src)
  }

  if (node.type === "imageUpload") {
    return false
  }

  if (typeof node.text === "string" && node.text.trim().length > 0) {
    return true
  }

  return node.content?.some(nodeHasContent) ?? false
}

export function isEmptyBlogContent(raw: string): boolean {
  const doc = parseBlogContent(raw)
  return !(doc.content?.some(nodeHasContent) ?? false)
}

export function hasPendingBlogImages(raw: string): boolean {
  const walk = (node: JSONContent): boolean => {
    if (node.type === "imageUpload") {
      return true
    }

    return node.content?.some(walk) ?? false
  }

  return walk(parseBlogContent(raw))
}

export type BlogContentImage = {
  src: string
  alt: string
}

function collectImages(node: JSONContent, images: BlogContentImage[]) {
  if (node.type === "image") {
    const src = typeof node.attrs?.src === "string" ? node.attrs.src : ""

    if (src) {
      images.push({
        src,
        alt: typeof node.attrs?.alt === "string" ? node.attrs.alt : "",
      })
    }
  }

  node.content?.forEach((child) => collectImages(child, images))
}

export function collectContentImages(raw: string): BlogContentImage[] {
  const images: BlogContentImage[] = []
  collectImages(parseBlogContent(raw), images)
  return images
}

export function createEmptyBlogContent(): string {
  return serializeBlogContent(createEmptyDoc())
}

function sanitizeNodeLinks(node: JSONContent): JSONContent {
  if (node.marks?.length) {
    const marks = node.marks.flatMap((mark) => {
      if (mark.type !== "link") {
        return [mark]
      }

      const href =
        typeof mark.attrs?.href === "string" ? mark.attrs.href : ""

      const safeHref = sanitizeBlogHref(href)

      if (!safeHref) {
        return []
      }

      return [{ ...mark, attrs: { ...mark.attrs, href: safeHref } }]
    })

    node = marks.length > 0 ? { ...node, marks } : { ...node, marks: undefined }
  }

  if (node.content?.length) {
    return {
      ...node,
      content: node.content.map(sanitizeNodeLinks),
    }
  }

  return node
}

export function sanitizeBlogContent(raw: string): string {
  const doc = parseBlogContent(raw)

  return serializeBlogContent({
    ...doc,
    content: doc.content?.map(sanitizeNodeLinks),
  })
}

export type BlogImageAlign = "left" | "center" | "right"

export type BlogImageLayout = {
  width: number | null
  align: BlogImageAlign
}

// The resize extension writes `minWidth: 80, maxWidth: 1200` in the editor;
// clamping again here means a hand-edited document cannot force an absurd size
// onto the public page.
const MIN_IMAGE_WIDTH = 40
const MAX_IMAGE_WIDTH = 2000

/**
 * Reads the display size an admin chose for an image in the Tiptap editor.
 *
 * `tiptap-extension-resize-image` persists layout as raw CSS text in the
 * `containerStyle` attribute (e.g. `width: 420px; height: auto; margin: 0 auto;`).
 * That CSS is never replayed onto the public page -- only a clamped number and a
 * three-value alignment enum cross the boundary, so there is no CSS injection
 * surface to sanitize. Images saved before resizing existed have no
 * `containerStyle` and fall back to full width, exactly as they render today.
 */
export function parseImageLayout(
  attrs?: Record<string, unknown> | null,
): BlogImageLayout {
  const containerStyle =
    typeof attrs?.containerStyle === "string" ? attrs.containerStyle : ""

  const widthMatch = containerStyle.match(/(?:^|[;\s])width:\s*([0-9.]+)px/)
  const parsedWidth = widthMatch ? Number.parseFloat(widthMatch[1]) : Number.NaN

  const width =
    Number.isFinite(parsedWidth) && parsedWidth > 0
      ? Math.min(Math.max(Math.round(parsedWidth), MIN_IMAGE_WIDTH), MAX_IMAGE_WIDTH)
      : null

  // The extension expresses alignment through the `margin` shorthand it writes
  // on the container: `0 auto` centres, `0 0 0 auto` pushes right.
  const marginMatch = containerStyle.match(/(?:^|[;\s])margin:\s*([^;]+)/)
  const margin = marginMatch ? marginMatch[1].trim().split(/\s+/) : []

  let align: BlogImageAlign = "left"

  if (margin.length === 2 && margin[1] === "auto") {
    align = "center"
  } else if (margin.length === 4) {
    const [, right, , left] = margin

    if (left === "auto" && right === "auto") {
      align = "center"
    } else if (left === "auto") {
      align = "right"
    }
  }

  return { width, align }
}
