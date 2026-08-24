import { spawnSync } from 'node:child_process'
import { chmod, mkdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { DEFAULT_ENV_FILE } from './sync-notion.ts'

const BEGIN_MARKER = '# BEGIN JT_BLOG_NOTION_SYNC'
const END_MARKER = '# END JT_BLOG_NOTION_SYNC'
const REPOSITORY_ROOT = fileURLToPath(new URL('../../../', import.meta.url))

export function missingRequiredEnvironment(contents: string) {
  return ['NOTION_TOKEN', 'NOTION_DATA_SOURCE_ID'].filter((name) => {
    const match = contents.match(new RegExp(`^\\s*(?:export\\s+)?${name}\\s*=\\s*(.*?)\\s*$`, 'm'))
    const value = match?.[1]?.trim()
    return !value || value === `''` || value === '""'
  })
}

export function buildCronBlock(options: {
  repositoryRoot: string
  environmentFile: string
  pnpmExecutable: string
}) {
  const command = [
    `cd ${shellQuote(options.repositoryRoot)}`,
    `NOTION_SYNC_ENV_FILE=${shellQuote(options.environmentFile)} ${shellQuote(options.pnpmExecutable)} content:sync`,
  ].join(' && ')

  return [
    BEGIN_MARKER,
    'CRON_TZ=Asia/Shanghai',
    `0 10 * * * ${command} >> ${shellQuote(resolve(options.repositoryRoot, 'logs/notion-sync.log'))} 2>&1`,
    END_MARKER,
  ].join('\n')
}

export function upsertCronBlock(current: string, block: string) {
  const managedBlock = new RegExp(`(?:^|\\n)${escapeRegExp(BEGIN_MARKER)}[\\s\\S]*?${escapeRegExp(END_MARKER)}(?:\\n|$)`, 'g')
  const preserved = current.replace(managedBlock, '\n').trim()
  return `${preserved ? `${preserved}\n\n` : ''}${block}\n`
}

async function main() {
  if (process.platform === 'win32')
    throw new Error('crontab installation is only supported on Unix-like systems')

  const environmentFile = resolve(process.env.NOTION_SYNC_ENV_FILE ?? DEFAULT_ENV_FILE)
  const environment = await readFile(environmentFile, 'utf8').catch(() => {
    throw new Error(`Notion environment file not found: ${environmentFile}`)
  })
  const missing = missingRequiredEnvironment(environment)
  if (missing.length > 0)
    throw new Error(`Missing values in ${environmentFile}: ${missing.join(', ')}`)

  await chmod(environmentFile, 0o600)
  await mkdir(resolve(REPOSITORY_ROOT, 'logs'), { recursive: true })

  const pnpmExecutable = findPnpmExecutable()
  const block = buildCronBlock({
    repositoryRoot: REPOSITORY_ROOT,
    environmentFile,
    pnpmExecutable,
  })
  const current = readCrontab()
  const result = spawnSync('crontab', ['-'], {
    encoding: 'utf8',
    input: upsertCronBlock(current, block),
  })
  if (result.error)
    throw result.error
  if (result.status !== 0)
    throw new Error(result.stderr.trim() || 'Unable to install crontab')

  process.stdout.write(`Installed daily Notion sync at 10:00 Asia/Shanghai.\nEnvironment: ${environmentFile}\n`)
}

function findPnpmExecutable() {
  const result = spawnSync('/bin/sh', ['-lc', 'command -v pnpm'], { encoding: 'utf8' })
  const executable = result.stdout.trim()
  if (result.status !== 0 || !executable)
    throw new Error('pnpm executable not found in PATH')
  return executable
}

function readCrontab() {
  const result = spawnSync('crontab', ['-l'], { encoding: 'utf8' })
  if (result.error)
    throw result.error
  if (result.status === 0)
    return result.stdout
  if (/no crontab/i.test(result.stderr))
    return ''
  throw new Error(result.stderr.trim() || 'Unable to read crontab')
}

function shellQuote(value: string) {
  return `'${value.replaceAll(`'`, `'"'"'`)}'`
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const entryPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : ''
if (import.meta.url === entryPath) {
  void main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
