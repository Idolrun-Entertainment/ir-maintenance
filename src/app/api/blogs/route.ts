import type { NextRequest } from "next/server"

import { blogController } from "@/server/controllers/blog.controller"

// Translation runs after the response (see queueAndProcess) and needs Node.
export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(request: NextRequest) {
  return blogController.list(request)
}

export async function POST(request: NextRequest) {
  return blogController.create(request)
}
