import type { Post, PostsPayload } from '@jt-blog/content'

export async function loadPosts(): Promise<PostsPayload> {
  const response = await fetch('/content/posts.json', {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok)
    throw new Error(`Content request failed with HTTP ${response.status}.`)

  const payload = await response.json() as PostsPayload
  if (!Array.isArray(payload.posts))
    throw new Error('Content response does not contain a posts array.')

  return payload
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatPostMeta(post: Pick<Post, 'publishedAt' | 'readingMinutes' | 'tags'>) {
  const tag = post.tags[0]
  return `${formatDate(post.publishedAt)} · ${post.readingMinutes} min read${tag ? ` · ${tag}` : ''}`
}
