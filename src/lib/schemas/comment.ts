import { z } from "zod"

// Trimming before the length checks is what rejects whitespace-only comments.
// This schema is imported by the public comment form as well, so the rules are
// declared once and enforced on both sides.
export const createCommentSchema = z.object({
  name: z.string().trim().max(80, "Name must be 80 characters or fewer").optional(),
  content: z
    .string()
    .trim()
    .min(1, "Comment is required")
    .max(2000, "Comment must be 2000 characters or fewer"),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>

export const DEFAULT_COMMENT_NAME = "Anonymous"
