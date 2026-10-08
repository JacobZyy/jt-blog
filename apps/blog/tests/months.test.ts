/* eslint-disable test/no-import-node-test */
import type { Post } from '@jt-blog/content'
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { formatMonthDate, formatMonthEnglishLabel, formatMonthLabel, groupPostsByMonth, monthKey } from '../src/lib/months.ts'

function post(id: string, publishedAt: string, readingMinutes = 10): Post {
  return { id, slug: id, title: id, description: id, publishedAt, updatedAt: publishedAt, tags: [], readingMinutes, markdown: '' }
}

test('groups posts by local publication date prefix, newest month first', () => {
  const result = groupPostsByMonth([
    post('old', '2025-12-31T23:30:00-08:00', 8),
    post('new', '2026-01-01T00:30:00+08:00', 12),
    post('newer', '2026-01-01T09:00:00+08:00', 6),
  ])

  assert.deepEqual(result.map(month => month.key), ['2026-01', '2025-12'])
  assert.deepEqual(result[0].posts.map(item => item.id), ['newer', 'new'])
  assert.equal(result[0].readingMinutes, 18)
})

test('rejects invalid dates and keeps date formatting timezone safe', () => {
  assert.equal(monthKey('2026-02-29T10:00:00Z'), '')
  assert.equal(monthKey('2026-09-99T10:00:00Z'), '')
  assert.equal(monthKey('2026-09garbage'), '')
  assert.equal(monthKey('2026-09-03T23:30:00-08:00'), '2026-09')
  assert.equal(formatMonthDate('2026-09-03T23:30:00-08:00'), '09.03')
  assert.equal(formatMonthLabel('2026-09'), '2026年9月')
  assert.equal(formatMonthEnglishLabel('2026-09'), 'September 2026')
})

test('ignores posts without valid publication dates and supports empty input', () => {
  assert.deepEqual(groupPostsByMonth([]), [])
  assert.deepEqual(groupPostsByMonth([post('invalid', 'not-a-date')]), [])
})

test('keeps month content when post title is empty', () => {
  const untitled = post('untitled', '2026-09-03T10:00:00Z')
  untitled.title = ''
  const result = groupPostsByMonth([untitled])
  assert.equal(result[0].posts[0].title, '')
})
