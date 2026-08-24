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
  return decorateNotionTags(createMarkdown().render(source))
}

export async function renderMarkdownWithShiki(source: string) {
  try {
    const highlighter = await getHighlighter()
    return decorateNotionTags(createMarkdown(highlighter).render(source))
  }
  catch (error) {
    console.warn('[markdown] Shiki initialization failed; using plain code blocks:', error)
    return renderMarkdown(source)
  }
}
