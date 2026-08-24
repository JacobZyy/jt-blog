/* eslint-disable solid/no-innerhtml */
import { createEffect, createSignal } from 'solid-js'
import { renderMarkdown, renderMarkdownWithShiki } from '../lib/markdown'

export function MarkdownDocument(props: { source: string }) {
  const [markup, setMarkup] = createSignal('')
  let renderRequest = 0

  createEffect(() => props.source, (source) => {
    const request = ++renderRequest
    setMarkup(renderMarkdown(source))
    void renderMarkdownWithShiki(source).then((value) => {
      if (request === renderRequest)
        setMarkup(value)
    })
  })

  return <div class="markdown-body" innerHTML={markup()} />
}
