/* eslint-disable test/no-import-node-test */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { renderMarkdown } from '../src/lib/markdown.ts'

test('renders Notion-indented fences and table cells', () => {
  const source = [
    '- 配置：',
    '\t```json',
    '{"enabled":true}',
    '\t```',
    '\t代码后文字',
    '',
    '<table header-row="true">',
    '<tr>',
    '<td>**A 类**</td>',
    '<td>`10.0.0.0/8`</td>',
    '</tr>',
    '</table>',
    '#### 表格后标题',
  ].join('\n')

  const markup = renderMarkdown(source)

  assert.match(markup, /<pre><code class="language-json">\{&quot;enabled&quot;:true\}\n<\/code><\/pre>/)
  assert.match(markup, /代码后文字[\s\S]*<\/li>/)
  assert.match(markup, /<td><strong>A 类<\/strong><\/td>/)
  assert.match(markup, /<td><code>10\.0\.0\.0\/8<\/code><\/td>/)
  assert.match(markup, /<h4>表格后标题<\/h4>/)
})

test('preserves valid nested fences and Markdown table literals', () => {
  const source = [
    '- 配置：',
    '\t```javascript',
    '\tconsole.log(1)',
    '\t```',
    '',
    '| Value |',
    '| --- |',
    '| \\*literal\\* |',
    '| `**literal**` |',
  ].join('\n')

  const markup = renderMarkdown(source)

  assert.match(markup, /<code class="language-javascript">console\.log\(1\)\n<\/code>/)
  assert.match(markup, /<td>\*literal\*<\/td>/)
  assert.match(markup, /<td><code>\*\*literal\*\*<\/code><\/td>/)
  assert.doesNotMatch(markup, /<code><strong>literal<\/strong><\/code>/)
})

test('leaves unclosed Notion fences unchanged', () => {
  const markup = renderMarkdown('- 配置：\n\t```json\n{"enabled":true}')

  assert.match(markup, /<p>\{[“"]enabled[”"]:true\}<\/p>/)
})
