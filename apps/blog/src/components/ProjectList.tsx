import type { Project } from '../config/site'
import { For, Match, Show, Switch } from 'solid-js'

export function ProjectList(props: { projects: readonly Project[] }) {
  return (
    <div class="project-grid">
      <For each={props.projects}>
        {project => (
          <article class={`project-card${project.name === 'jt-cli' ? ' project-card-lead' : ''}`}>
            <div class="project-visual" aria-hidden="true">
              <Switch fallback={<span class="project-monogram">{project.name.slice(0, 2)}</span>}>
                <Match when={project.name === 'jt-cli'}>
                  <span class="project-terminal">&gt;_</span>
                  <span class="project-command">$ jt --help</span>
                </Match>
                <Match when={project.name === 'jt-fe-presets'}><span class="project-vite">Vite+</span></Match>
                <Match when={project.name === 'jt-blog'}><img src="/jt.svg" alt="" width="56" height="56" /></Match>
              </Switch>
            </div>
            <div class="project-copy">
              <h3>{project.name}</h3>
              <p>{project.description}</p>
            </div>
            <div class="project-card-footer">
              <span>{project.tech}</span>
              <Show when={project.href}>
                <a class="text-link focus-ring" href={project.href} target="_blank" rel="noreferrer" aria-label={`${project.name} 源码仓库`}>↗</a>
              </Show>
            </div>
          </article>
        )}
      </For>
    </div>
  )
}
