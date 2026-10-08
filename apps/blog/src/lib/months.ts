import type { Post } from '@jt-blog/content'

export interface MonthArchive {
  key: string
  year: number
  month: number
  posts: Post[]
  readingMinutes: number
}

const MONTH_KEY = /^(\d{4})-(0[1-9]|1[0-2])$/
const DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})(?=$|T| )/

export function monthKey(value: string) {
  const match = value.match(DATE_PREFIX)
  if (!match)
    return ''

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  if (date.getUTCFullYear() !== Number(match[1]) || date.getUTCMonth() !== Number(match[2]) - 1 || date.getUTCDate() !== Number(match[3]))
    return ''

  const key = `${match[1]}-${match[2]}`
  return MONTH_KEY.test(key) ? key : ''
}

export function parseMonthKey(value: string) {
  const match = value.match(MONTH_KEY)
  if (!match)
    return undefined

  return { key: value, year: Number(match[1]), month: Number(match[2]) }
}

export function groupPostsByMonth(posts: Post[]): MonthArchive[] {
  const groups = new Map<string, Post[]>()

  for (const post of posts) {
    const key = monthKey(post.publishedAt)
    if (!key)
      continue

    const group = groups.get(key)
    if (group)
      group.push(post)
    else
      groups.set(key, [post])
  }

  return [...groups.entries()]
    .map(([key, group]) => {
      const sortedPosts = [...group].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
      return {
        key,
        year: Number(key.slice(0, 4)),
        month: Number(key.slice(5, 7)),
        posts: sortedPosts,
        readingMinutes: sortedPosts.reduce((total, post) => total + post.readingMinutes, 0),
      }
    })
    .sort((left, right) => right.key.localeCompare(left.key))
}

export function formatMonthLabel(value: string | Pick<MonthArchive, 'year' | 'month'>) {
  const parsed = typeof value === 'string' ? parseMonthKey(value) : value
  if (!parsed)
    return ''

  return `${parsed.year}年${parsed.month}月`
}

export function formatMonthEnglishLabel(value: string | Pick<MonthArchive, 'year' | 'month'>) {
  const parsed = typeof value === 'string' ? parseMonthKey(value) : value
  if (!parsed)
    return ''

  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(parsed.year, parsed.month - 1, 1)))
}

export function formatMonthNumber(month: number) {
  return String(month).padStart(2, '0')
}

export function formatMonthDate(value: string) {
  const key = monthKey(value)
  if (!key)
    return ''

  const day = value.slice(8, 10)
  return /^\d{2}$/.test(day) ? `${key.slice(5)}.${day}` : key
}
