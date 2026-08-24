import type { Post } from '@jt-blog/content'
import { For } from 'solid-js'
import { MarkdownDocument } from '../components/MarkdownDocument'
import { formatDate } from '../lib/content'

export function PostDetail(props: { post: Post }) {
  return (
    <article class="site-container page-stack article-page">
      <a class="back-link focus-ring" href="/posts">← All posts</a>
      <header class="article-header">
        <h1>{props.post.title}</h1>
        <p class="article-description">{props.post.description}</p>
        <p class="post-meta">
          {formatDate(props.post.publishedAt)}
          {' '}
          ·
          {' '}
          {props.post.readingMinutes}
          {' '}
          min read
        </p>
        <div class="tag-list" aria-label="Post tags">
          <For each={props.post.tags}>{tag => <span class="tag">{tag}</span>}</For>
        </div>
      </header>
      <MarkdownDocument source={props.post.markdown} />
    </article>
  )
}
