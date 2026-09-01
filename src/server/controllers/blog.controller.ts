import { revalidatePath } from "next/cache"
import type { NextRequest } from "next/server"

import { handleError, successResponse } from "@/lib/http"
import {
  createBlogSchema,
  updateBlogSchema,
} from "@/lib/schemas/blog"
import { paginationQuerySchema } from "@/lib/schemas/common"
import { requireAdmin } from "@/lib/require-admin"
import { blogService } from "@/server/services/blog.service"

export const blogController = {
  async list(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const query = paginationQuerySchema.parse({
        page: searchParams.get("page") ?? undefined,
        limit: searchParams.get("limit") ?? undefined,
        search: searchParams.get("search") ?? undefined,
      })

      const data = await blogService.list(query)
      return successResponse(data, "Blogs retrieved successfully")
    } catch (error) {
      return handleError(error)
    }
  },

  async getById(_request: NextRequest, id: string) {
    try {
      const data = await blogService.getById(id)
      return successResponse(data, "Blog retrieved successfully")
    } catch (error) {
      return handleError(error)
    }
  },

  async create(request: NextRequest) {
    try {
      await requireAdmin({ mode: "api" })
      const body = createBlogSchema.parse(await request.json())
      const data = await blogService.create(body)
      revalidatePath("/")
      return successResponse(data, "Blog created successfully", 201)
    } catch (error) {
      return handleError(error)
    }
  },

  async update(request: NextRequest, id: string) {
    try {
      await requireAdmin({ mode: "api" })
      const body = updateBlogSchema.parse(await request.json())
      const data = await blogService.update(id, body)
      revalidatePath("/")
      return successResponse(data, "Blog updated successfully")
    } catch (error) {
      return handleError(error)
    }
  },

  async delete(_request: NextRequest, id: string) {
    try {
      await requireAdmin({ mode: "api" })
      const data = await blogService.delete(id)
      revalidatePath("/")
      return successResponse(data, "Blog deleted successfully")
    } catch (error) {
      return handleError(error)
    }
  },
}
