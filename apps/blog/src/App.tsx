import type { Post } from '@jt-blog/content'
import { createEffect, createSignal, Match, onCleanup, Show, Switch } from 'solid-js'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { siteConfig } from './config/site'
import { loadPosts } from './lib/content'
import { parseMonthKey } from './lib/months'
import { postSlug, routeTitle } from './lib/title'
import { Home } from './pages/Home'
import { Month } from './pages/Month'
import { PostDetail } from './pages/PostDetail'
import { Posts } from './pages/Posts'
import { Topics } from './pages/Topics'

type Theme = 'light' | 'dark'

function currentPath() {
  const path = window.location.pathname.replace(/\/+$/, '')
  return path || '/'
}

function preferredTheme(): Theme {
  try {
    const saved = window.localStorage.getItem('jt-theme')
    if (saved === 'light' || saved === 'dark')
      return saved
  }
  catch {
    // Storage can be unavailable in private browsing contexts.
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function ContentFailure() {
  return (
    <section class="content-state site-container" role="alert">
      <p class="eyebrow">内容暂不可用</p>
      <h1>博文暂时无法加载。</h1>
      <p>请刷新后重试。</p>
      <a class="button button-secondary" href="/">返回首页</a>
    </section>
  )
}

function NotFound() {
  return (
    <section class="content-state site-container">
      <p class="eyebrow">404</p>
      <h1>页面不存在。</h1>
      <p>这个地址暂时没有内容。</p>
      <a class="button button-primary" href="/">返回首页</a>
    </section>
  )
}

function App() {
  const [theme, setTheme] = createSignal<Theme>(preferredTheme())
  const [path, setPath] = createSignal(currentPath())
  const [posts, setPosts] = createSignal<Post[]>([])
  const [loading, setLoading] = createSignal(true)
  const [contentError, setContentError] = createSignal('')

  createEffect(() => theme(), (nextTheme) => {
    document.documentElement.dataset.theme = nextTheme

    try {
      window.localStorage.setItem('jt-theme', nextTheme)
    }
    catch {
      // Storage can be unavailable in private browsing contexts.
    }
  })

  createEffect(() => routeTitle(path(), posts(), loading()), (nextTitle) => {
    document.title = nextTitle
  })

  const handlePopState = () => setPath(currentPath())
  const handleNavigation = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return

    const anchor = event.target instanceof Element ? event.target.closest('a') : null
    if (!anchor || anchor.target || anchor.hasAttribute('download'))
      return

    const url = new URL(anchor.href, window.location.href)
    if (url.origin !== window.location.origin || (url.pathname === window.location.pathname && url.hash))
      return

    event.preventDefault()
    window.history.pushState(null, '', `${url.pathname}${url.search}${url.hash}`)
    setPath(currentPath())
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  window.addEventListener('popstate', handlePopState)
  document.addEventListener('click', handleNavigation)
  onCleanup(() => {
    window.removeEventListener('popstate', handlePopState)
    document.removeEventListener('click', handleNavigation)
  })

  void loadPosts()
    .then((payload) => {
      setPosts(payload.posts)
      setContentError('')
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown content error.'
      setContentError(message)
    })
    .finally(() => setLoading(false))

  const toggleTheme = () => setTheme(value => value === 'light' ? 'dark' : 'light')

  return (
    <div class="site-shell">
      <Header theme={theme()} activePath={path()} onToggleTheme={toggleTheme} />
      <main class="site-main">
        <Switch fallback={<NotFound />}>
          <Match when={path() === '/'}>
            <Home posts={posts()} loading={loading()} error={contentError()} />
          </Match>
          <Match when={path() === '/posts'}>
            <Posts posts={posts()} loading={loading()} error={contentError()} />
          </Match>
          <Match when={path() === '/topics'}>
            <Topics />
          </Match>
          <Match when={path().startsWith('/posts/month/')}>
            <Show
              when={parseMonthKey(path().slice('/posts/month/'.length))}
              fallback={<NotFound />}
            >
              {month => (
                <Show
                  when={!loading()}
                  fallback={<div class="content-state site-container" role="status"><p>正在加载本月博文…</p></div>}
                >
                  <Show
                    when={!contentError()}
                    fallback={<ContentFailure />}
                  >
                    <Month monthKey={month().key} posts={posts()} />
                  </Show>
                </Show>
              )}
            </Show>
          </Match>
          <Match when={path().startsWith('/posts/')}>
            <Show
              when={posts().find(post => post.slug === postSlug(path()))}
              fallback={loading() ? <div class="content-state site-container" role="status"><p>正在加载博文…</p></div> : contentError() ? <ContentFailure /> : <NotFound />}
            >
              {post => <PostDetail post={post()} />}
            </Show>
          </Match>
        </Switch>
      </main>
      <Footer year={siteConfig.year} />
    </div>
  )
}

export default App
