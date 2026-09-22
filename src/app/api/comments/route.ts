import type { NextRequest } from "next/server"

import { commentController } from "@/server/controllers/comment.controller"

export async function GET(request: NextRequest) {
  return commentController.listAll(request)
}
