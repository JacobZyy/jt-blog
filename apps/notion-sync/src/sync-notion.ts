import type { Post, PostsPayload } from '@jt-blog/content'
import { createHash, randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { chmod, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, extname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { CONTENT_DATA_DIR } from '@jt-blog/content/node'
import { APIErrorCode, Client, isFullPage, isNotionClientError } from '@notionhq/client'
import { NotionToMarkdown } from 'notion-to-md'

export const NOTION_VERSION = '2026-03-11'
export const DEFAULT_OUTPUT_DIR = CONTENT_DATA_DIR
export const DEFAULT_ENV_FILE = fileURLToPath(new URL('../.env', import.meta.url))

export const DEFAULT_PROPERTY_NAMES = {
  title: 'Title',
  slug: 'Slug',
  description: 'Description',
  published: 'Published',
  tags: 'Tags',
  status: 'Status',
} as const

export interface PropertyNames {
  title: string
  slug: string
  description: string
  published: string
  tags: string
  status: string
}

export interface NotionPage {
  id: string
  created_time?: string
  last_edited_time?: string
  properties: Record<string, NotionProperty>
}

export type NotionProperty = Record<string, unknown>

export interface SyncSource {
  listPages: () => Promise<NotionPage[]>
  getMarkdown: (pageId: string) => Promise<string>
}

export interface SyncConfig {
  propertyNames: PropertyNames
  publishedValue: string
}

export interface SyncOptions {
  outputDir?: string
  config?: {
    propertyNames?: Partial<PropertyNames>
    publishedValue?: string
  }
  now?: () => Date
}

const DEFAULT_CONFIG: SyncConfig = {
  propertyNames: { ...DEFAULT_PROPERTY_NAMES },
  publishedValue: 'Published',
}

interface NotionClientOptions {
  token: string
  dataSourceId: string
  baseUrl?: string
  propertyNames?: Partial<PropertyNames>
  publishedValue?: string
  fetcher?: typeof fetch
}

export class NotionClient implements SyncSource {
  private readonly client: Client
  private readonly converter: NotionToMarkdown
  private readonly propertyNames: PropertyNames
  private readonly publishedValue: string

  constructor(private readonly options: NotionClientOptions) {
    this.client = new Client({
      auth: options.token,
      baseUrl: options.baseUrl,
      fetch: options.fetcher,
      notionVersion: NOTION_VERSION,
      timeoutMs: 30_000,
    })
    this.converter = new NotionToMarkdown({
      notionClient: this.client,
      config: { parseChildPages: false },
    })
    this.propertyNames = { ...DEFAULT_PROPERTY_NAMES, ...options.propertyNames }
    this.publishedValue = options.publishedValue ?? 'Published'
  }

  async listPages(): Promise<NotionPage[]> {
    try {
      return await this.queryPages('status')
    }
    catch (error) {
      if (isNotionClientError(error) && error.code === APIErrorCode.ValidationError) {
        return this.queryPages('select')
      }
      throw error
    }
  }

  async getMarkdown(pageId: string): Promise<string> {
    const blocks = await this.converter.pageToMarkdown(pageId)
    return this.converter.toMarkdownString(blocks).parent.trim()
  }

  private async queryPages(filterType: 'status' | 'select'): Promise<NotionPage[]> {
    const pages: NotionPage[] = []
    let startCursor: string | undefined

    do {
      const filter = filterType === 'status'
        ? { property: this.propertyNames.status, status: { equals: this.publishedValue } } as const
        : { property: this.propertyNames.status, select: { equals: this.publishedValue } } as const
      const response = await this.client.dataSources.query({
        data_source_id: this.options.dataSourceId,
        filter,
        page_size: 100,
        start_cursor: startCursor,
      })

      for (const result of response.results) {
        if (isFullPage(result))
          pages.push(result)
      }

      startCursor = response.has_more && response.next_cursor ? response.next_cursor : undefined
    } while (startCursor)

    return pages
  }
}

export function mergeConfig(options: SyncOptions['config'] = {}): SyncConfig {
  return {
    propertyNames: {
      ...DEFAULT_CONFIG.propertyNames,
      ...options.propertyNames,
    },
    publishedValue: options.publishedValue ?? DEFAULT_CONFIG.publishedValue,
  }
}

export function propertyText(property: NotionProperty | undefined): string {
  if (!property)
    return ''
  const type = typeof property.type === 'string' ? property.type : ''
  const value = property[type]

  if (type === 'title' || type === 'rich_text')
    return richText(value)
  if (type === 'select' || type === 'status')
    return textFromRecord(value, 'name')
  if (type === 'date')
    return textFromRecord(value, 'start')
  if (type === 'url')
    return typeof value === 'string' ? value : ''
  if (type === 'number')
    return typeof value === 'number' ? String(value) : ''
  if (type === 'checkbox')
    return value === true ? 'true' : value === false ? 'false' : ''
  if (typeof value === 'string')
    return value
  return ''
}

export function propertyTexts(property: NotionProperty | undefined): string[] {
  if (!property)
    return []
  const type = typeof property.type === 'string' ? property.type : ''
  const value = property[type]
  if (type === 'multi_select' && Array.isArray(value)) {
    return value.flatMap((item) => {
      const name = textFromRecord(item, 'name')
      return name ? [name] : []
    })
  }
  const text = propertyText(property)
  return text ? [text] : []
}

export function isPublished(page: NotionPage, config: SyncConfig): boolean {
  return propertyText(page.properties[config.propertyNames.status]) === config.publishedValue
}

export function slugify(input: string, fallback = 'post'): string {
  const slug = input
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  return slug || fallback
}

export function estimateReadingMinutes(markdown: string): number {
  const cjkCharacters = markdown.match(/[\u3040-\u30FF\u3400-\u9FFF]/g)?.length ?? 0
  const words = markdown
    .replace(/[\u3040-\u30FF\u3400-\u9FFF]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length
  return Math.max(1, Math.ceil(cjkCharacters / 500 + words / 200))
}

export function mapPageMetadata(page: NotionPage, config: SyncConfig): Omit<Post, 'markdown' | 'readingMinutes'> {
  const title = propertyText(page.properties[config.propertyNames.title]).trim()
  if (!title)
    throw new Error(`Notion page ${page.id} has no title`)

  const slug = slugify(propertyText(page.properties[config.propertyNames.slug]), slugify(title, `post-${page.id.slice(0, 8)}`))
  const publishedAt = propertyText(page.properties[config.propertyNames.published]) || page.created_time || ''
  const updatedAt = page.last_edited_time || publishedAt

  return {
    id: page.id,
    slug,
    title,
    description: propertyText(page.properties[config.propertyNames.description]).trim(),
    publishedAt,
    updatedAt,
    tags: propertyTexts(page.properties[config.propertyNames.tags]),
  }
}

export async function rewriteMarkdownImages(
  markdown: string,
  mediaDir: string,
  slug: string,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  const pattern = /!\[[^\]]*\]\(\s*(<[^>]+>|[^)\s]+)\s*\)/g
  const seen = new Map<string, string>()
  const replacements: Array<{ start: number, end: number, value: string }> = []

  for (const match of markdown.matchAll(pattern)) {
    const destination = match[1]
    const url = destination.startsWith('<') ? destination.slice(1, -1) : destination
    if (!isNotionImageUrl(url))
      continue

    const localUrl = seen.get(url) ?? await downloadMedia(url, mediaDir, slug, fetcher)
    seen.set(url, localUrl)
    const replacementDestination = destination.startsWith('<') ? `<${localUrl}>` : localUrl
    const destinationStart = match[0].indexOf(destination, match[0].indexOf('](') + 2)
    const replacement = `${match[0].slice(0, destinationStart)}${replacementDestination}${match[0].slice(destinationStart + destination.length)}`
    replacements.push({ start: match.index ?? 0, end: (match.index ?? 0) + match[0].length, value: replacement })
  }

  let output = markdown
  for (const replacement of replacements.reverse()) {
    output = `${output.slice(0, replacement.start)}${replacement.value}${output.slice(replacement.end)}`
  }
  return output
}

async function downloadMedia(url: string, mediaDir: string, slug: string, fetcher: typeof fetch): Promise<string> {
  const response = await fetcher(url, { signal: AbortSignal.timeout(30_000) })
  if (!response.ok)
    throw new Error(`Media request failed (${response.status}): ${url}`)

  const contentType = response.headers.get('content-type')?.split(';', 1)[0]?.trim()
  const extension = mediaExtension(url, contentType)
  const fileName = `${createHash('sha256').update(url).digest('hex').slice(0, 16)}${extension}`
  const directory = join(mediaDir, slug)
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, fileName), new Uint8Array(await response.arrayBuffer()))
  return `/content/media/${slug}/${fileName}`
}

