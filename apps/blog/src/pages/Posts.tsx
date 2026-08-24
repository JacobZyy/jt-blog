import type { Post } from '@jt-blog/content'
import { Show } from 'solid-js'
import { PostList } from '../components/PostList'

export function Posts(props: { posts: Post[], loading: boolean, error: string }) {
  return (
    <div class="site-container page-stack page-stack-compact">
      <section class="page-intro">
        <p class="eyebrow">Writing</p>
        <h1>All posts</h1>
        <p>Notes on frontend systems, design tokens, and the edges between tools.</p>
      </section>
      <section class="content-section" aria-labelledby="all-posts-heading">
        <h2 id="all-posts-heading" class="sr-only">All published posts</h2>
        <Show when={!props.error} fallback={<p class="empty-state">Posts will appear after the next Notion sync.</p>}>
          <PostList posts={props.posts} loading={props.loading} />
        </Show>
      </section>
    </div>
  )
}
