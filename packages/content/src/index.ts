export interface Post {
  id: string
  slug: string
  title: string
  description: string
  publishedAt: string
  updatedAt: string
  tags: string[]
  readingMinutes: number
  markdown: string
}

export interface PostsPayload {
  generatedAt: string
  posts: Post[]
}
