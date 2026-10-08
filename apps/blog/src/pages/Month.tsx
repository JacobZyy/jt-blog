import type { Post } from '@jt-blog/content'
import { For, Show } from 'solid-js'
import { PostCard } from '../components/PostCard'
import { formatMonthEnglishLabel, formatMonthLabel, groupPostsByMonth } from '../lib/months'

export function Month(props: { monthKey: string, posts: Post[] }) {
  const allArchives = () => groupPostsByMonth(props.posts)
  const currentIndex = () => allArchives().findIndex(month => month.key === props.monthKey)
  const archive = () => allArchives()[currentIndex()]
  const older = () => allArchives()[currentIndex() + 1]
  const newer = () => currentIndex() > 0 ? allArchives()[currentIndex() - 1] : undefined

  return (
    <Show
      when={archive()}
      fallback={(
        <section class="content-state site-container">
          <p class="eyebrow">404</p>
          <h1>这个月份还没有博文。</h1>
          <p>返回每月博文，看看已经整理好的内容。</p>
          <a class="button button-primary" href="/posts">浏览每月博文</a>
        </section>
      )}
    >
      {month => (
        <div class="site-container page-stack page-stack-compact month-detail-page">
          <nav class="month-breadcrumb" aria-label="当前位置">
            <a class="focus-ring" href="/posts">每月博文</a>
            <span aria-hidden="true"> / </span>
            <span>{props.monthKey}</span>
          </nav>
          <header class="month-detail-header">
            <div>
              <p class="eyebrow">{formatMonthEnglishLabel(props.monthKey)}</p>
              <h1>{formatMonthLabel(month())}</h1>
              <p>本月的实践，留成一份可回看的目录。</p>
            </div>
            <div class="month-detail-stat">
              <strong>
                {month().posts.length}
                篇
              </strong>
              <span>
                约
                {month().readingMinutes}
                {' '}
                分钟阅读
              </span>
            </div>
          </header>
          <section class="month-featured-post" aria-labelledby="month-featured-heading">
            <h2 id="month-featured-heading" class="sr-only">本月精选</h2>
            <PostCard post={month().posts[0]} variant="featured" />
          </section>
          <Show when={month().posts.length > 1}>
            <section class="month-post-grid" aria-labelledby="month-posts-heading">
              <h2 id="month-posts-heading" class="sr-only">本月其他文章</h2>
              <For each={month().posts.slice(1)}>
                {post => <PostCard post={post} variant="standard" />}
              </For>
            </section>
          </Show>
          <nav class="month-pagination" aria-label="月份导航">
            <Show when={older()}>
              {item => (
                <a class="text-link focus-ring" href={`/posts/month/${item().key}`}>
                  ← 上一月：
                  {formatMonthLabel(item())}
                </a>
              )}
            </Show>
            <Show when={newer()}>
              {item => (
                <a class="text-link focus-ring" href={`/posts/month/${item().key}`}>
                  下一月：
                  {formatMonthLabel(item())}
                  {' '}
                  →
                </a>
              )}
            </Show>
          </nav>
        </div>
      )}
    </Show>
  )
}
