import type { Project } from '../config/site'
import { For, Show } from 'solid-js'

export function ProjectList(props: { projects: readonly Project[] }) {
  return (
    <div class="project-list">
      <For each={props.projects}>
        {project => (
          <article class="project-row">
            <div class="project-content">
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              <span class="tag">{project.tech}</span>
            </div>
            <Show when={project.href}>
              <a class="text-link focus-ring" href={project.href} target="_blank" rel="noreferrer">Repository ↗</a>
            </Show>
          </article>
        )}
      </For>
    </div>
  )
}
