import type { Post } from '@jt-blog/content'
import { parseMonthKey } from './months.ts'

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
    return '每月博文 · jacob-z'
  if (path === '/topics')
    return '专题专栏 · jacob-z'
  if (path.startsWith('/posts/month/')) {
    let key = ''
    try {
      key = decodeURIComponent(path.slice('/posts/month/'.length))
    }
    catch {
      return '404'
    }
    const month = parseMonthKey(key)
    return month ? `${month.year}年${month.month}月 · 每月博文` : '404'
  }
  if (path.startsWith('/posts/')) {
    const title = posts.find(post => post.slug === postSlug(path))?.title
    return title ?? (loading ? 'Post' : '404')
  }
  return '404'
}
