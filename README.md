# choongum.com (redesign)

Static site, no build step. Works as-is on GitHub Pages.

## Deploy
1. In your GitHub Pages repo, keep the existing `CNAME` file.
2. Replace the old site files with everything in this folder.
3. Commit and push. `paintings.html` redirects old links to `/#paintings`.

## Preview locally
    python3 -m http.server 8765 --directory .
Then open http://localhost:8765

## Editing content
All lists are at the top of `js/app.js`:
- `ALBUMS`: title, year, Bandcamp slug, Bandcamp album id. Add the cover as `img/covers/<slug>.jpg`.
  (The album id is the `album=` number in Bandcamp's Share → Embed code.)
- `MIXES`: title, subtitle, year, YouTube id, length in seconds. Add the thumbnail as `img/mixes/<id>.jpg`.
- `PRESS`: drop files in `press/` and set `href` (e.g. `'press/choongum-epk.pdf'`). Items without `href` show as "Soon".
- `PAINTINGS`: one row per work, main image first, then details. Images go in `paintings/thumb` (600px) and `paintings/large` (1500px).

Bio text and booking email are plain HTML in `index.html`.
