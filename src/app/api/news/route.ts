import type { NextRequest } from "next/server"

import { newsController } from "@/server/controllers/news.controller"

// Translation runs after the response (see queueAndProcess) and needs Node.
export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(request: NextRequest) {
  return newsController.list(request)
}

export async function POST(request: NextRequest) {
  return newsController.create(request)
}
