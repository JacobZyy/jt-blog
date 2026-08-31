import type { HighlighterCore } from 'shiki/core'
import MarkdownIt from 'markdown-it'

const languageAliases: Record<string, string> = {
  bash: 'bash',
  css: 'css',
  html: 'html',
  javascript: 'javascript',
  js: 'javascript',
  json: 'json',
  jsx: 'tsx',
  markdown: 'markdown',
  md: 'markdown',
  python: 'python',
  rust: 'rust',
  shell: 'bash',
  ts: 'typescript',
  tsx: 'tsx',
  typescript: 'typescript',
  yaml: 'yaml',
  yml: 'yaml',
}

let highlighterPromise: Promise<HighlighterCore> | undefined

function getHighlighter() {
  return highlighterPromise ??= import('./shiki').then(module => module.createBlogHighlighter())
}

function normalizeLanguage(language: string) {
  return languageAliases[language.toLowerCase()]
}

function normalizeNotionMarkdown(source: string) {
  const lines = source.split('\n')
  const normalized: string[] = []

  for (let index = 0; index < lines.length; index++) {
    const opening = lines[index].match(/^(\t+)(`{3,}|~{3,})/)
    if (!opening) {
      normalized.push(lines[index])
      continue
    }

    const [, indent, marker] = opening
    let closingIndex = index + 1
    while (closingIndex < lines.length && !isClosingFence(lines[closingIndex], indent, marker))
      closingIndex++

    if (closingIndex === lines.length) {
      normalized.push(...lines.slice(index))
      break
    }

    normalized.push(lines[index])
    const body = lines.slice(index + 1, closingIndex)
    const needsIndent = body.some(line => line.length > 0 && !line.startsWith(indent))
    for (const line of body)
      normalized.push(needsIndent && !line.startsWith(indent) ? `${indent}${line}` : line)
    normalized.push(lines[closingIndex])
    index = closingIndex
  }

  return normalized.join('\n').replace(/<\/table>[\t ]*\n(?=\S)/gi, '</table>\n\n')
}

function isClosingFence(line: string, indent: string, marker: string) {
  if (!line.startsWith(indent))
    return false
  const candidate = line.slice(indent.length).trimEnd()
  return candidate.length >= marker.length && [...candidate].every(character => character === marker[0])
}

function renderNotionTableCells(markup: string, markdown: ReturnType<typeof createMarkdown>) {
  return markup.replace(/(<table[^>]*(?:fit-page-width|header-row|header-column)="[^"]*"[^>]*>)([\s\S]*?)(<\/table>)/gi, (_, opening, table, closing) => {
    const renderedTable = table.replace(/(<t[dh](?:\s[^>]*)?>)([\s\S]*?)(<\/t[dh]>)/gi, (_: string, cellOpening: string, content: string, cellClosing: string) => (
      `${cellOpening}${markdown.renderInline(content.trim())}${cellClosing}`
    ))
    return `${opening}${renderedTable}${closing}`
  })
}

function decorateNotionTags(markup: string) {
  return markup
    .replace(/<callout(?:\s[^>]*)?>/gi, '<aside class="notion-callout" role="note">')
    .replace(/<\/callout>/gi, '</aside>')
    .replace(/<columns(?:\s[^>]*)?>/gi, '<div class="notion-columns">')
    .replace(/<\/columns>/gi, '</div>')
    .replace(/<column(?:\s[^>]*)?>/gi, '<section class="notion-column">')
    .replace(/<\/column>/gi, '</section>')
    .replace(/<page(?:\s[^>]*)?>/gi, '<span class="notion-page">')
    .replace(/<\/page>/gi, '</span>')
    .replace(/<file(?:\s[^>]*)?>/gi, '<span class="notion-file">')
    .replace(/<\/file>/gi, '</span>')
    .replace(/<mention-user(?:\s[^>]*)?>/gi, '<span class="notion-mention-user">')
    .replace(/<\/mention-user>/gi, '</span>')
    .replace(/<synced_block(?:\s[^>]*)?>/gi, '<div class="notion-synced-block">')
    .replace(/<\/synced_block>/gi, '</div>')
    .replace(/<\/?([a-z]\w*-[\w-]+)(?:\s[^>]*)?>/gi, tag => `<span class="notion-unknown-tag">${tag.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</span>`)
}

function render(source: string, highlighter?: HighlighterCore) {
  const markdown = createMarkdown(highlighter)
  const markup = markdown.render(normalizeNotionMarkdown(source))
  return decorateNotionTags(renderNotionTableCells(markup, markdown))
}

function createMarkdown(highlighter?: HighlighterCore) {
  return new MarkdownIt({
    breaks: true,
    html: true,
    linkify: true,
    typographer: true,
    highlight: (code, language) => {
      const lang = normalizeLanguage(language)
      if (!highlighter || !lang)
        return ''

      try {
        return highlighter.codeToHtml(code, {
          lang,
          themes: {
            dark: 'catppuccin-mocha',
            light: 'catppuccin-latte',
          },
        })
      }
      catch (error) {
        console.warn('[markdown] Shiki language fallback:', error)
        return ''
      }
    },
  })
}

export function renderMarkdown(source: string) {
  return render(source)
}

export async function renderMarkdownWithShiki(source: string) {
  try {
    const highlighter = await getHighlighter()
    return render(source, highlighter)
  }
  catch (error) {
    console.warn('[markdown] Shiki initialization failed; using plain code blocks:', error)
    return renderMarkdown(source)
  }
}
