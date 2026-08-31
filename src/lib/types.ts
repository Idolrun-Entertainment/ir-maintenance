export type Blog = {
  id: string
  title: string
  slug: string
  date: string
  content: string
  imageUrl: string
  imagePublicId: string
  createdAt: string
  updatedAt: string
}

export type Faq = {
  id: string
  question: string
  answer: string
  order: number
  createdAt: string
  updatedAt: string
}

export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type PaginatedResponse<T> = {
  items: T[]
  meta: PaginationMeta
}
