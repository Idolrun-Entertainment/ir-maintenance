import { z } from "zod"

import { isAllowedNewsImageUrl } from "@/lib/news-image"

const newsImageUrlSchema = z
  .string()
  .trim()
  .url("Image URL must be valid")
  .refine(
    (value) => isAllowedNewsImageUrl(value),
    "Image must be hosted on Cloudinary or placehold.co",
  )

export const createNewsSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    imageUrl: newsImageUrlSchema.nullish(),
  })
  .strict()

export const updateNewsSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").optional(),
    imageUrl: newsImageUrlSchema.nullish(),
  })
  .strict()

export const newsIdSchema = z.cuid("Invalid news id")

export type CreateNewsInput = z.infer<typeof createNewsSchema>
export type UpdateNewsInput = z.infer<typeof updateNewsSchema>
