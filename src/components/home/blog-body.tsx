import type { JSONContent } from "@tiptap/react"
import Image from "next/image"

import { parseBlogContent } from "@/lib/blog-content"
import { sanitizeBlogHref } from "@/lib/sanitize-href"

type BlogBodyProps = {
  content: string
}

function renderMarks(
  text: string,
  marks?: JSONContent["marks"],
): React.ReactNode {
  if (!marks?.length) {
    return text
  }

  return marks.reduce<React.ReactNode>((node, mark) => {
    switch (mark.type) {
      case "bold":
        return <strong>{node}</strong>
      case "italic":
        return <em>{node}</em>
      case "link": {
        const rawHref =
          typeof mark.attrs?.href === "string" ? mark.attrs.href : ""
        const href = sanitizeBlogHref(rawHref)

        if (!href) {
          return node
        }

        return (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {node}
          </a>
        )
      }
      default:
        return node
    }
  }, text)
}

function renderInline(content?: JSONContent[]): React.ReactNode {
  if (!content?.length) {
    return null
  }

  return content.map((node, index) => {
    if (node.type === "hardBreak") {
      return <br key={index} />
    }

    if (node.type === "text" && typeof node.text === "string") {
      return (
        <span key={index}>{renderMarks(node.text, node.marks)}</span>
      )
    }

    return null
  })
}

function renderBlock(node: JSONContent, index: number): React.ReactNode {
  switch (node.type) {
    case "paragraph":
      return <p key={index}>{renderInline(node.content)}</p>
    case "heading": {
      const level = node.attrs?.level

      if (level === 1) {
        return <h1 key={index}>{renderInline(node.content)}</h1>
      }

      if (level === 2) {
        return <h2 key={index}>{renderInline(node.content)}</h2>
      }

      return <h3 key={index}>{renderInline(node.content)}</h3>
    }
    case "bulletList":
      return (
        <ul key={index}>
          {node.content?.map((item, itemIndex) => renderBlock(item, itemIndex))}
        </ul>
      )
    case "orderedList":
      return (
        <ol key={index}>
          {node.content?.map((item, itemIndex) => renderBlock(item, itemIndex))}
        </ol>
      )
    case "listItem":
      return (
        <li key={index}>
          {node.content?.map((child, childIndex) =>
            renderBlock(child, childIndex),
          )}
        </li>
      )
    case "image": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : null
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : ""

      if (!src) {
        return null
      }

      return (
        <Image
          key={index}
          src={src}
          alt={alt}
          width={800}
          height={450}
          className="my-4 h-auto w-full max-w-full"
          unoptimized={src.startsWith("http")}
        />
      )
    }
    default:
      return node.content?.length ? (
        <div key={index}>{node.content.map(renderBlock)}</div>
      ) : null
  }
}

export function BlogBody({ content }: BlogBodyProps) {
  const doc = parseBlogContent(content)

  return (
    <div className="home-panel__body">
      {doc.content?.map((node, index) => renderBlock(node, index))}
    </div>
  )
}
