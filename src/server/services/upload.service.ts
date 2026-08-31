import { ValidationError } from "@/lib/errors"
import { uploadImageBuffer } from "@/lib/cloudinary"

const MAX_FILE_SIZE = 5 * 1024 * 1024

export const uploadService = {
  async uploadImage(file: File) {
    if (!file.type.startsWith("image/")) {
      throw new ValidationError("Only image files are allowed")
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError("Image must be 5MB or smaller")
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return uploadImageBuffer(buffer)
  },
}
