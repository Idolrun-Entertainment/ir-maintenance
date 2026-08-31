import type { NextRequest } from "next/server"

import { blogController } from "@/server/controllers/blog.controller"

export async function GET(request: NextRequest) {
  return blogController.list(request)
}

export async function POST(request: NextRequest) {
  return blogController.create(request)
}
