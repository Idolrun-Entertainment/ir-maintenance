import { z } from "zod"

export const MIN_CONTACT_MESSAGE_LENGTH = 10
export const MAX_CONTACT_MESSAGE_LENGTH = 2000

export const contactSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .max(254, "Email must be 254 characters or fewer")
    .pipe(z.email("Enter a valid email address")),
  message: z
    .string()
    .trim()
    .min(
      MIN_CONTACT_MESSAGE_LENGTH,
      `Please write at least ${MIN_CONTACT_MESSAGE_LENGTH} characters`,
    )
    .max(
      MAX_CONTACT_MESSAGE_LENGTH,
      `Message must be ${MAX_CONTACT_MESSAGE_LENGTH} characters or fewer`,
    ),
  // Honeypot: hidden from people, filled by naive bots. Not an error, the
  // controller just drops the submission.
  website: z.string().max(200).optional(),
})

export type ContactInput = z.infer<typeof contactSchema>

export const contactStatusSchema = z.enum(["all", "unread"]).default("all")

export const setContactReadSchema = z.object({ read: z.boolean() })
