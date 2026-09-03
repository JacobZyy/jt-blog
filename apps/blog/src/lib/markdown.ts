import type { HighlighterCore } from 'shiki/core'
import { katex } from '@mdit/plugin-katex'
import { tasklist } from '@mdit/plugin-tasklist'
import MarkdownIt from 'markdown-it'
import markdownItCjkFriendly from 'markdown-it-cjk-friendly'

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

function render(source: string, highlighter?: HighlighterCore) {
  return createMarkdown(highlighter).render(source)
}

function createMarkdown(highlighter?: HighlighterCore) {
  const markdown = new MarkdownIt({
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

  markdown.use(markdownItCjkFriendly)
  markdown.use(tasklist)
  markdown.use(katex)

  const renderFence = markdown.renderer.rules.fence
  markdown.renderer.rules.fence = (tokens, index, options, env, self) => {
    const language = tokens[index].info.trim().split(/\s+/, 1)[0].toLowerCase()
    if (language === 'mermaid')
      return `<div class="mermaid">${markdown.utils.escapeHtml(tokens[index].content)}</div>\n`
    return renderFence?.(tokens, index, options, env, self) ?? self.renderToken(tokens, index, options)
  }

  return markdown
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
