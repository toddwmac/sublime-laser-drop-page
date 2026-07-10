# sublime-laser-drop-page

A single static `index.html` that lists every page in this folder, generated
from `links.json`.

## Files

- `index.html` — the generated page (do not edit by hand; it gets overwritten).
- `links.json` — **the link file you maintain.** Titles, descriptions, and order
  of pages live here.
- `build-index.mjs` — the generator. Reads `links.json`, merges in any
  `*.html`/`*.htm` files found in this folder that aren't already listed, and
  writes `index.html`.
- `package.json` — just so `npm run build` works.

## How to add a page

1. Drop your page file into this directory, e.g. `about.html`.
2. (Optional but recommended) Add an entry to `links.json` so you control the
   title, description, and order:

   ```json
   {
     "title": "About",
     "href": "about.html",
     "description": "Who we are."
   }
   ```

   If you skip this step, the page still shows up — it just uses the file name
   as its title and is appended after your explicit entries.

3. Rebuild:

   ```pwsh
   npm run build
   ```

## links.json schema

```json
{
  "title": "Site title",
  "description": "Optional subtitle shown under the title.",
  "pages": [
    { "title": "...", "href": "foo.html", "description": "..." }
  ]
}
```

Only `href` is required per page. `title` defaults to the file name and
`description` is optional.
