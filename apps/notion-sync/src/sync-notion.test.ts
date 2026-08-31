/* eslint-disable test/no-import-node-test */
import type { NotionPage } from './sync-notion.ts'
import { strict as assert } from 'node:assert'
import { mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  DEFAULT_PROPERTY_NAMES,
  envPropertyNames,
  estimateReadingMinutes,
  mapPageMetadata,
  mergeConfig,
  rewriteMarkdownImages,
  slugify,
  syncSnapshot,
} from './sync-notion.ts'

const config = mergeConfig()

test('keeps default property names when environment is empty', () => {
  const names = envPropertyNames({} as NodeJS.ProcessEnv)
  assert.deepEqual(names, {})
  assert.equal(mergeConfig({ propertyNames: names }).propertyNames.title, 'Title')
  assert.equal(mergeConfig({ propertyNames: names }).propertyNames.status, 'Status')
})

test('maps Notion properties and creates stable slug', () => {
  const page: NotionPage = {
    id: 'page-1',
    created_time: '2026-08-24T01:00:00.000Z',
    last_edited_time: '2026-08-24T02:00:00.000Z',
    properties: {
      [DEFAULT_PROPERTY_NAMES.title]: { type: 'title', title: [{ plain_text: 'Hello World' }] },
      [DEFAULT_PROPERTY_NAMES.slug]: { type: 'rich_text', rich_text: [] },
      [DEFAULT_PROPERTY_NAMES.description]: { type: 'rich_text', rich_text: [{ plain_text: 'Short intro' }] },
      [DEFAULT_PROPERTY_NAMES.published]: { type: 'date', date: { start: '2026-08-24' } },
      [DEFAULT_PROPERTY_NAMES.tags]: { type: 'multi_select', multi_select: [{ name: 'Solid' }, { name: 'Notion' }] },
      [DEFAULT_PROPERTY_NAMES.status]: { type: 'status', status: { name: 'Published' } },
    },
  }

  assert.deepEqual(mapPageMetadata(page, config), {
    id: 'page-1',
    slug: 'hello-world',
    title: 'Hello World',
    description: 'Short intro',
    publishedAt: '2026-08-24',
    updatedAt: '2026-08-24T02:00:00.000Z',
    tags: ['Solid', 'Notion'],
  })
  assert.equal(slugify('  Catppuccin / Solid 2  '), 'catppuccin-solid-2')
  assert.equal(estimateReadingMinutes('你好'.repeat(500)), 2)
})

test('downloads Notion images and keeps public URLs remote', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'jt-blog-media-'))
  try {
    let requestCount = 0
    const fetcher: typeof fetch = async () => {
      requestCount++
      return new Response('image', {
        status: 200,
        headers: { 'content-type': 'image/png' },
      })
    }
    const markdown = [
      '![cover](https://files.notion.so/signed/cover?expires=tomorrow)',
      '![asset](https://s3.us-west-2.amazonaws.com/secure.notion-static.com/page/image.png?X-Amz-Expires=3600)',
      '![diagram](https://raw.githubusercontent.com/example/blog/main/diagram.png)',
    ].join('\n')
    const rewritten = await rewriteMarkdownImages(markdown, directory, 'hello-world', fetcher)
    assert.match(rewritten, /^!\[cover\]\(\/content\/media\/hello-world\/[a-f0-9]{16}\.png\)/)
    assert.match(rewritten, /!\[diagram\]\(https:\/\/raw\.githubusercontent\.com\/example\/blog\/main\/diagram\.png\)$/)
    assert.equal(requestCount, 2)
    const files = await readdir(join(directory, 'hello-world'))
    assert.equal(files.length, 2)
    for (const fileName of files)
      assert.equal((await readFile(join(directory, 'hello-world', fileName))).length, 5)
  }
  finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('failed sync keeps previous snapshot', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'jt-blog-snapshot-'))
  const outputDir = join(directory, 'content')
  const oldSnapshot = '{"generatedAt":"old","posts":[]}'
  try {
    await writeFile(join(directory, 'placeholder'), '')
    await syncSnapshot({
      listPages: async () => [],
      getMarkdown: async () => '',
    }, { outputDir })
    assert.equal((await stat(outputDir)).mode & 0o777, 0o755)
    await writeFile(join(outputDir, 'posts.json'), oldSnapshot)
    await assert.rejects(() => syncSnapshot({
      listPages: async () => { throw new Error('network down') },
      getMarkdown: async () => '',
    }, { outputDir }))
    assert.equal(await readFile(join(outputDir, 'posts.json'), 'utf8'), oldSnapshot)
  }
  finally {
    await rm(directory, { recursive: true, force: true })
  }
})
