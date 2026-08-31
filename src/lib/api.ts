import axios from "axios"

import type { ApiResponse } from "./http"

export const api = axios.create({
  baseURL: "/api",
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ?? error.message ?? "Request failed"
    return Promise.reject(new Error(message))
  },
)

export type { ApiResponse }
