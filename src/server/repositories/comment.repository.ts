import type { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"

function adminWhere(search?: string): Prisma.CommentWhereInput {
  if (!search) {
    return {}
  }

  return {
    OR: [
      { name: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
      { blog: { title: { contains: search, mode: "insensitive" } } },
    ],
  }
}

export const commentRepository = {
  findManyByBlogId(blogId: string, take?: number) {
    return prisma.comment.findMany({
      where: { blogId },
      orderBy: { createdAt: "desc" },
      take,
    })
  },

  create(data: Prisma.CommentUncheckedCreateInput) {
    return prisma.comment.create({ data })
  },

  // Admin moderation list: every comment, newest first, with the blog it
  // belongs to so the table can show where it was posted.
  findManyForAdmin(params: { skip: number; take: number; search?: string }) {
    return prisma.comment.findMany({
      where: adminWhere(params.search),
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: "desc" },
      include: { blog: { select: { id: true, title: true } } },
    })
  },

  countForAdmin(search?: string) {
    return prisma.comment.count({ where: adminWhere(search) })
  },

  findById(id: string) {
    return prisma.comment.findUnique({ where: { id } })
  },

  delete(id: string) {
    return prisma.comment.delete({ where: { id } })
  },
}
