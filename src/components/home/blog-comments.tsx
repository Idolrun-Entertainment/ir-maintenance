"use client"

import { MessageSquareIcon } from "lucide-react"
import { useId, useState } from "react"
import { toast } from "sonner"

import { Spinner } from "@/components/ui/spinner"
import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/api"
import { formatBlogDateShort } from "@/lib/format-date"
import { createCommentSchema } from "@/lib/schemas/comment"
import type { Comment } from "@/lib/types"

const MAX_COMMENT_LENGTH = 2000

type BlogCommentsProps = {
  blogId: string
  initialComments: Comment[]
}

export function BlogComments({ blogId, initialComments }: BlogCommentsProps) {
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
      setError(parsed.error.issues[0]?.message ?? "Comment is invalid")
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
      toast.success("Comment posted")
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Failed to post comment"
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="home-comments" aria-label="Comments">
      <details className="home-comments__compose">
        <summary className="home-comments__toggle">Share Your Thoughts</summary>

        <form className="home-comments__form" onSubmit={handleSubmit}>
          <div className="home-comments__row">
            <label className="home-comments__label" htmlFor={nameId}>
              Name (optional)
            </label>
            <input
              id={nameId}
              className="home-comments__input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              placeholder="Anonymous"
              disabled={submitting}
            />
          </div>

          <div className="home-comments__row">
            <label className="home-comments__label" htmlFor={contentId}>
              Comment
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
              placeholder="Share your thoughts"
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
                Posting...
              </>
            ) : (
              "Post comment"
            )}
          </button>
        </form>
      </details>

      <h3 className="home-comments__heading">
        <MessageSquareIcon className="home-panel__meta-icon" aria-hidden />
        Comments ({comments.length})
      </h3>

      {comments.length === 0 ? (
        <p className="home-comments__empty">
          No comments yet. Be the first to say something.
        </p>
      ) : (
        <ul className="home-comments__list">
          {comments.map((comment) => (
            <li key={comment.id} className="home-comments__item">
              <p className="home-comments__meta">
                <span className="home-comments__author">{comment.name}</span>
                <span className="home-comments__date">
                  {formatBlogDateShort(comment.createdAt)}
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
