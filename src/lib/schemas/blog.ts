import { z } from "zod"

export const createBlogSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1).optional(),
  date: z.coerce.date(),
  content: z.string().min(1, "Content is required"),
  imageUrl: z.string().url("Image URL must be valid").optional(),
  imagePublicId: z.string().min(1).optional(),
})

export const updateBlogSchema = createBlogSchema.partial()

export type CreateBlogInput = z.infer<typeof createBlogSchema>
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>
