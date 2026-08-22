<img width="3600" height="2025" alt="JSONic" src="https://github.com/user-attachments/assets/0423a7a5-12f7-437c-b51d-ef2413d40653" />

# JSONic

Browser-based JSON tools built to stay responsive on documents that break other online viewers. Nothing is uploaded — every operation runs locally.

**Live:** https://jsonic.ratnesh-maurya.com

## Tools

28 tools, each on its own server-rendered route so it is individually indexable.

| Group | Tools |
|---|---|
| **Inspect** | [Tree Viewer](https://jsonic.ratnesh-maurya.com/json-viewer), [Validator](https://jsonic.ratnesh-maurya.com/json-validator), [Compare](https://jsonic.ratnesh-maurya.com/json-compare), [JSONPath](https://jsonic.ratnesh-maurya.com/jsonpath-tester), [Size Analyzer](https://jsonic.ratnesh-maurya.com/json-size-analyzer) |
| **Format** | [Formatter](https://jsonic.ratnesh-maurya.com/json-formatter), [Minifier](https://jsonic.ratnesh-maurya.com/json-minifier), [Sort Keys](https://jsonic.ratnesh-maurya.com/json-sort), [Escape / Unescape](https://jsonic.ratnesh-maurya.com/json-escape) |
| **Transform** | [Flatten / Unflatten](https://jsonic.ratnesh-maurya.com/json-flatten), [Merge & Patch](https://jsonic.ratnesh-maurya.com/json-merge), [Base64](https://jsonic.ratnesh-maurya.com/json-base64), [JWT Decoder](https://jsonic.ratnesh-maurya.com/jwt-decoder) |
| **Convert** | [To CSV](https://jsonic.ratnesh-maurya.com/json-to-csv), [To YAML](https://jsonic.ratnesh-maurya.com/json-to-yaml), [To XML](https://jsonic.ratnesh-maurya.com/json-to-xml), [CSV to JSON](https://jsonic.ratnesh-maurya.com/csv-to-json), [NDJSON](https://jsonic.ratnesh-maurya.com/json-to-ndjson), [To SQL](https://jsonic.ratnesh-maurya.com/json-to-sql) |
| **Generate** | [TypeScript](https://jsonic.ratnesh-maurya.com/json-to-typescript), [Go](https://jsonic.ratnesh-maurya.com/json-to-go), [Python](https://jsonic.ratnesh-maurya.com/json-to-python), [Rust](https://jsonic.ratnesh-maurya.com/json-to-rust), [Java](https://jsonic.ratnesh-maurya.com/json-to-java), [C#](https://jsonic.ratnesh-maurya.com/json-to-csharp), [Kotlin](https://jsonic.ratnesh-maurya.com/json-to-kotlin), [Zod](https://jsonic.ratnesh-maurya.com/json-to-zod), [JSON Schema](https://jsonic.ratnesh-maurya.com/json-schema-generator) |

Every code generator merges the shape of *all* array elements rather than sampling
the first, so keys missing from some elements come out optional rather than
silently disappearing.

## How it stays fast on large files

- **Parsing runs in a Web Worker** (`lib/json/json.worker.ts`). The main thread never blocks on `JSON.parse`, so the interface stays interactive while a job is in flight. Superseded jobs are dropped by id, so fast typing never renders a stale result.
- **The tree is a flat row model, not a component tree** (`lib/json/flatten.ts`). Collapsed containers are skipped entirely during the walk, so cost is proportional to visible rows rather than document size. `react-window` mounts only the rows in the viewport.
- **Statistics are one traversal** with an explicit stack — no per-node re-serialisation, and no recursion to overflow on deep documents.
- **Syntax highlighting is per visible line.** Only the ~50 lines on screen are tokenized.
- **Size tiers** (`lib/json/types.ts`) turn off live processing above 1 MB and switch the editor to a read-only virtualized view above 4 MB, where a controlled `<textarea>` stops being viable.

Measured on a 17 MB / 120k-record fixture (`npm test`): stats 63 ms, collapsed tree 4 rows in 5 ms, expanding 120k children 85 ms.

## State

No backend. Documents never leave the browser.

- **Preferences** (sidebar collapsed, indent, sort keys, live mode) — `localStorage`, one namespaced key.
- **Documents** — IndexedDB (`lib/storage/documents.ts`). `localStorage` caps around 5 MB and writes synchronously, which is the wrong place for a JSON document. Drafts autosave on a debounce plus `visibilitychange` and `pagehide`, with `navigator.storage.estimate()` checked before writing.

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # correctness + performance suite
npm run typecheck
npm run build
```

`NEXT_DIST_DIR` lets a production build run alongside a dev server without the two clobbering each other's `.next`:

```bash
NEXT_DIST_DIR=.next-verify npm run build
NEXT_DIST_DIR=.next-verify PORT=3111 npm start
```

### Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 measurement id (analytics are skipped when unset) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Search Console verification token |

## Architecture

```
lib/json/       pure logic — core, codegen, convert, structure, strings, csv, sql
lib/json/json.worker.ts   the only place JSON.parse runs on user input
lib/json/modes.ts         maps each tool page to a worker op and output panel
lib/tools.ts    tool registry: drives nav, routes, sitemap, metadata, FAQ schema
lib/tool-icons.tsx        lucide icon per tool (named imports only)
lib/storage/    IndexedDB draft persistence, one draft per tool
app/components/json/      virtualized tree, code view, editor
app/components/shell/     collapsible sidebar, top bar, tool page chrome
app/components/tools/     workbench, toolbar controls, output panels
app/components/home/      static tree preview, spotlight grid
app/<slug>/page.tsx       one server component per tool
```

Adding a tool means one entry in `lib/tools.ts`, one in `lib/json/modes.ts`, and a
`page.tsx` rendering its island — the sidebar, sitemap and structured data follow
automatically.

## Design notes

- **Icons** are `lucide-react`, named imports only. Next rewrites them to deep
  imports via `optimizePackageImports`, which lucide is on the default list for.
- **No animation runtime.** The hero spotlight, aurora, card hover and rotating
  word are CSS; the only JavaScript is one delegated `pointermove` that writes two
  custom properties. `framer-motion` was removed in the previous pass and staying
  off it is deliberate.
- **Tool pages carry one visible line of prose.** The long-form copy and the FAQ
  ship in the server-rendered HTML inside collapsed `<details>` — indexed, but not
  occupying the screen the tool needs. `HowTo` schema was dropped: Google
  deprecated HowTo rich results in 2023 and retired FAQ rich results in May 2026,
  so `FAQPage` stays only because it is still parsed for page understanding.

---

### Links

- 🌐 Blog: https://blog.ratnesh-maurya.com/
- 💼 Portfolio: https://ratnesh-maurya.com/

[![Blog](https://img.shields.io/badge/Blog-Visit-blue?style=for-the-badge)](https://blog.ratnesh-maurya.com/)
[![Portfolio](https://img.shields.io/badge/Portfolio-Visit-black?style=for-the-badge)](https://ratnesh-maurya.com/)
