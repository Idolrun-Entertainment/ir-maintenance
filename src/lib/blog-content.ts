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
