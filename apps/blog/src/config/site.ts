export interface SiteLink {
  label: string
  href: string
}

export interface Project {
  name: string
  description: string
  tech: string
  href: string
}

export const siteConfig = {
  name: 'Jacob Zha',
  eyebrow: 'Frontend engineer · open source',
  description: 'I build quiet tools, design systems, and open-source software — then write down what survived implementation.',
  year: 2026,
  links: {
    github: { label: 'GitHub', href: '' } satisfies SiteLink,
    rss: { label: 'RSS', href: '' } satisfies SiteLink,
    social: [] as SiteLink[],
  },
  projects: [
    {
      name: 'jt-cli',
      description: 'Developer tooling for repeatable local workflows.',
      tech: 'Rust',
      href: '',
    },
    {
      name: 'jt-fe-presets',
      description: 'Opinionated frontend presets built around Vite+.',
      tech: 'TypeScript',
      href: '',
    },
    {
      name: 'jt-blog',
      description: 'A quiet personal blog powered by Notion and Solid.',
      tech: 'SolidJS',
      href: '',
    },
  ] satisfies Project[],
} as const
