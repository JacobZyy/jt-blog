# jt-blog

Personal blog monorepo built with Solid 2, Vite+, Tailwind CSS v4, Preline, pnpm, and Turborepo.

```text
apps/blog            Solid frontend
apps/notion-sync     Scheduled Notion sync
packages/content     Shared contract, post snapshot, and media
```

## Setup

```bash
pnpm install
pnpm dev
```

The site reads `/content/posts.json`. During development, Vite serves this path from `packages/content/data`. In production, Nginx serves the same directory directly.

The committed snapshot contains mock posts, so local development does not require Notion credentials. Site text, projects, GitHub, RSS, and social links live in `apps/blog/src/config/site.ts`. Empty URLs are not rendered.

## Notion sync

Use `apps/notion-sync/.env.example` as the template for a protected environment file outside the repository, then set:

```bash
NOTION_TOKEN=secret_...
NOTION_DATA_SOURCE_ID=...
```

The default Notion properties are `Title`, `Slug`, `Description`, `Published`, `Tags`, and `Status`. Optional environment variables in the example override these names.

Run a live or fixture sync:

```bash
pnpm content:sync
pnpm content:sync:mock
```

The sync downloads Notion images, rewrites their URLs, and replaces `packages/content/data` only after every post succeeds. A failed sync leaves the previous snapshot intact.

## Schedule and deploy

`deploy/notion-sync.cron.example` runs the sync at 10:00 Asia/Shanghai. It does not rebuild the frontend. `deploy/nginx.conf.example` serves the content package directly and provides the SPA route fallback.

## Verify

```bash
pnpm lint
pnpm check-types
pnpm test
pnpm build
```
