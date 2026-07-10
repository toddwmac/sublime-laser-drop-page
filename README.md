# sublime-laser-drop-page

A single static `index.html` that lists every page in this folder — generated
from `links.json` and published automatically to GitHub Pages whenever you push.

- **Live site:** https://toddwmac.github.io/sublime-laser-drop-page/
- **Repo:** https://github.com/toddwmac/sublime-laser-drop-page
- **Default branch:** `main`

---

## How it works

```
links.json  ─┐
             ├─►  build-index.mjs  ─►  index.html  ─►  GitHub Actions  ─►  GitHub Pages
*.html pages ─┘      (the generator)      (output)       (auto-deploy)        (live site)
```

1. **Source of truth:** you maintain `links.json` (titles, descriptions, order)
   and drop page files (`.html`) into the repo root.
2. **Build:** `build-index.mjs` reads `links.json`, auto-discovers any
   `.html`/`.htm` file in the root that isn't already listed, merges the two
   (explicit entries first, in order; discovered files after, sorted), and writes
   `index.html`.
3. **Publish:** pushing to `main` triggers the GitHub Actions workflow, which
   rebuilds `index.html` and deploys the repo root to GitHub Pages.

`index.html` is a **generated artifact** (it's gitignored). Never edit it by
hand — edit the sources and rebuild.

---

## Repo layout

| Path | Purpose |
|------|---------|
| `links.json` | **The link file you maintain** — titles, descriptions, and ordering of pages. |
| `build-index.mjs` | The generator. Reads `links.json` + auto-discovered pages → writes `index.html`. |
| `index.html` | Generated output (gitignored). Don't hand-edit. |
| `links.schema.json` | JSON Schema for `links.json` — drives autocomplete/validation in VS Code. |
| `package.json` | Just exposes `npm run build`. Zero runtime dependencies. |
| `.github/workflows/deploy.yml` | GitHub Actions: build + deploy to Pages on every push to `main`. |
| `.vscode/tasks.json` | VS Code build task (`Ctrl+Shift+B`). |
| `.vscode/settings.json` | Wires the schema to `links.json`; enforces LF line endings. |
| `.gitattributes` | Normalizes line endings to LF (matches the Ubuntu CI). |
| `.gitignore` | Ignores `index.html`, `node_modules/`, OS/editor cruft. |

---

## Adding or editing a page

1. Drop your page into the repo root, e.g. `about.html`.
2. (Recommended) Add an entry to `links.json` to control title, description,
   and order:

   ```json
   {
     "title": "About",
     "href": "about.html",
     "description": "Who we are."
   }
   ```

   Skip this and the page still appears — it uses the file name as its title and
   is appended after your explicit entries. If a `links.json` entry points at a
   file that doesn't exist, the build prints a warning but still emits the link.

3. Rebuild locally and commit. The push deploys automatically (see
   [Deployment](#deployment)).

---

## `links.json` schema

```json
{
  "title": "Site title",
  "description": "Optional subtitle shown under the title.",
  "pages": [
    { "title": "...", "href": "foo.html", "description": "..." }
  ]
}
```

Only `href` is required per page. `title` defaults to the file name,
`description` is optional. In VS Code, `links.schema.json` gives you hover hints,
autocomplete, and flags missing `href`s or unknown keys while you type.

---

## Local development

No dependencies to install. Build with any of:

```pwsh
npm run build        # package.json script
node build-index.mjs # equivalent
```

Or in **VS Code**: open the folder and press `Ctrl+Shift+B` (runs the "Build
index" task from `.vscode/tasks.json`). Preview `index.html` with the
[Live Preview](https://marketplace.visualstudio.com/items?itemName=ms-vscode.live-server)
extension.

> Requires Node.js ≥ 18. The project has zero dependencies, so there's no
> `npm install` step.

---

## Deployment

Every push to `main` runs `.github/workflows/deploy.yml`, which:

1. Checks out the repo.
2. Runs `node build-index.mjs` to (re)generate `index.html`.
3. Uploads the repo root as the Pages artifact.
4. Deploys to GitHub Pages.

Watch a run from the CLI:

```pwsh
gh run watch            # latest run
gh run list --limit 5   # recent runs
```

> **One-time setup already done:** Pages is configured with the
> **"GitHub Actions"** source (set via the REST API as `build_type=workflow`).
> If you fork or recreate this, set *Settings → Pages → Source = "GitHub
> Actions"* once, or the deploy step will fail until enabled.
>
> The repo is **public** because GitHub Pages on a free plan requires a public
> repository. Flip to private in Settings (or `gh repo edit --visibility
> private`) only if you're on a paid plan — private Pages needs Pro+.

---

## Setup history

What's been done so far (so future-you has the context):

1. **Generator + sources** — created `build-index.mjs`, `links.json`,
   `package.json`, an initial `index.html`, and the first `README.md`.
2. **GitHub repo + Pages** — initialized git on `main`, created the public repo
   `toddwmac/sublime-laser-drop-page`, pushed, and enabled Pages with the
   "GitHub Actions" source. First deploy failed because Pages wasn't enabled yet;
   enabled it and re-ran → green.
3. **CI workflow** — added `.github/workflows/deploy.yml` (build + deploy on
   push to `main`) and `.gitignore` (excluding the generated `index.html`).
4. **VS Code + DX tooling** — added `.vscode/tasks.json` (build task),
   `.vscode/settings.json` (schema wiring + LF), `links.schema.json`
   (validation/autocomplete for `links.json`), and `.gitattributes` (LF
   normalization). Adjusted `.gitignore` so shared `.vscode/` config is tracked.

---

## Notes

- The generated page is a responsive card grid with light/dark mode (follows the
  OS via `prefers-color-scheme`). To restyle, edit the inline `<style>` block in
  `build-index.mjs` (the template lives there, not in `index.html`).
- Everything is linked with **relative paths**, so pages resolve correctly even
  at a project Pages URL like `/<repo>/`.
- The build emits a warning for any `links.json` entry whose target file is
  missing — harmless, but worth cleaning up so CI logs stay tidy. The current
  `links.json` still contains an `example.html` placeholder; replace it with your
  real pages.
