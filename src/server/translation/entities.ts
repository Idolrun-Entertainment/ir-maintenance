import { createHash } from "node:crypto"

import { escapeHtml, stripTags } from "./html"
import { describeContent, planBlogContent } from "./tiptap"
import {
  TRANSLATION_PIPELINE_VERSION,
  type Fields,
  type Source,
} from "./types"

export type SourcePlan = {
  units: string[]
  assemble(translated: string[]): Fields
}

/** Hash of exactly the fields that get translated (+ pipeline version). */
export function hashSource(source: Source): string {
  const payload =
    source.kind === "blog"
      ? [source.title, source.content]
      : source.kind === "faq"
        ? [source.question, source.answer]
        : [source.title]

  return createHash("sha256")
    .update(JSON.stringify([TRANSLATION_PIPELINE_VERSION, source.kind, payload]))
    .digest("hex")
}

export function planSource(source: Source): SourcePlan {
  if (source.kind === "news") {
    return {
      units: [escapeHtml(source.title)],
      assemble: ([title]) => ({ title: stripTags(title) }),
    }
  }

  if (source.kind === "faq") {
    // FAQ answers are plain text with line breaks: translate line by line so
    // paragraph structure is preserved exactly.
    const lines = source.answer.split("\n")
    const indexes = lines.flatMap((line, i) => (line.trim() ? [i] : []))

    return {
      units: [
        escapeHtml(source.question),
        ...indexes.map((i) => escapeHtml(lines[i])),
      ],
      assemble([question, ...translatedLines]) {
        const out = [...lines]
        indexes.forEach((lineIndex, i) => {
          out[lineIndex] = stripTags(translatedLines[i])
        })

        return { question: stripTags(question), answer: out.join("\n") }
      },
    }
  }

  const content = planBlogContent(source.content)

  return {
    units: [escapeHtml(source.title), ...content.units],
    assemble([title, ...rest]) {
      const translatedTitle = stripTags(title)
      const translatedContent = content.apply(rest)

      return {
        title: translatedTitle,
        content: translatedContent,
        seoTitle: translatedTitle,
        seoDescription: describeContent(translatedContent) || null,
      }
    },
  }
}
