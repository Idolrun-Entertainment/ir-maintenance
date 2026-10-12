import { ValidationError } from "@/lib/errors"
import { uploadImageBuffer } from "@/lib/cloudinary"
import { isRasterImage } from "@/lib/image-bytes"

const MAX_FILE_SIZE = 5 * 1024 * 1024

export const uploadService = {
  async uploadImage(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError("Image must be 5MB or smaller")
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    if (!isRasterImage(buffer)) {
      throw new ValidationError("Only JPEG, PNG, GIF, and WebP images are allowed")
    }

    return uploadImageBuffer(buffer)
  },
}
