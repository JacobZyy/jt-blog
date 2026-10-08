import { For, Show } from 'solid-js'
import { siteConfig } from '../config/site'

export function Footer(props: { year: number }) {
  const links = () => [siteConfig.links.rss, siteConfig.links.github, ...siteConfig.links.social].filter(link => link.href)

  return (
    <footer class="site-footer">
      <div class="site-container site-footer-inner">
        <p>
          {'© '}
          {props.year}
          {' '}
          {siteConfig.name}
        </p>
        <p class="footer-note">慢慢做，持续写。</p>
        <Show when={links().length > 0}>
          <div class="footer-links">
            <For each={links()}>
              {link => <a class="footer-link focus-ring" href={link.href} target="_blank" rel="noreferrer">{link.label}</a>}
            </For>
          </div>
        </Show>
      </div>
    </footer>
  )
}
