import { NotFoundError } from "@/lib/errors"
import { getPaginationMeta } from "@/lib/schemas/common"
import type { CreateFaqInput, UpdateFaqInput } from "@/lib/schemas/faq"
import { faqRepository } from "@/server/repositories/faq.repository"

export const faqService = {
  async list(params: { page: number; limit: number; search?: string }) {
    const skip = (params.page - 1) * params.limit
    const [items, total] = await Promise.all([
      faqRepository.findMany({
        skip,
        take: params.limit,
        search: params.search,
      }),
      faqRepository.count(params.search),
    ])

    return {
      items,
      meta: getPaginationMeta(total, params.page, params.limit),
    }
  },

  async getById(id: string) {
    const faq = await faqRepository.findById(id)

    if (!faq) {
      throw new NotFoundError("FAQ not found")
    }

    return faq
  },

  async create(input: CreateFaqInput) {
    return faqRepository.create(input)
  },

  async update(id: string, input: UpdateFaqInput) {
    await this.getById(id)
    return faqRepository.update(id, input)
  },

  async delete(id: string) {
    await this.getById(id)
    return faqRepository.delete(id)
  },
}
