import type { Post } from '@jt-blog/content'
import { Show } from 'solid-js'
import { PostList } from '../components/PostList'
import { ProjectList } from '../components/ProjectList'
import { siteConfig } from '../config/site'

export function Home(props: { posts: Post[], loading: boolean, error: string }) {
  return (
    <div class="site-container page-stack">
      <section class="home-hero">
        <img class="hero-mark" src="/jt.svg" alt="JT monogram" width="128" height="128" />
        <div class="hero-copy">
          <p class="eyebrow">{siteConfig.eyebrow}</p>
          <h1>{siteConfig.name}</h1>
          <p class="hero-description">{siteConfig.description}</p>
          <div class="button-row">
            <a class="button button-primary focus-ring" href="/posts">Read the blog</a>
            <Show when={siteConfig.links.github.href}>
              <a class="button button-secondary focus-ring" href={siteConfig.links.github.href} target="_blank" rel="noreferrer">View GitHub</a>
            </Show>
          </div>
        </div>
      </section>

      <section class="content-section" aria-labelledby="recent-posts-heading">
        <div class="section-heading">
          <h2 id="recent-posts-heading">Recent posts</h2>
          <a class="text-link focus-ring" href="/posts">View all posts</a>
        </div>
        <Show when={!props.error} fallback={<p class="empty-state">Posts will appear after the next Notion sync.</p>}>
          <PostList posts={props.posts.slice(0, 3)} loading={props.loading} />
        </Show>
      </section>

      <section class="content-section" aria-labelledby="projects-heading">
        <div class="section-heading section-heading-stacked">
          <h2 id="projects-heading">Selected open source</h2>
          <p>Small tools and presets I maintain because I need them myself.</p>
        </div>
        <ProjectList projects={siteConfig.projects} />
      </section>
    </div>
  )
}
