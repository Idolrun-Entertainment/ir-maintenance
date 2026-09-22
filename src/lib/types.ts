export type Blog = {
  id: string
  title: string
  slug: string
  date: string
  content: string
  imageUrl: string
  imagePublicId: string
  views: number
  createdAt: string
  updatedAt: string
}

export type Comment = {
  id: string
  blogId: string
  name: string
  content: string
  createdAt: string
}

// What the admin moderation list returns: a comment plus the blog it is on.
export type AdminComment = Comment & {
  blog: {
    id: string
    title: string
  }
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
