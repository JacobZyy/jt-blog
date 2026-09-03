/* eslint-disable solid/no-innerhtml */
import { createEffect, createSignal, For, onCleanup, Show } from 'solid-js'
import { renderMarkdown, renderMarkdownWithShiki } from '../lib/markdown'

interface TableOfContentsItem {
  id: string
  level: number
  title: string
}

let mermaidPromise: Promise<typeof import('mermaid')['default']> | undefined

function renderMermaid(nodes: HTMLElement[]) {
  mermaidPromise ??= import('mermaid').then(({ default: mermaid }) => {
    mermaid.initialize({ securityLevel: 'strict', startOnLoad: false, theme: 'base' })
    return mermaid
  })
  void mermaidPromise
    .then(mermaid => mermaid.run({ nodes, suppressErrors: true }))
    .catch(error => console.warn('[markdown] Mermaid rendering failed:', error))
}

export function MarkdownDocument(props: { source: string }) {
  const [activeHeading, setActiveHeading] = createSignal('')
  const [headings, setHeadings] = createSignal<TableOfContentsItem[]>([])
  const [markup, setMarkup] = createSignal('')
  let headingElements: HTMLHeadingElement[] = []
  let root!: HTMLDivElement
  let scrollFrame = 0
  let tableOfContents!: HTMLElement
  let renderRequest = 0

  const updateActiveHeading = () => {
    const currentHeading = headingElements.findLast(heading => heading.getBoundingClientRect().top <= 96) ?? headingElements[0]
    if (currentHeading)
      setActiveHeading(currentHeading.id)
  }
  const handleScroll = () => {
    if (scrollFrame)
      return
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0
      updateActiveHeading()
    })
  }

  window.addEventListener('scroll', handleScroll, { passive: true })

  createEffect(() => props.source, (source) => {
    const request = ++renderRequest
    setMarkup(renderMarkdown(source))
    void renderMarkdownWithShiki(source).then((value) => {
      if (request === renderRequest)
        setMarkup(value)
    })
  })

  createEffect(() => markup(), () => {
    headingElements = [...root.querySelectorAll<HTMLHeadingElement>('h1, h2, h3')]
    const nextHeadings = headingElements.flatMap((heading, index) => {
      const title = heading.textContent?.trim()
      if (!title)
        return []

      const id = `section-${index + 1}`
      heading.id = id
      return [{ id, level: Number(heading.tagName.slice(1)), title }]
    })
    setHeadings(nextHeadings)
    setActiveHeading(current => nextHeadings.some(heading => heading.id === current) ? current : nextHeadings[0]?.id ?? '')
    cancelAnimationFrame(scrollFrame)
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0
      updateActiveHeading()
    })

    const nodes = [...root.querySelectorAll<HTMLElement>('.mermaid:not([data-processed])')]
    if (nodes.length > 0)
      renderMermaid(nodes)
  })

  createEffect(() => activeHeading(), (id) => {
    tableOfContents?.querySelector(`a[href="#${id}"]`)?.scrollIntoView({ block: 'nearest' })
  })

  onCleanup(() => {
    cancelAnimationFrame(scrollFrame)
    window.removeEventListener('scroll', handleScroll)
  })

  return (
    <div class="article-document">
      <Show when={headings().length > 0}>
        <aside ref={tableOfContents} class="article-toc">
          <nav aria-label="文章目录">
            <p class="article-toc-title">On this page</p>
            <ul>
              <For each={headings()}>
                {heading => (
                  <li data-level={heading.level}>
                    <a
                      class={activeHeading() === heading.id ? 'article-toc-link is-active' : 'article-toc-link'}
                      href={`#${heading.id}`}
                      aria-current={activeHeading() === heading.id ? 'location' : undefined}
                      title={heading.title}
                      onClick={() => { setActiveHeading(heading.id) }}
                    >
                      {heading.title}
                    </a>
                  </li>
                )}
              </For>
            </ul>
          </nav>
        </aside>
      </Show>
      <div ref={root} class="markdown-body prose prose-jt" innerHTML={markup()} />
    </div>
  )
}
