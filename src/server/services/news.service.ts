import { NotFoundError } from "@/lib/errors"
import { getPaginationMeta } from "@/lib/schemas/common"
import type { CreateNewsInput, UpdateNewsInput } from "@/lib/schemas/news"
import { newsRepository } from "@/server/repositories/news.repository"

export const newsService = {
  async list(params: { page: number; limit: number; search?: string }) {
    const skip = (params.page - 1) * params.limit
    const [items, total] = await Promise.all([
      newsRepository.findMany({
        skip,
        take: params.limit,
        search: params.search,
      }),
      newsRepository.count(params.search),
    ])

    return {
      items,
      meta: getPaginationMeta(total, params.page, params.limit),
    }
  },

  async getById(id: string) {
    const news = await newsRepository.findById(id)

    if (!news) {
      throw new NotFoundError("News not found")
    }

    return news
  },

  async create(input: CreateNewsInput) {
    return newsRepository.create(input)
  },

  async update(id: string, input: UpdateNewsInput) {
    await this.getById(id)
    return newsRepository.update(id, input)
  },

  async delete(id: string) {
    await this.getById(id)
    return newsRepository.delete(id)
  },
}