export async function syncSnapshot(source: SyncSource, options: SyncOptions = {}): Promise<PostsPayload> {
  const config = mergeConfig(options.config)
  const outputDir = resolve(options.outputDir ?? DEFAULT_OUTPUT_DIR)
  await mkdir(dirname(outputDir), { recursive: true })
  const tempDir = await mkdtemp(join(dirname(outputDir), '.content-snapshot-'))

  try {
    await chmod(tempDir, 0o755)
    await mkdir(join(tempDir, 'media'), { recursive: true })
    const pages = (await source.listPages()).filter(page => isPublished(page, config))
    const slugs = new Set<string>()
    const posts: Post[] = []

    for (const page of pages) {
      const metadata = mapPageMetadata(page, config)
      if (slugs.has(metadata.slug))
        throw new Error(`Duplicate post slug: ${metadata.slug}`)
      slugs.add(metadata.slug)

      const markdown = await source.getMarkdown(page.id)
      const rewrittenMarkdown = await rewriteMarkdownImages(markdown, join(tempDir, 'media'), metadata.slug)
      posts.push({
        ...metadata,
        readingMinutes: estimateReadingMinutes(rewrittenMarkdown),
        markdown: rewrittenMarkdown,
      })
    }

    const snapshot: PostsPayload = {
      generatedAt: (options.now ?? (() => new Date()))().toISOString(),
      posts,
    }
    await writeFile(join(tempDir, 'posts.json'), `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
    await replaceDirectory(tempDir, outputDir)
    return snapshot
  }
  catch (error) {
    await rm(tempDir, { recursive: true, force: true })
    throw error
  }
}

export class FixtureSource implements SyncSource {
  constructor(private readonly fixture: FixtureFile) {}

  async listPages(): Promise<NotionPage[]> {
    return this.fixture.pages
  }

  async getMarkdown(pageId: string): Promise<string> {
    const markdown = this.fixture.markdown[pageId]
    if (typeof markdown !== 'string')
      throw new Error(`Fixture has no markdown for page ${pageId}`)
    return markdown
  }
}

interface FixtureFile {
  pages: NotionPage[]
  markdown: Record<string, string>
}

async function loadFixture(filePath: string): Promise<FixtureFile> {
  const value = JSON.parse(await readFile(filePath, 'utf8')) as Partial<FixtureFile>
  if (!Array.isArray(value.pages) || !value.pages.every(isNotionPage) || !value.markdown || typeof value.markdown !== 'object') {
    throw new Error(`Invalid fixture: ${filePath}`)
  }
  return { pages: value.pages, markdown: value.markdown as Record<string, string> }
}

async function replaceDirectory(sourceDir: string, targetDir: string): Promise<void> {
  const backupDir = `${targetDir}.backup-${randomUUID()}`
  let movedOldDirectory = false

  try {
    try {
      await rename(targetDir, backupDir)
      movedOldDirectory = true
    }
    catch (error) {
      if (!isMissingPath(error))
        throw error
    }

    await rename(sourceDir, targetDir)
    if (movedOldDirectory)
      await rm(backupDir, { recursive: true, force: true })
  }
  catch (error) {
    if (movedOldDirectory) {
      await rm(targetDir, { recursive: true, force: true })
      await rename(backupDir, targetDir)
    }
    throw error
  }
}

function richText(value: unknown): string {
  if (!Array.isArray(value))
    return ''
  return value.map(item => textFromRecord(item, 'plain_text') || textFromRecord(textFromRecordValue(item, 'text'), 'content')).join('')
}

function textFromRecord(value: unknown, key: string): string {
  return typeof textFromRecordValue(value, key) === 'string' ? String(textFromRecordValue(value, key)) : ''
}

function textFromRecordValue(value: unknown, key: string): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return undefined
  return (value as Record<string, unknown>)[key]
}

function isNotionPage(value: unknown): value is NotionPage {
  return Boolean(value && typeof value === 'object' && typeof (value as Record<string, unknown>).id === 'string' && isRecord((value as Record<string, unknown>).properties))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function isMissingPath(error: unknown): boolean {
  return isRecord(error) && error.code === 'ENOENT'
}

function isNotionImageUrl(value: string): boolean {
  try {
    const { hostname, pathname } = new URL(value)
    return (
      hostname === 'file.notion.so'
      || hostname === 'files.notion.so'
      || hostname.endsWith('.notion-static.com')
      || (hostname === 's3.us-west-2.amazonaws.com' && pathname.startsWith('/secure.notion-static.com/'))
      || (hostname.startsWith('prod-files-secure.') && hostname.endsWith('.amazonaws.com'))
    )
  }
  catch {
    return false
  }
}

function mediaExtension(url: string, contentType: string | undefined): string {
  const fromContentType: Record<string, string> = {
    'image/avif': '.avif',
    'image/gif': '.gif',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/svg+xml': '.svg',
    'image/webp': '.webp',
  }
  if (contentType && fromContentType[contentType])
    return fromContentType[contentType]

  try {
    const extension = extname(new URL(url).pathname).toLowerCase()
    return /^\.[a-z0-9]{1,5}$/.test(extension) ? extension : '.bin'
  }
  catch {
    return '.bin'
  }
}

export function envPropertyNames(env: NodeJS.ProcessEnv): Partial<PropertyNames> {
  const configured: Record<keyof PropertyNames, string | undefined> = {
    title: env.NOTION_TITLE_PROPERTY,
    slug: env.NOTION_SLUG_PROPERTY,
    description: env.NOTION_DESCRIPTION_PROPERTY,
    published: env.NOTION_PUBLISHED_PROPERTY,
    tags: env.NOTION_TAGS_PROPERTY,
    status: env.NOTION_STATUS_PROPERTY,
  }
  const names: Partial<PropertyNames> = {}
  for (const [key, value] of Object.entries(configured) as Array<[keyof PropertyNames, string | undefined]>) {
    if (value)
      names[key] = value
  }
  return names
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const fixtureIndex = args.indexOf('--fixture')
  const outputIndex = args.indexOf('--output')
  const fixturePath = fixtureIndex >= 0 ? args[fixtureIndex + 1] : undefined
  const outputArgument = outputIndex >= 0 ? args[outputIndex + 1] : undefined

  if (fixturePath) {
    const fixture = await loadFixture(resolve(fixturePath))
    const snapshot = await syncSnapshot(new FixtureSource(fixture), { outputDir: outputArgument })
    process.stdout.write(`Synced ${snapshot.posts.length} fixture posts to ${resolve(outputArgument ?? DEFAULT_OUTPUT_DIR)}\n`)
    return
  }

  const envFile = process.env.NOTION_SYNC_ENV_FILE ?? DEFAULT_ENV_FILE
  if (existsSync(envFile))
    process.loadEnvFile(envFile)

  const outputDir = outputArgument ?? process.env.NOTION_SYNC_OUTPUT_DIR
  const token = process.env.NOTION_TOKEN
  const dataSourceId = process.env.NOTION_DATA_SOURCE_ID
  if (!token)
    throw new Error('NOTION_TOKEN is required')
  if (!dataSourceId)
    throw new Error('NOTION_DATA_SOURCE_ID is required')

  const snapshot = await syncSnapshot(new NotionClient({
    token,
    dataSourceId,
    propertyNames: envPropertyNames(process.env),
    publishedValue: process.env.NOTION_PUBLISHED_VALUE,
  }), {
    outputDir,
    config: {
      propertyNames: envPropertyNames(process.env),
      publishedValue: process.env.NOTION_PUBLISHED_VALUE,
    },
  })
  process.stdout.write(`Synced ${snapshot.posts.length} Notion posts to ${resolve(outputDir ?? DEFAULT_OUTPUT_DIR)}\n`)
}

const entryPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : ''
if (import.meta.url === entryPath) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
