import type { NextRequest } from "next/server"

import { ValidationError } from "@/lib/errors"
import { handleError, successResponse } from "@/lib/http"
import { requireAdmin } from "@/lib/require-admin"
import { uploadService } from "@/server/services/upload.service"

export const uploadController = {
  async upload(request: NextRequest) {
    try {
      await requireAdmin({ mode: "api" })
      const contentType = request.headers.get("content-type") ?? ""

      if (!contentType.includes("multipart/form-data")) {
        throw new ValidationError("Expected multipart form data")
      }

      const formData = await request.formData()
      const file = formData.get("file")

      if (!(file instanceof File)) {
        throw new ValidationError("No file provided")
      }

      const data = await uploadService.uploadImage(file)
      return successResponse(data, "Image uploaded successfully", 201)
    } catch (error) {
      return handleError(error)
    }
  },
}
