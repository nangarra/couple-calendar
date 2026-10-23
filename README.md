# Couples Calendar

Mobile-first web app for the physical Couples Calendar. Each hatch has a QR code that opens a page here.
Replaces the old Wix site. Static pages built with [Astro](https://astro.build), served by a Cloudflare Worker
that also stores heart ratings and feedback in a D1 database.

## Pages

| Path | Page |
| --- | --- |
| `/` | Welcome – Deeper Connection |
| `/day-N` | One page per day, from `src/content/days/day-NN.md` |
| `/day-2-or-9` | Hatch that lets you choose Day 2 or Day 9 (`choices` in `src/data/site.ts`) |
| `/about` | This is Aurora |
| `/feedback` | Share your experience (form) |

## Editing content

- **Text:** edit the markdown in `src/content/days/`. Front matter sets the day number, title, audio and Spotify playlist.
- **Audio:** drop the file into `public/audio/` with the name used in the day's front matter
  (e.g. `public/audio/day-01.mp3`). Until the file exists the player shows "Audio coming soon".
  Use MP3 (plays in every browser; AAC/m4a doesn't). Convert with
  `ffmpeg -i input.m4a -vn -c:a libmp3lame -b:a 128k public/audio/day-NN.mp3`. Max 25 MB per file on Cloudflare.
- **Player position:** by default after the text; `audioFirst: true` puts it under the title;
  `<div data-audio></div>` in the text puts it exactly there (Day 9).
- **Spotify (Day 15):** paste the playlist link into `spotify.url` in `day-15.md`.
- **Images:** `public/images/aurora.jpg` (About photo) and `public/images/day-20-lineart.png` (Day 20 illustration)
  appear automatically once added.
- **URLs:** a day's URL is `/day-N` unless you set `slug:` in its front matter. Old Wix/QR URLs can be
  forwarded in `public/_redirects` (`/old-path /new-path 301`).
- **Pending pages:** `pending: true` shows "being prepared" (Day 2, Day 12 for now).

`reference/` holds the screenshots of the old Wix site the pages were built from (not deployed).

## Develop

```sh
npm install
npm run dev       # http://localhost:4321 (pages only, no API)
npm run preview   # build + local Cloudflare Worker + local D1 at http://localhost:8787
```

## Deploy to Cloudflare

```sh
npx wrangler login
npx wrangler d1 create couple-calendar           # copy the database_id into wrangler.jsonc
npx wrangler d1 migrations apply couple-calendar --remote
npm run deploy
```

Then in the Cloudflare dashboard: Worker → Settings → Domains & Routes → add `couplecalendar.online`
and `www.couplecalendar.online` (the domain's DNS must be on Cloudflare).

## Reading ratings and feedback

```sh
npx wrangler d1 execute couple-calendar --remote --command "SELECT page, AVG(rating), COUNT(*) FROM ratings GROUP BY page"
npx wrangler d1 execute couple-calendar --remote --command "SELECT * FROM feedback ORDER BY created_at DESC"
```
