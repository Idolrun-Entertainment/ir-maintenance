import type { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"

function whereTitle(search?: string): Prisma.NewsWhereInput {
  return search
    ? { title: { contains: search, mode: "insensitive" } }
    : {}
}

export const newsRepository = {
  findMany(params: { skip: number; take: number; search?: string }) {
    return prisma.news.findMany({
      where: whereTitle(params.search),
      skip: params.skip,
      take: params.take,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    })
  },

  count(search?: string) {
    return prisma.news.count({ where: whereTitle(search) })
  },

  findById(id: string) {
    return prisma.news.findUnique({ where: { id } })
  },

  create(data: Prisma.NewsCreateInput) {
    return prisma.news.create({ data })
  },

  update(id: string, data: Prisma.NewsUpdateInput) {
    return prisma.news.update({ where: { id }, data })
  },

  delete(id: string) {
    return prisma.news.delete({ where: { id } })
  },
}
