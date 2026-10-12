import type { NextRequest } from "next/server"

import { newsController } from "@/server/controllers/news.controller"

export async function GET(request: NextRequest) {
  return newsController.list(request)
}

export async function POST(request: NextRequest) {
  return newsController.create(request)
}
