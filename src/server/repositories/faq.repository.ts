import type { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"

export const faqRepository = {
  findMany(params: {
    skip: number
    take: number
    search?: string
  }) {
    const where: Prisma.FaqWhereInput = params.search
      ? {
          OR: [
            { question: { contains: params.search, mode: "insensitive" } },
            { answer: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}

    return prisma.faq.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    })
  },

  count(search?: string) {
    const where: Prisma.FaqWhereInput = search
      ? {
          OR: [
            { question: { contains: search, mode: "insensitive" } },
            { answer: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}

    return prisma.faq.count({ where })
  },

  findById(id: string) {
    return prisma.faq.findUnique({ where: { id } })
  },

  create(data: Prisma.FaqCreateInput) {
    return prisma.faq.create({ data })
  },

  update(id: string, data: Prisma.FaqUpdateInput) {
    return prisma.faq.update({ where: { id }, data })
  },

  delete(id: string) {
    return prisma.faq.delete({ where: { id } })
  },
}
