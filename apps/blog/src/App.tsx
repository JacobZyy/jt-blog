import type { Post } from '@jt-blog/content'
import { createEffect, createSignal, Match, onCleanup, Show, Switch } from 'solid-js'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { siteConfig } from './config/site'
import { loadPosts } from './lib/content'
import { Home } from './pages/Home'
import { PostDetail } from './pages/PostDetail'
import { Posts } from './pages/Posts'

type Theme = 'light' | 'dark'

function currentPath() {
  const path = window.location.pathname.replace(/\/+$/, '')
  return path || '/'
}

function postSlug(path: string) {
  try {
    return decodeURIComponent(path.slice('/posts/'.length))
  }
  catch {
    return ''
  }
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

function ContentFailure(props: { message: string }) {
  return (
    <section class="content-state" role="alert">
      <p class="eyebrow">Content unavailable</p>
      <h1>Posts could not be loaded.</h1>
      <p>{props.message}</p>
      <a class="button button-secondary" href="/">Return home</a>
    </section>
  )
}

function NotFound() {
  return (
    <section class="content-state">
      <p class="eyebrow">404</p>
      <h1>Page not found.</h1>
      <p>This path does not belong to the quiet corner of the site.</p>
      <a class="button button-primary" href="/">Return home</a>
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
      <Header theme={theme()} onToggleTheme={toggleTheme} />
      <main class="site-main">
        <Switch fallback={<NotFound />}>
          <Match when={path() === '/'}>
            <Home posts={posts()} loading={loading()} error={contentError()} />
          </Match>
          <Match when={path() === '/posts'}>
            <Posts posts={posts()} loading={loading()} error={contentError()} />
          </Match>
          <Match when={path().startsWith('/posts/')}>
            <Show
              when={posts().find(post => post.slug === postSlug(path()))}
              fallback={loading() ? <div class="content-state"><p>Loading post…</p></div> : contentError() ? <ContentFailure message={contentError()} /> : <NotFound />}
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
