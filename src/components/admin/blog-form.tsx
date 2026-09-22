"use client"

import { useState } from "react"
import { toast } from "sonner"

import { BlogContentEditor } from "@/components/admin/blog-content-editor"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  hasPendingBlogImages,
  isEmptyBlogContent,
} from "@/lib/blog-content"
import { slugify } from "@/lib/slugify"
import type { Blog } from "@/lib/types"

type BlogFormValues = {
  title: string
  slug: string
  date: string
  views: string
  content: string
}

type BlogFormProps = {
  initialValues?: Partial<BlogFormValues>
  submitLabel: string
  onSubmit: (values: BlogFormValues) => Promise<void>
  contentEditorKey?: string
}

function toDateInputValue(date?: string) {
  if (!date) {
    return new Date().toISOString().slice(0, 10)
  }

  return new Date(date).toISOString().slice(0, 10)
}

export function BlogForm({
  initialValues,
  submitLabel,
  onSubmit,
  contentEditorKey,
}: BlogFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? "")
  const [slug, setSlug] = useState(initialValues?.slug ?? "")
  const [slugLocked, setSlugLocked] = useState(Boolean(initialValues?.slug))
  const [date, setDate] = useState(toDateInputValue(initialValues?.date))
  const [views, setViews] = useState(initialValues?.views ?? "0")
  const [content, setContent] = useState(initialValues?.content ?? "")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isEmptyBlogContent(content)) {
      toast.error("Content is required")
      return
    }

    if (hasPendingBlogImages(content)) {
      toast.error("Wait for images to finish uploading")
      return
    }

    if (!Number.isInteger(Number(views)) || Number(views) < 0) {
      toast.error("Views must be a whole number of 0 or more")
      return
    }

    setSubmitting(true)

    try {
      await onSubmit({
        title,
        slug,
        date,
        views,
        content,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input
            id="title"
            value={title}
            onChange={(event) => {
              const nextTitle = event.target.value
              setTitle(nextTitle)

              if (!slugLocked) {
                setSlug(slugify(nextTitle))
              }
            }}
            required
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="slug">Slug (optional)</FieldLabel>
            <Input
              id="slug"
              value={slug}
              onChange={(event) => {
                const nextSlug = event.target.value
                setSlug(nextSlug)
                setSlugLocked(nextSlug.length > 0)
              }}
              placeholder="auto-generated from title"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="date">Date</FieldLabel>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="views">Views</FieldLabel>
            <Input
              id="views"
              type="number"
              min={0}
              step={1}
              value={views}
              onChange={(event) => setViews(event.target.value)}
              required
            />
            <FieldDescription>
              Visitors add 1 on each visit. Editing this overwrites the count.
            </FieldDescription>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="content">Content</FieldLabel>
          <BlogContentEditor
            key={contentEditorKey}
            value={content}
            onChange={setContent}
            disabled={submitting}
          />
        </Field>
      </FieldGroup>

      <Button type="submit" size="lg" className="h-10" disabled={submitting}>
        {submitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  )
}

export type { BlogFormValues }

export function blogToFormValues(blog: Blog): BlogFormValues {
  return {
    title: blog.title,
    slug: blog.slug,
    date: toDateInputValue(blog.date),
    views: String(blog.views),
    content: blog.content,
  }
}
