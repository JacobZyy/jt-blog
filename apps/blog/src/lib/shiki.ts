import type { HighlighterCore, LanguageRegistration } from 'shiki/core'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import catppuccinLatte from 'shiki/themes/catppuccin-latte.mjs'
import catppuccinMocha from 'shiki/themes/catppuccin-mocha.mjs'

const languageLoaders: Record<string, () => Promise<{ default: LanguageRegistration[] }>> = {
  bash: () => import('shiki/langs/bash.mjs'),
  css: () => import('shiki/langs/css.mjs'),
  html: () => import('shiki/langs/html.mjs'),
  javascript: () => import('shiki/langs/javascript.mjs'),
  json: () => import('shiki/langs/json.mjs'),
  markdown: () => import('shiki/langs/markdown.mjs'),
  python: () => import('shiki/langs/python.mjs'),
  rust: () => import('shiki/langs/rust.mjs'),
  tsx: () => import('shiki/langs/tsx.mjs'),
  typescript: () => import('shiki/langs/typescript.mjs'),
  yaml: () => import('shiki/langs/yaml.mjs'),
}

export function createBlogHighlighter() {
  return createHighlighterCore({
    themes: [catppuccinLatte, catppuccinMocha],
    langs: [],
    engine: createJavaScriptRegexEngine(),
  })
}

export async function loadBlogLanguages(highlighter: HighlighterCore, languages: string[]) {
  await Promise.all([...new Set(languages)]
    .filter(language => !highlighter.getLoadedLanguages().includes(language))
    .map(language => highlighter.loadLanguage(languageLoaders[language]())))
}
