import type { NextRequest } from "next/server"

import { handleError, successResponse } from "@/lib/http"
import {
  createFaqSchema,
  updateFaqSchema,
} from "@/lib/schemas/faq"
import { paginationQuerySchema } from "@/lib/schemas/common"
import { requireAdmin } from "@/lib/require-admin"
import { faqService } from "@/server/services/faq.service"

export const faqController = {
  async list(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const query = paginationQuerySchema.parse({
        page: searchParams.get("page") ?? undefined,
        limit: searchParams.get("limit") ?? undefined,
        search: searchParams.get("search") ?? undefined,
      })

      const data = await faqService.list(query)
      return successResponse(data, "FAQs retrieved successfully")
    } catch (error) {
      return handleError(error)
    }
  },

  async getById(_request: NextRequest, id: string) {
    try {
      const data = await faqService.getById(id)
      return successResponse(data, "FAQ retrieved successfully")
    } catch (error) {
      return handleError(error)
    }
  },

  async create(request: NextRequest) {
    try {
      await requireAdmin({ mode: "api" })
      const body = createFaqSchema.parse(await request.json())
      const data = await faqService.create(body)
      return successResponse(data, "FAQ created successfully", 201)
    } catch (error) {
      return handleError(error)
    }
  },

  async update(request: NextRequest, id: string) {
    try {
      await requireAdmin({ mode: "api" })
      const body = updateFaqSchema.parse(await request.json())
      const data = await faqService.update(id, body)
      return successResponse(data, "FAQ updated successfully")
    } catch (error) {
      return handleError(error)
    }
  },

  async delete(_request: NextRequest, id: string) {
    try {
      await requireAdmin({ mode: "api" })
      const data = await faqService.delete(id)
      return successResponse(data, "FAQ deleted successfully")
    } catch (error) {
      return handleError(error)
    }
  },
}
