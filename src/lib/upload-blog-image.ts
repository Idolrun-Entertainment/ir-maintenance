import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/api"

export type UploadedBlogImage = {
  imageUrl: string
  imagePublicId: string
}

export async function uploadBlogImage(file: File): Promise<UploadedBlogImage> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await api.post<
    ApiResponse<{ imageUrl: string; imagePublicId: string }>
  >("/upload", formData)

  const data = response.data.data

  if (!data?.imageUrl || !data.imagePublicId) {
    throw new Error("Upload failed")
  }

  return data
}
