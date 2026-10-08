import type { Post } from '@jt-blog/content'
import { Show } from 'solid-js'
import { formatMonthDate } from '../lib/months'

export function PostCard(props: { post: Post, variant?: 'featured' | 'compact' | 'standard' }) {
  const featured = () => props.variant === 'featured'

  return (
    <article class={`post-card post-card-${props.variant ?? 'standard'}`}>
      <a class="post-card-link focus-ring" href={`/posts/${encodeURIComponent(props.post.slug)}`}>
        <div class="post-card-copy">
          <p class="post-card-label">{featured() ? '本月选读' : '文章'}</p>
          <h3>{props.post.title}</h3>
          <Show when={props.variant !== 'compact' && props.post.description}>
            <p class="post-card-description">{props.post.description}</p>
          </Show>
        </div>
        <div class="post-card-footer">
          <p>
            {formatMonthDate(props.post.publishedAt)}
            {' '}
            ·
            {' '}
            {props.post.readingMinutes}
            {' '}
            分钟
          </p>
          <span aria-hidden="true">{featured() ? '阅读全文 ↗' : '↗'}</span>
        </div>
      </a>
    </article>
  )
}
