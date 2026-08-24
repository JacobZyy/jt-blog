import { Show } from 'solid-js'
import { siteConfig } from '../config/site'

interface HeaderProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export function Header(props: HeaderProps) {
  return (
    <header class="site-header">
      <div class="site-container site-header-inner">
        <a class="brand-link focus-ring" href="/" aria-label="Go to home">
          <img class="brand-mark" src="/jt-animated.svg" alt="JT monogram" width="36" height="36" />
          <span>{siteConfig.name}</span>
        </a>
        <nav class="site-nav" aria-label="Primary navigation">
          <a class="nav-link focus-ring" href="/">Home</a>
          <a class="nav-link focus-ring" href="/posts">Posts</a>
          <Show when={siteConfig.links.github.href}>
            <a class="nav-link focus-ring" href={siteConfig.links.github.href} target="_blank" rel="noreferrer">{siteConfig.links.github.label}</a>
          </Show>
          <button class="theme-button focus-ring" type="button" aria-label={`Switch to ${props.theme === 'light' ? 'dark' : 'light'} theme`} onClick={() => props.onToggleTheme()}>
            <span aria-hidden="true">{props.theme === 'light' ? '☾' : '☀'}</span>
          </button>
        </nav>
      </div>
    </header>
  )
}
