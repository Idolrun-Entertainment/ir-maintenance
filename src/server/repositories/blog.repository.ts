import type { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"

export const blogRepository = {
  findMany(params: {
    skip: number
    take: number
    search?: string
  }) {
    const where: Prisma.BlogWhereInput = params.search
      ? {
          OR: [
            { title: { contains: params.search, mode: "insensitive" } },
            { slug: { contains: params.search, mode: "insensitive" } },
            { content: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}

    return prisma.blog.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { date: "desc" },
    })
  },

  count(search?: string) {
    const where: Prisma.BlogWhereInput = search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}

    return prisma.blog.count({ where })
  },

  findById(id: string) {
    return prisma.blog.findUnique({ where: { id } })
  },

  findBySlug(slug: string) {
    return prisma.blog.findUnique({ where: { slug } })
  },

  create(data: Prisma.BlogCreateInput) {
    return prisma.blog.create({ data })
  },

  // A single `UPDATE "Blog" SET views = views + 1`, so concurrent visitors
  // cannot read-modify-write over each other.
  incrementViews(id: string) {
    return prisma.blog.update({
      where: { id },
      data: { views: { increment: 1 } },
      select: { views: true },
    })
  },

  // Throws P2025 for an unknown id, which handleError maps to 404 -- same
  // contract as incrementViews.
  findViews(id: string) {
    return prisma.blog.findUniqueOrThrow({
      where: { id },
      select: { views: true },
    })
  },

  update(id: string, data: Prisma.BlogUpdateInput) {
    return prisma.blog.update({ where: { id }, data })
  },

  delete(id: string) {
    return prisma.blog.delete({ where: { id } })
  },
}
