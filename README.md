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

Create the ignored local environment file, restrict its permissions, then set the credentials:

```bash
cp apps/notion-sync/.env.example apps/notion-sync/.env
chmod 600 apps/notion-sync/.env
```

Set these values in `apps/notion-sync/.env`:

```dotenv
NOTION_TOKEN=secret_...
NOTION_DATA_SOURCE_ID=...
# Production only:
# NOTION_SYNC_OUTPUT_DIR=/srv/jt-blog/content
```

The default Notion properties are `Title`, `Slug`, `Description`, `Published`, `Tags`, and `Status`. Optional environment variables in the example override these names.

Run a live or fixture sync:

```bash
pnpm content:sync
pnpm content:sync:mock
```

Install the current user's daily 10:00 Asia/Shanghai crontab entry:

```bash
pnpm content:schedule:install
```

The installer is idempotent and preserves unrelated cron jobs. To keep credentials outside the repository, pass an absolute file path to either command:

```bash
NOTION_SYNC_ENV_FILE=/etc/jt-blog.env pnpm content:sync
NOTION_SYNC_ENV_FILE=/etc/jt-blog.env pnpm content:schedule:install
```

The sync downloads Notion images, rewrites their URLs, and replaces `packages/content/data` only after every post succeeds. A failed sync leaves the previous snapshot intact.

## Schedule and deploy

The installed task writes logs to `logs/notion-sync.log` and does not rebuild the frontend. `deploy/notion-sync.cron.example` documents the equivalent cron entry. `deploy/nginx.conf.example` serves the content package directly and provides the SPA route fallback.

## Verify

```bash
pnpm lint
pnpm check-types
pnpm test
pnpm build
```
