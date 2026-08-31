import type { NextRequest } from "next/server"

import { uploadController } from "@/server/controllers/upload.controller"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  return uploadController.upload(request)
}
