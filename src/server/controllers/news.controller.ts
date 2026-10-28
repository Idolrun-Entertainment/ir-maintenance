import { revalidatePath } from "next/cache"
import type { NextRequest } from "next/server"

import { handleError, successResponse } from "@/lib/http"
import { paginationQuerySchema } from "@/lib/schemas/common"
import {
  createNewsSchema,
  newsIdSchema,
  updateNewsSchema,
} from "@/lib/schemas/news"
import { requireAdmin } from "@/lib/require-admin"
import { newsService } from "@/server/services/news.service"
import { queueAndProcess } from "@/server/translation"

function parseListQuery(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  return paginationQuerySchema.parse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  })
}

function revalidateNewsPages() {
  revalidatePath("/")
  revalidatePath("/[locale]", "page")
}

export const newsController = {
  async list(request: NextRequest) {
    try {
      const data = await newsService.list(parseListQuery(request))
      return successResponse(data, "News retrieved successfully")
    } catch (error) {
      return handleError(error)
    }
  },

  async getById(_request: NextRequest, id: string) {
    try {
      const data = await newsService.getById(newsIdSchema.parse(id))
      return successResponse(data, "News retrieved successfully")
    } catch (error) {
      return handleError(error)
    }
  },

  async create(request: NextRequest) {
    try {
      await requireAdmin({ mode: "api" })
      const body = createNewsSchema.parse(await request.json())
      const data = await newsService.create(body)
      revalidateNewsPages()
      queueAndProcess("news", data.id)
      return successResponse(data, "News created successfully", 201)
    } catch (error) {
      return handleError(error)
    }
  },

  async update(request: NextRequest, id: string) {
    try {
      await requireAdmin({ mode: "api" })
      const newsId = newsIdSchema.parse(id)
      const body = updateNewsSchema.parse(await request.json())
      const data = await newsService.update(newsId, body)
      revalidateNewsPages()
      queueAndProcess("news", newsId)
      return successResponse(data, "News updated successfully")
    } catch (error) {
      return handleError(error)
    }
  },

  async delete(_request: NextRequest, id: string) {
    try {
      await requireAdmin({ mode: "api" })
      const data = await newsService.delete(newsIdSchema.parse(id))
      revalidateNewsPages()
      return successResponse(data, "News deleted successfully")
    } catch (error) {
      return handleError(error)
    }
  },
}
