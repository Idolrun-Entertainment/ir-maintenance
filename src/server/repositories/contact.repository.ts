import type { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"

function adminWhere(params: {
  search?: string
  unreadOnly?: boolean
}): Prisma.ContactMessageWhereInput {
  return {
    ...(params.unreadOnly ? { readAt: null } : {}),
    ...(params.search
      ? {
          OR: [
            { email: { contains: params.search, mode: "insensitive" } },
            { message: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  }
}

export const contactRepository = {
  create(data: { email: string; message: string }) {
    return prisma.contactMessage.create({ data })
  },

  findManyForAdmin(params: {
    skip: number
    take: number
    search?: string
    unreadOnly?: boolean
  }) {
    return prisma.contactMessage.findMany({
      where: adminWhere(params),
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: "desc" },
    })
  },

  countForAdmin(params: { search?: string; unreadOnly?: boolean }) {
    return prisma.contactMessage.count({ where: adminWhere(params) })
  },

  findById(id: string) {
    return prisma.contactMessage.findUnique({ where: { id } })
  },

  setRead(id: string, read: boolean) {
    return prisma.contactMessage.update({
      where: { id },
      data: { readAt: read ? new Date() : null },
    })
  },

  delete(id: string) {
    return prisma.contactMessage.delete({ where: { id } })
  },
}
