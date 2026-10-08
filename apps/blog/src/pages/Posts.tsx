import type { Post } from '@jt-blog/content'
import { For, Show } from 'solid-js'
import { formatMonthLabel, formatMonthNumber, groupPostsByMonth } from '../lib/months'

export function Posts(props: { posts: Post[], loading: boolean, error: string }) {
  const archives = () => groupPostsByMonth(props.posts)
  const years = () => [...new Set(archives().map(month => month.year))]

  return (
    <div class="site-container page-stack page-stack-compact monthly-archive-page">
      <section class="page-intro monthly-archive-intro">
        <p class="eyebrow">Monthly archive</p>
        <h1>每月博文</h1>
        <p>按月份整理，每次实践都有它的位置。</p>
      </section>
      <Show
        when={!props.error}
        fallback={<p class="empty-state" role="alert">每月博文暂时无法加载，请刷新后重试。</p>}
      >
        <Show when={!props.loading} fallback={<p class="empty-state">正在整理每月博文…</p>}>
          <Show when={archives().length > 0} fallback={<p class="empty-state">还没有已发布的博文。</p>}>
            <For each={years()}>
              {year => (
                <section class="monthly-year" aria-labelledby={`monthly-year-${year}`}>
                  <header class="monthly-year-heading">
                    <h2 id={`monthly-year-${year}`}>{year}</h2>
                    <p>
                      {archives().filter(month => month.year === year).length}
                      {' 个月 · '}
                      {archives().filter(month => month.year === year).reduce((total, month) => total + month.posts.length, 0)}
                      {' 篇文章'}
                    </p>
                  </header>
                  <div class="monthly-cover-grid">
                    <For each={archives().filter(month => month.year === year)}>
                      {month => (
                        <a class={`month-cover focus-ring${month.key === archives()[0]?.key ? ' month-cover-latest' : ''}`} href={`/posts/month/${month.key}`}>
                          <div class="month-cover-topline">
                            <span class="month-number">{formatMonthNumber(month.month)}</span>
                            <span class="month-cover-count">
                              {month.posts.length}
                              {' '}
                              篇 ·
                              {' '}
                              {month.readingMinutes}
                              {' '}
                              分钟
                            </span>
                          </div>
                          <h3>{formatMonthLabel(month)}</h3>
                          <ul class="month-cover-posts">
                            <For each={month.posts.slice(0, 4)}>{post => <li>{post.title}</li>}</For>
                          </ul>
                          <span class="text-link month-cover-action" aria-hidden="true">打开本月目录 ↗</span>
                        </a>
                      )}
                    </For>
                  </div>
                </section>
              )}
            </For>
          </Show>
        </Show>
      </Show>
      <p class="monthly-archive-note">每个月的整理，都留在这里。</p>
    </div>
  )
}
