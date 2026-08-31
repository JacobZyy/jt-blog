import type { Post } from '@jt-blog/content'

export function postSlug(path: string) {
  try {
    return decodeURIComponent(path.slice('/posts/'.length))
  }
  catch {
    return ''
  }
}

export function routeTitle(path: string, posts: Array<Pick<Post, 'slug' | 'title'>>, loading = false) {
  if (path === '/')
    return 'jacob-z'
  if (path === '/posts')
    return 'Posts'
  if (path.startsWith('/posts/')) {
    const title = posts.find(post => post.slug === postSlug(path))?.title
    return title ?? (loading ? 'Post' : '404')
  }
  return '404'
}
