interface HeaderProps {
  theme: 'light' | 'dark'
  activePath: string
  onToggleTheme: () => void
}

export function Header(props: HeaderProps) {
  return (
    <header class="site-header">
      <div class="site-container site-header-inner">
        <a class="brand-link focus-ring" href="/" aria-label="返回首页">
          <img class="brand-mark" src="/jt.svg" alt="" width="30" height="30" />
          <span>JT Blog</span>
        </a>
        <nav class="site-nav" aria-label="主导航">
          <a class="nav-link focus-ring" href="/" aria-current={props.activePath === '/' ? 'page' : undefined}>首页</a>
          <a class="nav-link focus-ring" href="/posts" aria-current={props.activePath === '/posts' || props.activePath.startsWith('/posts/') ? 'page' : undefined}>每月博文</a>
          <a class="nav-link focus-ring" href="/topics" aria-current={props.activePath === '/topics' ? 'page' : undefined}>专题</a>
        </nav>
        <button class="theme-button focus-ring" type="button" aria-label={`切换到${props.theme === 'light' ? '深色' : '浅色'}主题`} onClick={() => props.onToggleTheme()}>
          <span>{props.theme === 'light' ? '浅色' : '深色'}</span>
        </button>
      </div>
    </header>
  )
}
