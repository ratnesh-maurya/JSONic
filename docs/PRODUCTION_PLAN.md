# JSONic — Production Readiness Plan

## Audit: why big JSON breaks today

| Problem | Location | Effect |
|---|---|---|
| Recursive tree render, every node mounted | `app/components/ui/json-tree-viewer.tsx` | 50k nodes = 50k+ DOM nodes → freeze/crash |
| `framer-motion` `AnimatePresence` per tree node | same | layout thrash per expand, huge React tree |
| `JSON.parse` + `JSON.stringify` on main thread, on every keystroke | `app/page.tsx` (`analyzeJsonTree` in `onChange`) | UI locks on >1MB input |
| `calculateTreeStats` calls `JSON.stringify(obj)` at **every** node | `app/page.tsx` | re-serialises the document once per node — O(size x depth) |
| Tokenizer emits one `<span>` per token for whole doc | `app/components/ui/json-highlighter.tsx` | millions of spans |
| One `<div>` per line number | `app/components/ui/textarea-with-line-numbers.tsx` | 200k lines = 200k divs |
| `findErrorPosition` parses a prefix per line/column | `app/page.tsx` | `JSON.parse("")` always throws, so it returned line 1, column 1 for **every** invalid document |
| Whole app one 1713-line `"use client"` file | `app/page.tsx` | no server HTML for tools, giant JS bundle |
| Tabs are React state; sitemap advertises `#hash` URLs | `app/sitemap.ts` | Google ignores fragments → 1 indexable page only |
| `verification.google: 'your-google-verification-code'` | `app/layout.tsx` | dead placeholder |
| `next.config.ts` empty | — | no headers, no package-import optimization |
| Aurora beams + sparkles + 3d-card + typewriter always loaded | `app/page.tsx` | LCP/INP cost on every tool |
| `react-window` in deps but unused | `package.json` | virtualization already paid for, never used |

## Research findings applied

- **Big JSON**: virtualize (render ~visible rows only), parse in Web Worker, build tree nodes lazily on expand. Combined, this is what lets browsers handle 100MB+.
- **Competitors**: JSON Crack = graph/tree + type codegen + jq/JSONPath, 100% client-side. JSON Hero = column view, smart previews (URL/date/color/base64), inferred schema, path-aware shareable URLs, keyboard nav.
- **Storage**: localStorage ≈ 5MB cap → prefs only. IndexedDB = 50MB→GBs → documents/history. Autosave on debounce + `visibilitychange` + `pagehide`; check `navigator.storage.estimate()`; catch `QuotaExceededError`.
- **SEO**: static routes, not hash anchors — fragments are ignored by crawlers. One optimized template per tool + unique metadata/H1/FAQ schema. SSG over dynamic for landing pages.

## Decisions (assumptions stated)

1. **No server backend for JSON data.** All processing stays client-side — it is the privacy selling point and costs nothing. "Backend" is limited to Next route handlers only if opt-in share links are added later (Phase 7).
2. **State persistence** = localStorage (prefs) + IndexedDB (documents/history) + URL hash (small shareable payloads, never leaves browser).
3. **Real routes per tool** (`/json-formatter`, …). Old `#hash` links client-redirect to the new route so nothing 404s.

---

## Phase 1 — Perf core (make big JSON work) — DONE
- `lib/json/*`: extract all pure logic out of `page.tsx` (format, minify, validate w/ line-col, stats single-pass, key sort, Go/TS codegen, JSONPath).
- `lib/json/json.worker.ts` + `useJsonWorker` hook: all parse/analyze/codegen off main thread, cancellable, job-id based.
- `lib/json/flatten.ts`: flat visible-row model (`{path, key, kind, preview, depth, hasChildren}`) built lazily from expand-set — no recursion into collapsed subtrees.
- `VirtualJsonTree`: `react-window` list over flat rows. No per-node framer-motion.
- `VirtualCodeView`: virtualized line-number gutter + per-visible-line tokenizing.
- Size tiers: <1MB full features / 1–25MB worker+virtual, no auto-analyze / >25MB read-only viewer + explicit "Analyze" + warning banner.
- Debounce 250ms, cancel in-flight jobs, drag-drop + file picker for large files.

## Phase 2 — Collapsible sidebar shell — DONE
- `AppShell` = left `Sidebar` (tool nav, groups, collapse to 64px icon rail, `[` shortcut, state persisted) + slim `TopBar` (logo, doc size, theme, GitHub) + full-height content.
- Mobile: off-canvas drawer + overlay, focus trap, ESC to close.
- Resizable input/output split with persisted ratio.

## Phase 3 — SEO — DONE
- `lib/tools.ts` single registry drives nav, routes, sitemap, metadata, FAQ.
- Server-rendered route per tool with unique title/description/canonical, H1, static intro copy, FAQ (`FAQPage`) + `HowTo` + `BreadcrumbList` + `SoftwareApplication` JSON-LD.
- `/` = landing with tool grid + static content; tool UI is a client island below the fold.
- `app/robots.ts` (replaces static txt), sitemap from registry (no hashes), per-route `opengraph-image.tsx` via `ImageResponse`, google verification from env.

## Phase 4 — Frontend optimization — DONE
- `next/dynamic` (ssr:false) for aurora/sparkles/heavy motion; drop them from tool routes.
- Move `jsonpath` (esprima + static-eval) into the worker chunk so it never lands in the main bundle.
- `next.config.ts`: `optimizePackageImports` (framer-motion, motion), `poweredByHeader:false`, security + immutable cache headers, no prod source maps.
- Bundle analyzer script + budget.

## Phase 5 — State persistence — DONE
- `lib/storage/idb.ts`: minimal promise IndexedDB wrapper (`docs`, `history` stores), quota check, quota-exceeded handling.
- `useAutosave`: debounce + `visibilitychange` + `pagehide`; restore-last-session prompt; recent-documents list in sidebar.
- Prefs (`sidebarCollapsed`, theme, indent, sortKeys, active tool, split ratio) in localStorage, one namespaced key, versioned + migration-safe.

## Phase 6 — Hardening — DONE except browser-level E2E (no headless browser available locally)
- Error boundary per tool island, a11y (roving tabindex tree, `aria-expanded`, labels), keyboard shortcuts help.
- Perf fixtures (1MB/10MB/50MB generated) + timing assertions; `next build` + lint green.

## Phase 7 — Feature parity with best-in-class — PARTIAL

Shipped in this pass: tree search with auto-expand, expand-to-depth, smart previews (URL/colour/date/email/base64 image), JSON Schema inference, JSON to CSV/YAML/XML, download/export.

Still open: column view, breadcrumb path bar, opt-in share links, jq support.

Original list:
Search-in-tree w/ jump + highlight, expand-to-depth, breadcrumb path bar, smart previews (URL/date/color/base64 image), JSON Schema inference, JSON→CSV/YAML/XML, download/export, opt-in share links.
