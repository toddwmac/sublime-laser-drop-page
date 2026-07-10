#!/usr/bin/env node
// Builds index.html from links.json (+ auto-discovered *.html files in this dir).
// Re-run any time you add pages or edit the link file:  node build-index.mjs
//
// links.json schema:
// {
//   "title": "Site title",                 // optional, default "Index"
//   "description": "Subtitle text",        // optional
//   "pages": [                             // optional; order is preserved
//     { "title": "...", "href": "foo.html", "description": "..." }
//   ]
// }
//
// Any *.html / *.htm file present in this folder but missing from `pages`
// is appended automatically (title = file name). `index.html` is excluded.

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename, extname } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const LINKS_FILE = join(ROOT, 'links.json');
const OUT_FILE = join(ROOT, 'index.html');

function loadManifest() {
  if (!existsSync(LINKS_FILE)) {
    return { title: 'Index', description: '', pages: [] };
  }
  let data;
  try {
    data = JSON.parse(readFileSync(LINKS_FILE, 'utf8'));
  } catch (err) {
    console.error(`✗ Could not parse links.json: ${err.message}`);
    process.exit(1);
  }
  const pages = Array.isArray(data.pages) ? data.pages : [];
  for (const p of pages) {
    if (!p || typeof p !== 'object' || !p.href) {
      console.error('✗ Each page needs at least an "href". Problem entry skipped or fix links.json.');
      process.exit(1);
    }
  }
  return {
    title: typeof data.title === 'string' && data.title.trim() ? data.title : 'Index',
    description: typeof data.description === 'string' ? data.description : '',
    pages,
  };
}

function discoverHtmlFiles() {
  const out = [];
  for (const name of readdirSync(ROOT)) {
    const full = join(ROOT, name);
    if (!statSync(full).isFile()) continue;
    const ext = extname(name).toLowerCase();
    if (ext !== '.html' && ext !== '.htm') continue;
    if (name.toLowerCase() === 'index.html') continue;
    out.push(name);
  }
  return out.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function normalizeHref(href) {
  return String(href).replace(/^\.\//, '').toLowerCase();
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function render(manifest, pages) {
  const cardHtml = pages.length
    ? `<ul class="cards">\n${pages.map((p) => {
        const desc = p.description ? `      <span class="card-desc">${esc(p.description)}</span>\n` : '';
        return `    <li class="card">
      <a class="card-link" href="${esc(p.href)}" target="_blank" rel="noopener noreferrer">
        <span class="card-title">${esc(p.title)}</span>
${desc}        <span class="card-href">${esc(p.href)}</span>
      </a>
    </li>`;
      }).join('\n')}\n  </ul>`
    : `  <p class="empty">No pages yet. Add entries to <code>links.json</code> and re-run <code>npm run build</code>.</p>`;

  const subtitle = manifest.description
    ? `    <p class="subtitle">${esc(manifest.description)}</p>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(manifest.title)}</title>
  <style>
    :root {
      --bg: #f6f7f9;
      --card: #ffffff;
      --text: #1a1d21;
      --muted: #6b7177;
      --accent: #4f6df5;
      --line: #e4e7eb;
      --radius: 14px;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0f1115;
        --card: #171a21;
        --text: #e8eaed;
        --muted: #9aa0a6;
        --accent: #8ab4ff;
        --line: #262a33;
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .wrap { max-width: 920px; margin: 0 auto; padding: 48px 24px 64px; }
    header h1 { margin: 0 0 6px; font-size: 2rem; letter-spacing: -0.02em; }
    .subtitle { margin: 0 0 32px; color: var(--muted); font-size: 1.05rem; }
    .cards {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 14px;
    }
    .card {
      margin: 0;
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      transition: transform .12s ease, border-color .12s ease, box-shadow .12s ease;
      overflow: hidden;
    }
    .card:hover { transform: translateY(-2px); border-color: var(--accent); box-shadow: 0 6px 20px rgba(0,0,0,.08); }
    .card-link { display: flex; flex-direction: column; gap: 4px; padding: 18px 20px; color: inherit; text-decoration: none; }
    .card-title { font-weight: 600; font-size: 1.05rem; }
    .card-desc { color: var(--muted); font-size: .92rem; }
    .card-href { color: var(--accent); font-size: .82rem; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; margin-top: 2px; word-break: break-all; }
    .empty { color: var(--muted); }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background: rgba(127,127,127,.12); padding: 1px 5px; border-radius: 5px; }
    footer { margin-top: 40px; color: var(--muted); font-size: .85rem; }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>${esc(manifest.title)}</h1>
${subtitle}
    </header>
    <main>
${cardHtml}
    </main>
    <footer>${pages.length} page${pages.length === 1 ? '' : 's'} · generated ${new Date().toISOString().slice(0, 10)}</footer>
  </div>
</body>
</html>
`;
}

const manifest = loadManifest();
const listed = new Set(manifest.pages.map((p) => normalizeHref(p.href)));
const extras = discoverHtmlFiles()
  .filter((name) => !listed.has(normalizeHref(name)))
  .map((name) => ({ title: basename(name, extname(name)), href: name, description: '' }));

const pages = [...manifest.pages, ...extras];

// Warn about manifest entries whose target file is missing.
for (const p of manifest.pages) {
  if (!existsSync(join(ROOT, normalizeHref(p.href)))) {
    console.warn(`  ! warning: "${p.href}" not found in directory (link still emitted)`);
  }
}

writeFileSync(OUT_FILE, render(manifest, pages), 'utf8');

console.log(`✓ Wrote ${OUT_FILE}`);
console.log(`  ${manifest.pages.length} from links.json, ${extras.length} auto-discovered → ${pages.length} total`);
