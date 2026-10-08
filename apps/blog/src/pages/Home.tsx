import type { Post } from '@jt-blog/content'
import { For, Show } from 'solid-js'
import { PostCard } from '../components/PostCard'
import { ProjectList } from '../components/ProjectList'
import { siteConfig } from '../config/site'
import { formatMonthLabel, formatMonthNumber, groupPostsByMonth } from '../lib/months'

export function Home(props: { posts: Post[], loading: boolean, error: string }) {
  const months = () => groupPostsByMonth(props.posts)

  return (
    <div class="site-container page-stack home-page">
      <section class="home-hero">
        <div class="hero-copy">
          <p class="eyebrow">{siteConfig.eyebrow}</p>
          <h1>{siteConfig.name}</h1>
          <p class="hero-description">{siteConfig.description}</p>
        </div>
        <img class="hero-mark" src="/jt-animated.svg" alt="" width="84" height="84" />
      </section>

      <section class="content-section" aria-labelledby="monthly-posts-heading">
        <div class="section-heading">
          <h2 id="monthly-posts-heading">每月博文</h2>
          <a class="text-link focus-ring" href="/posts">按月浏览 ↗</a>
        </div>
        <Show when={!props.error} fallback={<p class="empty-state" role="alert">博文暂时无法加载，请稍后刷新。</p>}>
          <Show when={months()[0]} fallback={<p class="empty-state" role="status">{props.loading ? '正在加载博文…' : '还没有发布的博文。'}</p>}>
            {month => (
              <div class={`latest-month${month().posts.length > 1 ? ' latest-month-with-aside' : ''}`}>
                <div class="month-identifier">
                  <p class="month-year">{month().year}</p>
                  <p class="month-number">{formatMonthNumber(month().month)}</p>
                  <div class="month-identifier-copy">
                    <p class="month-name">
                      <span class="month-mobile-year">
                        {month().year}
                        {' '}
                        年
                        {' '}
                      </span>
                      {month().month}
                      {' '}
                      月
                    </p>
                    <p class="month-summary">
                      <span>
                        {month().posts.length}
                        {' '}
                        篇文章
                      </span>
                      <span>
                        {month().readingMinutes}
                        {' '}
                        分钟
                      </span>
                    </p>
                  </div>
                  <a class="text-link focus-ring month-directory" href={`/posts/month/${month().key}`}>本月目录 ↗</a>
                </div>
                <PostCard post={month().posts[0]} variant="featured" />
                <Show when={month().posts.length > 1}>
                  <div class="latest-month-aside">
                    <For each={month().posts.slice(1, 3)}>{post => <PostCard post={post} variant="compact" />}</For>
                  </div>
                </Show>
              </div>
            )}
          </Show>
        </Show>
      </section>

      <section class="content-section" aria-labelledby="projects-heading">
        <div class="section-heading">
          <h2 id="projects-heading">精选项目</h2>
          <p class="section-caption">
            <span class="desktop-caption">为自己的工作，做一些小工具。</span>
            <span class="mobile-caption">持续维护中</span>
          </p>
        </div>
        <ProjectList projects={siteConfig.projects} />
      </section>

      <Show when={months().length > 1}>
        <section class="content-section" aria-labelledby="past-months-heading">
          <div class="section-heading"><h2 id="past-months-heading">往期月份</h2></div>
          <div class="past-months">
            <For each={months().slice(1, 3)}>
              {month => (
                <a class="past-month focus-ring" href={`/posts/month/${month.key}`} aria-label={`浏览${formatMonthLabel(month)}，${month.posts.length}篇文章`}>
                  <div class="past-month-date">
                    <p class="month-number">{formatMonthNumber(month.month)}</p>
                    <p class="month-summary">
                      {month.year}
                      {' '}
                      ·
                      {' '}
                      {month.posts.length}
                      {' '}
                      篇文章
                    </p>
                  </div>
                  <div class="past-month-copy">
                    <h3>{month.posts[0].title}</h3>
                    <p>{month.posts.slice(1, 4).map(post => post.title).join(' · ') || month.posts[0].description}</p>
                  </div>
                  <span class="text-link past-month-action">
                    浏览
                    {month.month}
                    {' '}
                    月 ↗
                  </span>
                </a>
              )}
            </For>
          </div>
        </section>
      </Show>
    </div>
  )
}
