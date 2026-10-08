/* eslint-disable test/no-import-node-test */
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { renderMarkdown, renderMarkdownWithShiki } from '../src/lib/markdown.ts'

test('renders standard lists and GFM tables without Notion repairs', () => {
  const source = [
    '**内网需求**',
    '',
    '- 直连',
    '- 内网代理',
    '',
    '**外网需求**',
    '',
    '- **内网环境：**在 Clash 中直连',
    '',
    '| 类型 | 网段 |',
    '| --- | --- |',
    '| **A 类** | `10.0.0.0/8` |',
  ].join('\n')

  const markup = renderMarkdown(source)

  assert.match(markup, /<p><strong>内网需求<\/strong><\/p>\n<ul>/)
  assert.match(markup, /<\/ul>\n<p><strong>外网需求<\/strong><\/p>\n<ul>/)
  assert.match(markup, /<li><strong>内网环境：<\/strong>在 Clash 中直连<\/li>/)
  assert.match(markup, /<td><strong>A 类<\/strong><\/td>/)
  assert.match(markup, /<td><code>10\.0\.0\.0\/8<\/code><\/td>/)
})

test('renders task lists, math, and Mermaid placeholders', () => {
  const source = [
    '- [x] 已完成',
    '- [ ] 待处理',
    '',
    '$2^{12}=4096$',
    '',
    '```mermaid',
    'graph LR',
    'A --> B',
    '```',
  ].join('\n')

  const markup = renderMarkdown(source)

  assert.match(markup, /class="task-list-container"/)
  assert.match(markup, /class="task-list-item-checkbox"[^>]+checked="checked"[^>]+disabled="disabled"/)
  assert.match(markup, /class="katex"/)
  assert.match(markup, /<div class="mermaid">graph LR\nA --&gt; B\n<\/div>/)
})

test('keeps code literals intact', () => {
  const markup = renderMarkdown('```javascript\nconsole.log("**literal**")\n```')

  assert.match(markup, /<code class="language-javascript">console\.log\(&quot;\*\*literal\*\*&quot;\)\n<\/code>/)
  assert.doesNotMatch(markup, /<strong>literal<\/strong>/)
})

test('highlights fenced code with both themes and loads additional languages on later renders', async () => {
  const shell = await renderMarkdownWithShiki('~~~shell\ncurl --version\n~~~')
  assert.match(shell, /class="shiki shiki-themes/)
  assert.match(shell, /<span style="color:#[A-Fa-f0-9]{6};/)
  assert.match(shell, /--shiki-dark:#[A-Fa-f0-9]{6}/)

  const source = '```ts\nconst count: number = 42\n```\n\n```json\n{"enabled": true}\n```\n\n```unknown\n<script>literal</script>\n```'
  const markup = await renderMarkdownWithShiki(source)
  assert.equal(markup.match(/class="shiki shiki-themes/g)?.length, 2)
  assert.match(markup, /<code class="language-unknown">&lt;script&gt;literal&lt;\/script&gt;/)

  const plain = await renderMarkdownWithShiki('```plain text\nhello\n```\n\n```mermaid\ngraph LR\nA --> B\n```')
  assert.doesNotMatch(plain, /class="shiki/)
  assert.match(plain, /<div class="mermaid">/)
})

test('renders the proxy article with separate sections and native tables', () => {
  const payload = JSON.parse(readFileSync(new URL('../../../packages/content/data/posts.json', import.meta.url), 'utf8')) as {
    posts: Array<{ markdown: string, slug: string }>
  }
  const article = payload.posts.find(post => post.slug === 'multi-proxy-dev-environment')
  assert.ok(article)

  const markup = renderMarkdown(article.markdown)

  assert.match(markup, /<p><strong>内网的需求<\/strong>:<\/p>\n<ul>/)
  assert.match(markup, /<\/ul>\n<p><strong>外网需求\(clash客户端\+代理配置\)<\/strong>:<\/p>\n<ul>/)
  assert.equal(markup.match(/<table>/g)?.length, 2)
  assert.equal(markup.match(/<div class="mermaid">/g)?.length, 3)
})
