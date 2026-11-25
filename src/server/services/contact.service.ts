import { NotFoundError } from "@/lib/errors"
import type { ContactInput } from "@/lib/schemas/contact"
import { getPaginationMeta } from "@/lib/schemas/common"
import { contactRepository } from "@/server/repositories/contact.repository"

async function requireExisting(id: string) {
  const existing = await contactRepository.findById(id)

  if (!existing) {
    throw new NotFoundError("Query not found")
  }
}

export const contactService = {
  create(input: Pick<ContactInput, "email" | "message">) {
    return contactRepository.create({ email: input.email, message: input.message })
  },

  async list(params: {
    page: number
    limit: number
    search?: string
    unreadOnly?: boolean
  }) {
    const skip = (params.page - 1) * params.limit
    const [items, total] = await Promise.all([
      contactRepository.findManyForAdmin({
        skip,
        take: params.limit,
        search: params.search,
        unreadOnly: params.unreadOnly,
      }),
      contactRepository.countForAdmin(params),
    ])

    return { items, meta: getPaginationMeta(total, params.page, params.limit) }
  },

  async setRead(id: string, read: boolean) {
    await requireExisting(id)
    return contactRepository.setRead(id, read)
  },

  async delete(id: string) {
    await requireExisting(id)
    return contactRepository.delete(id)
  },
}
