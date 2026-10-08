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
  description: '每个月，从聊天记录与真实实践里，\n整理值得分享的内容。',
  year: 2026,
  links: {
    github: { label: 'GitHub', href: '' } satisfies SiteLink,
    rss: { label: 'RSS', href: '' } satisfies SiteLink,
    social: [] as SiteLink[],
  },
  projects: [
    {
      name: 'jt-cli',
      description: '把重复的开发流程，交给工具。',
      tech: 'Rust',
      href: '',
    },
    {
      name: 'jt-fe-presets',
      description: '围绕 Vite+ 的前端工程预设。',
      tech: 'TypeScript',
      href: '',
    },
    {
      name: 'jt-blog',
      description: 'Notion 写作，Solid 呈现。',
      tech: 'SolidJS',
      href: '',
    },
  ] satisfies Project[],
} as const
