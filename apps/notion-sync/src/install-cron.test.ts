/* eslint-disable test/no-import-node-test */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { buildCronBlock, missingRequiredEnvironment, upsertCronBlock } from './install-cron.ts'

test('requires both Notion credentials', () => {
  assert.deepEqual(missingRequiredEnvironment('NOTION_TOKEN=token\nNOTION_DATA_SOURCE_ID='), ['NOTION_DATA_SOURCE_ID'])
  assert.deepEqual(missingRequiredEnvironment('NOTION_TOKEN=token\nNOTION_DATA_SOURCE_ID=source'), [])
})

test('installs one managed block without changing existing jobs', () => {
  const block = buildCronBlock({
    repositoryRoot: '/srv/jt blog',
    environmentFile: '/etc/jt-blog.env',
    pnpmExecutable: '/usr/local/bin/pnpm',
  })
  const existing = '15 3 * * * /usr/local/bin/backup\n'
  const first = upsertCronBlock(existing, block)
  const second = upsertCronBlock(first, block)

  assert.equal(second, first)
  assert.match(first, /^15 3 \* \* \* \/usr\/local\/bin\/backup/m)
  assert.match(first, /CRON_TZ=Asia\/Shanghai/)
  assert.match(first, /cd '\/srv\/jt blog'/)
  assert.equal(first.match(/BEGIN JT_BLOG_NOTION_SYNC/g)?.length, 1)
})
