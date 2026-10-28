"use client"

import { MessageSquareIcon } from "lucide-react"
import { useId, useState } from "react"
import { toast } from "sonner"

import { Spinner } from "@/components/ui/spinner"
import type { Locale } from "@/i18n/config"
import type { Dictionary } from "@/i18n/dictionary"
import { format } from "@/i18n/format"
import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/api"
import { formatBlogDateShort } from "@/lib/format-date"
import { createCommentSchema } from "@/lib/schemas/comment"
import type { Comment } from "@/lib/types"

const MAX_COMMENT_LENGTH = 2000

type BlogCommentsProps = {
  blogId: string
  initialComments: Comment[]
  locale: Locale
  labels: Dictionary["comments"]
}

export function BlogComments({
  blogId,
  initialComments,
  locale,
  labels,
}: BlogCommentsProps) {
  const baseId = useId()
  const [comments, setComments] = useState(initialComments)
  const [name, setName] = useState("")
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nameId = `${baseId}-name`
  const contentId = `${baseId}-content`

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Same schema the route handler runs. The server validates again
    // regardless -- this only saves a round trip.
    const parsed = createCommentSchema.safeParse({
      name: name || undefined,
      content,
    })

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? labels.invalid)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await api.post<ApiResponse<Comment>>(
        `/blogs/${blogId}/comments`,
        parsed.data,
      )
      const created = response.data.data

      if (created) {
        setComments((current) => [created, ...current])
      }

      setName("")
      setContent("")
      toast.success(labels.posted)
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : labels.failed
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="home-comments" aria-label={labels.label}>
      <details className="home-comments__compose">
        <summary className="home-comments__toggle">{labels.shareToggle}</summary>

        <form className="home-comments__form" onSubmit={handleSubmit}>
          <div className="home-comments__row">
            <label className="home-comments__label" htmlFor={nameId}>
              {labels.nameLabel}
            </label>
            <input
              id={nameId}
              className="home-comments__input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              placeholder={labels.anonymous}
              disabled={submitting}
            />
          </div>

          <div className="home-comments__row">
            <label className="home-comments__label" htmlFor={contentId}>
              {labels.commentLabel}
            </label>
            <textarea
              id={contentId}
              className="home-comments__textarea"
              value={content}
              onChange={(event) => {
                setContent(event.target.value)

                if (error) {
                  setError(null)
                }
              }}
              maxLength={MAX_COMMENT_LENGTH}
              rows={3}
              placeholder={labels.placeholder}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${baseId}-error` : undefined}
              disabled={submitting}
              required
            />
            <span className="home-comments__counter">
              {content.trim().length}/{MAX_COMMENT_LENGTH}
            </span>
          </div>

          {error ? (
            <p id={`${baseId}-error`} className="home-comments__error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="home-comments__submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner className="size-4" />
                {labels.posting}
              </>
            ) : (
              labels.submit
            )}
          </button>
        </form>
      </details>

      <h3 className="home-comments__heading">
        <MessageSquareIcon className="home-panel__meta-icon" aria-hidden />
        {format(labels.heading, { count: comments.length })}
      </h3>

      {comments.length === 0 ? (
        <p className="home-comments__empty">
          {labels.empty}
        </p>
      ) : (
        <ul className="home-comments__list">
          {comments.map((comment) => (
            <li key={comment.id} className="home-comments__item">
              <p className="home-comments__meta">
                <span className="home-comments__author">{comment.name}</span>
                <span className="home-comments__date">
                  {formatBlogDateShort(comment.createdAt, locale)}
                </span>
              </p>
              {/* Plain text node: React escapes it, and nothing on this page
                  is ever interpreted as HTML. */}
              <p className="home-comments__body">{comment.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
