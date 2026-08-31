import { v2 as cloudinary } from "cloudinary"

import { AppError } from "./errors"

function ensureCloudinaryConfig() {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new AppError("Cloudinary is not configured", 500)
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

export function uploadImageBuffer(
  buffer: Buffer,
  folder = process.env.CLOUDINARY_UPLOAD_FOLDER ?? "battle-kard-blogs",
): Promise<{ imageUrl: string; imagePublicId: string }> {
  ensureCloudinaryConfig()

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Upload failed"))
          return
        }

        resolve({
          imageUrl: result.secure_url,
          imagePublicId: result.public_id,
        })
      },
    )

    uploadStream.end(buffer)
  })
}

export async function destroyImage(publicId: string) {
  ensureCloudinaryConfig()
  return cloudinary.uploader.destroy(publicId)
}

export function publicIdFromCloudinaryUrl(url: string): string {
  try {
    const { pathname } = new URL(url)
    const marker = "/image/upload/"
    const index = pathname.indexOf(marker)

    if (index === -1) {
      return ""
    }

    let rest = pathname.slice(index + marker.length)
    rest = rest.replace(/^v\d+\//, "")
    return decodeURIComponent(rest.replace(/\.[a-zA-Z0-9]+$/, ""))
  } catch {
    return ""
  }
}
