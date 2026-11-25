"use client"

import { useId, useState, type FormEvent } from "react"
import { z } from "zod"
import { toast } from "sonner"

import { Spinner } from "@/components/ui/spinner"
import type { Dictionary } from "@/i18n/dictionary"
import { format } from "@/i18n/format"
import {
  MAX_CONTACT_MESSAGE_LENGTH,
  MIN_CONTACT_MESSAGE_LENGTH,
  contactSchema,
} from "@/lib/schemas/contact"

type Labels = Dictionary["contact"]
type FieldErrors = { email?: string; message?: string }

// The shared schema's own messages are English (the API returns them), so the
// form localizes by issue code instead.
function fieldErrors(error: z.ZodError, labels: Labels): FieldErrors {
  const result: FieldErrors = {}

  for (const issue of error.issues) {
    const field = issue.path[0]

    if (field === "email" && !result.email) {
      result.email =
        issue.code === "too_small"
          ? labels.emailRequired
          : issue.code === "too_big"
            ? labels.emailTooLong
            : labels.emailInvalid
    } else if (field === "message" && !result.message) {
      result.message =
        issue.code === "too_big"
          ? format(labels.messageTooLong, { max: MAX_CONTACT_MESSAGE_LENGTH })
          : format(labels.messageTooShort, { min: MIN_CONTACT_MESSAGE_LENGTH })
    }
  }

  return result
}

export function ContactForm({ labels }: { labels: Labels }) {
  const baseId = useId()
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [website, setWebsite] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Re-run the shared schema on every edit of a field that already shows an
  // error, so the message clears as soon as the value becomes valid.
  function revalidate(next: { email: string; message: string }) {
    const parsed = contactSchema.safeParse(next)
    const next_ = parsed.success ? {} : fieldErrors(parsed.error, labels)

    setErrors((current) => ({
      email: current.email ? next_.email : undefined,
      message: current.message ? next_.message : undefined,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) {
      return
    }

    setSent(false)
    setFormError(null)

    const parsed = contactSchema.safeParse({ email, message, website })

    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error, labels))
      return
    }

    setErrors({})
    setSubmitting(true)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      })

      if (!response.ok) {
        // 429 is the only failure a visitor can act on; the API's own text is English.
        throw new Error(response.status === 429 ? labels.tooMany : labels.failed)
      }

      setEmail("")
      setMessage("")
      setSent(true)
      toast.success(labels.toastSent)
    } catch (submitError) {
      const text =
        submitError instanceof Error && submitError.message === labels.tooMany
          ? labels.tooMany
          : labels.failed
      setFormError(text)
      toast.error(text)
    } finally {
      setSubmitting(false)
    }
  }

  const emailId = `${baseId}-email`
  const messageId = `${baseId}-message`

  return (
    <form className="home-comments__form" onSubmit={handleSubmit} noValidate>
      <div className="home-comments__row">
        <label className="home-comments__label" htmlFor={emailId}>
          {labels.emailLabel}
        </label>
        <input
          id={emailId}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          className="home-comments__input"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            revalidate({ email: event.target.value, message })
          }}
          maxLength={254}
          placeholder={labels.emailPlaceholder}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? `${emailId}-error` : undefined}
          disabled={submitting}
          required
        />
        {errors.email ? (
          <p id={`${emailId}-error`} className="home-comments__error" role="alert">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className="home-comments__row">
        <label className="home-comments__label" htmlFor={messageId}>
          {labels.messageLabel}
        </label>
        <textarea
          id={messageId}
          name="message"
          className="home-comments__textarea"
          value={message}
          onChange={(event) => {
            setMessage(event.target.value)
            revalidate({ email, message: event.target.value })
          }}
          maxLength={MAX_CONTACT_MESSAGE_LENGTH}
          rows={6}
          placeholder={labels.messagePlaceholder}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? `${messageId}-error` : undefined}
          disabled={submitting}
          required
        />
        <span className="home-comments__counter">
          {message.trim().length}/{MAX_CONTACT_MESSAGE_LENGTH}
        </span>
        {errors.message ? (
          <p id={`${messageId}-error`} className="home-comments__error" role="alert">
            {errors.message}
          </p>
        ) : null}
      </div>

      {/* Honeypot: off-screen, skipped by keyboard and assistive tech. */}
      <div aria-hidden style={{ position: "absolute", left: "-9999px" }}>
        <label>
          Leave this field empty
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </label>
      </div>

      {formError ? (
        <p className="home-comments__error" role="alert">
          {formError}
        </p>
      ) : null}
      {sent ? (
        <p className="home-comments__success" role="status">
          {labels.sent}
        </p>
      ) : null}

      <button type="submit" className="home-comments__submit" disabled={submitting}>
        {submitting ? (
          <>
            <Spinner className="size-4" />
            {labels.sending}
          </>
        ) : (
          labels.submit
        )}
      </button>
    </form>
  )
}
