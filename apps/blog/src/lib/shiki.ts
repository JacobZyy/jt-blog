import { createHighlighterCore } from 'shiki/core'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'
import bash from 'shiki/langs/bash.mjs'
import css from 'shiki/langs/css.mjs'
import html from 'shiki/langs/html.mjs'
import javascript from 'shiki/langs/javascript.mjs'
import json from 'shiki/langs/json.mjs'
import markdown from 'shiki/langs/markdown.mjs'
import python from 'shiki/langs/python.mjs'
import rust from 'shiki/langs/rust.mjs'
import tsx from 'shiki/langs/tsx.mjs'
import typescript from 'shiki/langs/typescript.mjs'
import yaml from 'shiki/langs/yaml.mjs'
import catppuccinLatte from 'shiki/themes/catppuccin-latte.mjs'
import catppuccinMocha from 'shiki/themes/catppuccin-mocha.mjs'

export function createBlogHighlighter() {
  return createHighlighterCore({
    themes: [catppuccinLatte, catppuccinMocha],
    langs: [bash, css, html, javascript, json, markdown, python, rust, tsx, typescript, yaml],
    engine: createOnigurumaEngine(import('shiki/wasm')),
  })
}
