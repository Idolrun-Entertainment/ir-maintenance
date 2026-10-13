"use client"

import { useState } from "react"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { UploadThingDropzone } from "@/components/ui/uploadthing-dropzone"
import { isAllowedNewsImageUrl } from "@/lib/news-image"
import { createNewsSchema } from "@/lib/schemas/news"
import { uploadBlogImage } from "@/lib/upload-blog-image"
import type { News } from "@/lib/types"

type NewsFormValues = {
  title: string
  imageUrl: string | null
}

type NewsFormProps = {
  initialValues?: Partial<NewsFormValues>
  submitLabel: string
  showImageUrl?: boolean
  onSubmit: (values: NewsFormValues) => Promise<void>
}

type FormErrors = {
  title?: string
  imageUrl?: string
}

function validateNewsForm(title: string, imageUrl: string): FormErrors {
  const parsed = createNewsSchema.safeParse({
    title,
    imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
  })

  if (parsed.success) {
    return {}
  }

  const fields = z.flattenError(parsed.error).fieldErrors

  return {
    title: fields.title?.[0],
    imageUrl: fields.imageUrl?.[0],
  }
}

export function NewsForm({
  initialValues,
  submitLabel,
  showImageUrl = true,
  onSubmit,
}: NewsFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? "")
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl ?? "")
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (uploading) {
      toast.error("Wait for the image to finish uploading")
      return
    }

    const nextErrors = validateNewsForm(title, imageUrl)
    setErrors(nextErrors)

    if (nextErrors.title || nextErrors.imageUrl) {
      return
    }

    setSubmitting(true)

    try {
      await onSubmit({
        title: title.trim(),
        imageUrl: imageUrl.trim() || null,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const previewUrl = isAllowedNewsImageUrl(imageUrl.trim()) ? imageUrl.trim() : null
  const busy = submitting || uploading

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <FieldGroup>
        <Field data-invalid={errors.title ? true : undefined}>
          <FieldLabel htmlFor="news-title">Title</FieldLabel>
          <Input
            id="news-title"
            value={title}
            onChange={(event) => {
              const nextTitle = event.target.value
              setTitle(nextTitle)

              if (errors.title && !validateNewsForm(nextTitle, imageUrl).title) {
                setErrors((current) => ({ ...current, title: undefined }))
              }
            }}
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? "news-title-error" : undefined}
            required
          />
          <FieldError id="news-title-error" errors={[{ message: errors.title }]} />
        </Field>

        <Field data-invalid={!showImageUrl && errors.imageUrl ? true : undefined}>
          <FieldLabel htmlFor="news-image-file">Image</FieldLabel>
          <UploadThingDropzone
            inputId="news-image-file"
            describedBy={
              !showImageUrl && errors.imageUrl
                ? "news-image-file-hint news-image-file-error"
                : "news-image-file-hint"
            }
            accept="image/*"
            maxFiles={1}
            maxSize={5 * 1024 * 1024}
            disabled={submitting}
            onUploadingChange={setUploading}
            onFilesChange={(files) => {
              setImageUrl(files[0]?.url ?? "")
              if (files[0]?.url) {
                setErrors((current) => ({ ...current, imageUrl: undefined }))
              }
            }}
            onUpload={async (files) => {
              const file = files[0]
              if (!file) return []
              if (!file.type.startsWith("image/")) {
                throw new Error("Only image files are allowed")
              }
              const uploaded = await uploadBlogImage(file)
              return [
                {
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  url: uploaded.imageUrl,
                },
              ]
            }}
          />
          <FieldDescription id="news-image-file-hint">
            {showImageUrl
              ? "Optional. Uploading an image fills the URL below."
              : "Optional. Leave this empty to publish without an image."}
          </FieldDescription>
          {showImageUrl ? null : (
            <FieldError
              id="news-image-file-error"
              errors={[{ message: errors.imageUrl }]}
            />
          )}
        </Field>

        {showImageUrl ? (
          <Field data-invalid={errors.imageUrl ? true : undefined}>
            <FieldLabel htmlFor="news-image-url">Image URL</FieldLabel>
            <Input
              id="news-image-url"
              type="url"
              inputMode="url"
              value={imageUrl}
              placeholder="https://"
              onChange={(event) => {
                const nextUrl = event.target.value
                setImageUrl(nextUrl)

                if (errors.imageUrl && !validateNewsForm(title, nextUrl).imageUrl) {
                  setErrors((current) => ({ ...current, imageUrl: undefined }))
                }
              }}
              aria-invalid={errors.imageUrl ? true : undefined}
              aria-describedby={
                errors.imageUrl
                  ? "news-image-url-hint news-image-url-error"
                  : "news-image-url-hint"
              }
              disabled={busy}
            />
            <FieldDescription id="news-image-url-hint">
              Leave blank to publish without an image. Cloudinary and placehold.co only.
            </FieldDescription>
            <FieldError
              id="news-image-url-error"
              errors={[{ message: errors.imageUrl }]}
            />
          </Field>
        ) : null}
      </FieldGroup>

      {showImageUrl && previewUrl ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">Preview</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={title.trim() || "News image preview"}
            className="aspect-[16/10] w-full max-w-sm rounded-xl object-cover"
          />
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            disabled={busy}
            onClick={() => {
              setImageUrl("")
              setErrors((current) => ({ ...current, imageUrl: undefined }))
            }}
          >
            Remove image
          </Button>
        </div>
      ) : null}

      <Button type="submit" size="lg" className="h-10 w-fit" disabled={busy}>
        {uploading ? "Uploading..." : submitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  )
}

export type { NewsFormValues }

export function newsToFormValues(news: News): NewsFormValues {
  return {
    title: news.title,
    imageUrl: news.imageUrl,
  }
}
