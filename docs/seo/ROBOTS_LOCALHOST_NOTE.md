# Robots / localhost (2026-09-13)

`src/app/robots.ts` disallows all crawlers when `NEXT_PUBLIC_SITE_URL` resolves to localhost, 127.0.0.1, `.local`, or `*.vercel.app`.

When you set a real production domain in env, robots switches to `allow: /` and emits the sitemap URL.

Also added OG SVGs for classic hubs + utility pages (TR/EN).
