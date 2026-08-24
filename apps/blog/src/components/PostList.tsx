import type { Post } from '@jt-blog/content'
import { For, Show } from 'solid-js'
import { formatPostMeta } from '../lib/content'

export function PostList(props: { posts: Post[], loading?: boolean, emptyLabel?: string }) {
  return (
    <Show when={props.posts.length > 0} fallback={<p class="empty-state">{props.loading ? 'Loading posts…' : props.emptyLabel ?? 'No published posts yet.'}</p>}>
      <div class="post-list">
        <For each={props.posts}>
          {post => (
            <article class="post-row">
              <a class="post-row-link focus-ring" href={`/posts/${encodeURIComponent(post.slug)}`}>
                <div class="post-row-content">
                  <h3>{post.title}</h3>
                  <p class="post-meta">{formatPostMeta(post)}</p>
                  <p class="post-description">{post.description}</p>
                </div>
                <span class="row-arrow" aria-hidden="true">↗</span>
              </a>
            </article>
          )}
        </For>
      </div>
    </Show>
  )
}
