# JSONic v2 — Icons, Tool Expansion, Copy Reduction, Home Page

Follow-up to `PRODUCTION_PLAN.md`. That pass made large JSON work and made the
tools individually indexable. This pass is about surface: real icons, a much
larger tool set, far less text on the tool pages, and a home page that looks
designed rather than assembled.

---

## 1. Research findings

### 1.1 Icon library

| Library | Icons | Per-icon cost | Notes |
|---|---|---|---|
| **lucide-react** | 1,500+ | ~1 KB | Single outline path per icon — smallest per-icon payload. Actively maintained Feather fork. |
| @heroicons/react | 292 | ~1 KB | Tailwind's official set. Four variants (outline/solid/mini/micro). Small catalogue. |
| phosphor-react | 7,700+ | heavier | Six weights bundled per icon. Most variety, largest surface. |

**Decision: `lucide-react`.**

- 1,500 icons is enough to give 28 tools a *distinct, meaningful* glyph — 292 is not.
- One outline path per icon keeps the payload minimal, and we render icons at one
  weight anyway, so Phosphor's six weights are dead cost.
- **It is in Next.js's `optimizePackageImports` default list**, so deep-import
  rewriting happens with no configuration. Measured elsewhere: 1583 modules → 333,
  boot 5.8 s → 3 s. Our current `optimizePackageImports: ["react-window"]` entry
  stays; lucide needs no entry but we will list it explicitly as documentation.
- Tree-shaken cost for ~45 icons is roughly 12 KB gzipped, against 180 KB+ for a
  whole-library import. Our sidebar plus tool pages will reference ~35 icons.

Emoji are being removed because they are not glyphs we control: they render as
different artwork per platform (Apple vs Windows vs Android), they carry no
stroke weight or optical alignment relationship to the UI, they inherit no
colour, and several of the current ones (🔮 🌳 🗜️ 🐹) are decorative rather than
descriptive. A monoline icon set gives all 28 tools one visual voice.

### 1.2 Google no longer renders FAQ or HowTo rich results

This changes what the tool pages should carry.

- **August 2023** — FAQ rich results restricted to authoritative government and
  health sites; HowTo rich results deprecated on mobile.
- **September 2023** — HowTo rich results deprecated on desktop as well.
- **May 2026** — FAQ rich results stopped appearing in Google Search entirely.
- **June/August 2026** — Search Console FAQ reporting and API support removed.

Google states rankings are unaffected: this is a search-appearance change, not an
algorithmic one, and structured data is still parsed to understand pages and
feeds AI Overviews.

**Consequences for us:**

1. **Drop `HowTo` schema and the visible numbered steps.** There is no rich
   result to win, the steps are the bulkiest block on every tool page, and a
   four-step "paste your JSON, press the button" list tells a developer nothing.
2. **Keep `FAQPage` schema** — it is cheap, still parsed for understanding, and
   the answers are genuinely useful copy.
3. **Keep `SoftwareApplication` and `BreadcrumbList`** — breadcrumbs still render.

### 1.3 Collapsed content and indexing

Google (Illyes 2016, Mueller 2020) has consistently said content inside
accordions and tabs is crawled, indexed, and weighted the same as visible text,
provided it is present in the HTML rather than fetched on expand.

Independent tests dispute the "same weight" part — Dan Shure reported a ranking
improvement on competitive terms after making accordion content visible by
default. So the honest position is: **collapsed content is indexed, but visible
content may still perform slightly better.**

**How we resolve the user's "less text" requirement against this:**

- Everything stays in the server-rendered HTML. Nothing moves behind a fetch.
- The *visible* default shrinks: one-line tool description instead of a
  paragraph, no step list, FAQ collapsed.
- The long-form keyword copy relocates to the **home page**, which becomes the
  content-heavy page, and to a single collapsed "About this tool" block at the
  bottom of each tool page.
- Per-tool ranking weight comes mostly from the unique `<title>`, meta
  description, `<h1>`, and FAQ answers — none of which we are cutting.

This is a deliberate trade: slightly less on-page text per tool in exchange for a
page a developer actually wants to use. Since the tool *is* the content for this
kind of page, that is the right side of the trade.

### 1.4 Aceternity UI design language

Aceternity is 200+ copy-paste React + Tailwind + Motion components. Its
recognisable traits:

- **Motion-first.** Spotlights, beams, aurora gradients, tracing lines. The
  animation is the identity.
- **Modern minimalism underneath.** Clean lines, generous whitespace, geometric
  precision, soft depth — the effects sit on a restrained base.
- **Signature components**: Spotlight, Aurora Background, Background Beams,
  Grid/Dot backgrounds, Bento Grid, Card Hover Effect, Card Spotlight, Glare
  Card, Text Generate Effect, Flip Words, Tracing Beam.

Stated design tokens:

| Token | Value |
|---|---|
| Primary | `#2563EB` blue / `#0D9488` teal |
| Accent | `#7C3AED` violet / `#F97316` coral |
| Dark base / surface | `#0F172A` / `#1E293B` |
| Headings | Inter 600–700, `-0.025em` tracking |
| Body | Inter 400, 1rem / 1.5 |
| Code | JetBrains Mono |
| Radius | `rounded-lg` standard |
| Shadow | `shadow-md` base, `shadow-lg` hover |
| Motion | 300 ms, `cubic-bezier(0.4, 0, 0.2, 1)`, 0.05 s stagger |
| Hover | scale 102–105% |
| A11y | respects `prefers-reduced-motion` |

**We take the design language, not the dependency.** The previous pass deleted
`framer-motion` (it was pulling a full animation runtime for one toast slide) and
the aurora/sparkles components (unused, heavy). Re-adding them would undo a
measured 157 KB → 119 KB win.

Everything below is buildable in CSS plus one small mousemove handler:

| Aceternity effect | Our implementation | Cost |
|---|---|---|
| Spotlight | `radial-gradient` + `@keyframes` drift | 0 JS |
| Grid / dot background | `background-image` + `mask-image` fade | 0 JS |
| Aurora | two blurred, slowly-animated gradient blobs | 0 JS |
| Card Hover Effect | `mousemove` → two CSS custom properties → radial gradient | ~20 lines JS, one listener |
| Bento Grid | CSS grid with spans | 0 JS |
| Flip Words | CSS keyframes on a fixed-width slot | 0 JS |
| Tracing Beam | `scroll-timeline` where supported, static line otherwise | 0 JS |

Our fonts (Inter + JetBrains Mono) and radius scale already match. The main token
change is the dark base: `#0a0a0f` → slate `#0F172A` / `#1E293B`, which reads as
considered rather than pure-black default.

### 1.5 Competitor tool taxonomies

Surveyed JSONKit (~100 pages), JSON Web Tools (100+), JSONUtils (50+),
JSONToAll (20+), Toolcore.

Consistently offered and currently missing from JSONic:

- **String-level**: escape / unescape, base64, URL encode, JWT decode
- **Structure**: flatten / unflatten, sort, merge, JSON Patch (RFC 6902) and
  Merge Patch (RFC 7386), size analysis
- **Reverse converters**: CSV → JSON, YAML → JSON, XML → JSON, NDJSON
- **Codegen breadth**: Python, Rust, Java, C#, Kotlin, Swift, Dart, PHP, Zod,
  Protobuf, SQL

Also observed: the strongest sites give **each conversion direction its own
route** (`/json-to-csv` is a separate page from `/csv-to-json`), because those
are separate search queries. Our current single `/json-converter` with a
CSV/YAML/XML toggle collapses three high-volume keywords into one page. That
should be split.

**Thin-content risk.** Twenty-eight near-identical pages is exactly the pattern
that gets classified as thin. Mitigations, applied per tool:

- Hand-written `title`, `description`, `h1` and 3 FAQ answers — no templating of
  prose from a pattern.
- A tool that is only a flag on another tool does not get a page. `/json-sort`
  earns one only because it does things the formatter's checkbox cannot (deep
  sort, sort arrays by field, natural and case-insensitive ordering).
- Tools that would be pure duplicates are declined: see §2.3.

---

## 2. Tool expansion

### 2.1 Current (10)

Viewer, Formatter, Validator, Minifier, Compare, JSONPath, To TypeScript, To Go,
Converter (CSV/YAML/XML combined), Schema Generator.

### 2.2 Proposed (28 total — 18 new, 1 split into 3)

**Inspect (5)**

| Route | Tool | Notes |
|---|---|---|
| `/json-viewer` | Tree Viewer | existing |
| `/json-validator` | Validator | existing |
| `/json-compare` | Compare | existing |
| `/jsonpath-tester` | JSONPath | existing |
| `/json-size-analyzer` | **Size Analyzer** | **new** — which keys and arrays consume the bytes, biggest-first, with a share-of-total bar. Ties directly to our large-file positioning; nobody reaches for a viewer at 40 MB without wanting to know *why* it is 40 MB. |

**Format (4)**

| Route | Tool | Notes |
|---|---|---|
| `/json-formatter` | Formatter | existing |
| `/json-minifier` | Minifier | existing |
| `/json-sort` | **Sort Keys** | **new** — deep key sort, reverse, case-insensitive, natural (`item2` before `item10`), and sort arrays of objects by a chosen field. Distinct from the formatter's boolean. |
| `/json-escape` | **Escape / Unescape** | **new** — auto-detects direction. The single most-requested missing tool. |

**Transform (4)**

| Route | Tool | Notes |
|---|---|---|
| `/json-flatten` | **Flatten / Unflatten** | **new** — nested ↔ dotted paths, configurable delimiter, array index style. Round-trips losslessly. |
| `/json-merge` | **Merge & Patch** | **new** — deep merge two documents, plus RFC 7386 Merge Patch and RFC 6902 Patch generation between them. |
| `/json-base64` | **Base64** | **new** — encode/decode, UTF-8 safe, handles base64url. |
| `/jwt-decoder` | **JWT Decoder** | **new** — decode header and payload, render `exp`/`iat`/`nbf` as readable dates and flag expiry. **Decode only, no signature verification** — verifying needs the secret, and asking for a signing secret in a web form is a pattern we should not teach. Page states this explicitly. |

**Convert (6)**

| Route | Tool | Notes |
|---|---|---|
| `/json-to-csv` | JSON → CSV | **split** out of `/json-converter` |
| `/json-to-yaml` | JSON → YAML | **split** |
| `/json-to-xml` | JSON → XML | **split** |
| `/csv-to-json` | **CSV → JSON** | **new** — RFC 4180 parsing, quoted fields, embedded newlines, type inference toggle. |
| `/json-to-ndjson` | **JSON ↔ NDJSON** | **new** — array ↔ newline-delimited, both directions. |
| `/json-to-sql` | **JSON → SQL** | **new** — `CREATE TABLE` from inferred types plus parameterised `INSERT`s, with dialect choice (PostgreSQL / MySQL / SQLite). |

**Generate (9)**

| Route | Tool | Notes |
|---|---|---|
| `/json-to-typescript` | TypeScript | existing |
| `/json-to-go` | Go | existing |
| `/json-schema-generator` | JSON Schema | existing |
| `/json-to-python` | **Python** | **new** — dataclasses, with a TypedDict toggle. |
| `/json-to-rust` | **Rust** | **new** — serde derive, `Option<T>` for inconsistent keys. |
| `/json-to-java` | **Java** | **new** — records, with a POJO toggle. |
| `/json-to-csharp` | **C#** | **new** — records with `System.Text.Json` attributes. |
| `/json-to-kotlin` | **Kotlin** | **new** — data classes with `@SerialName`. |
| `/json-to-zod` | **Zod** | **new** — Zod v3 schemas. High demand in the TypeScript ecosystem. |

Every generator reuses the existing `mergeSamples` / `optionalKeys` inference, so
optional-key detection across heterogeneous arrays comes free in all nine.

### 2.3 Declined, with reasons

| Candidate | Why not |
|---|---|
| YAML → JSON, XML → JSON | Need real parsers. A YAML subset parser that silently mishandles anchors, multi-line scalars or type coercion is worse than not offering it. Revisit with a vetted parser. |
| jq playground | Requires a jq WASM build (~600 KB). Would undo the bundle work for one tool. |
| Mock data generator | Genuinely useful, but it is a different product with its own surface. Separate effort. |
| Password / UUID / hash / QR / lorem | Not JSON tools. Dilutes the site's topic, which is the thing making it rank. |
| AI-branded tools | Would require a backend and an API key, contradicting the "nothing leaves your browser" guarantee that is the site's main differentiator. |
| JSON Linter (separate from Validator) | Same page. Would be duplicate content. |
| JSON Fixer (separate from Formatter) | Auto-fix is already a formatter toggle. Would be duplicate content. |

### 2.4 URL migration

`/json-converter` splits into three. Its existing URL 301-redirects to
`/json-to-csv`. The `next.config.ts` redirects currently pointing `/json-to-csv`,
`/json-to-yaml`, `/json-to-xml` at `/json-converter` are **removed and inverted**
— those are now real pages.

---

## 3. Copy reduction on tool pages

### Current per tool
- `h1` (~50 chars)
- intro paragraph (~350 chars, visible)
- "How to use it" — 4 numbered steps (~250 chars, visible)
- FAQ — 3 questions in collapsed `<details>`
- HowTo + FAQPage + SoftwareApplication + BreadcrumbList JSON-LD

### Target per tool
- `h1` — unchanged, one line
- **one-line description** (~90 chars, visible) replacing the paragraph
- **step list deleted** — no rich result to earn, and it stated the obvious
- **three capability chips** under the heading (e.g. `Worker-parsed` ·
  `50 MB+` · `Nothing uploaded`) — icon plus two words, scannable, near-zero text
- FAQ — kept, collapsed, moved to page bottom
- **"About this tool"** — one collapsed `<details>` holding the long-form
  paragraph, so the keyword copy stays in the HTML without occupying the screen
- JSON-LD — HowTo removed; FAQPage, SoftwareApplication, BreadcrumbList kept

Net: roughly 600 characters of visible text per tool becomes roughly 150, with
the remainder still server-rendered inside collapsed elements.

---

## 4. Home page

Currently: an `h1`, three bordered boxes, a link grid, one closing paragraph. It
is correct and plain. It is the page that should carry the long-form content and
sell the large-file story.

### Structure

1. **Hero** — full-bleed, dark-first.
   - Layered background: fine grid with a radial `mask-image` fade, one drifting
     spotlight, two blurred aurora blobs. All CSS.
   - `h1` with a gradient-filled rotating word: "JSON that's **huge / messy /
     broken**" — CSS keyframes on a fixed-width slot so nothing reflows.
   - One-line subhead, two CTAs, and a trust line ("28 tools · nothing uploaded ·
     no sign-up").
   - Right side: a **static, server-rendered mini tree** in the real viewer
     styling. No JS, no hydration, shows the product immediately.

2. **Proof strip** — four real numbers from `npm test`: `17 MB fixture`,
   `63 ms stats`, `85 ms to expand 120k rows`, `0 bytes uploaded`. Real
   measurements, reproducible by the reader.

3. **Bento grid** — 4 cards on a 3-column grid, one spanning two columns.
   - *Wide*: "Why other viewers stall" with a CSS bar chart contrasting
     DOM-node-per-value against windowed rendering.
   - "Parsed off the main thread" — worker diagram.
   - "Nothing is uploaded" — the privacy guarantee.
   - "Survives a reload" — IndexedDB autosave.

4. **Tool grid** — all 28, grouped by the five categories, each card with its
   lucide icon and a cursor-following spotlight on hover (two CSS custom
   properties, one shared listener).

5. **Long-form SEO section** — the content that leaves the tool pages: why large
   JSON breaks web viewers, virtualization, workers, size tiers. Visible, not
   collapsed. This is now the site's primary content page.

### Motion budget

- CSS only, except one delegated `mousemove` for card spotlights.
- Every animation inside `@media (prefers-reduced-motion: no-preference)`.
- No layout-affecting properties animated — `transform` and `opacity` only.
- Target: no measurable change to the 110 KB first load beyond lucide icons.

---

## 5. Sidebar at 28 tools

The flat list stops working past roughly 12 entries.

- Collapsible groups, expanded state persisted per group.
- **Filter input at the top** (`/` focuses it) — matches tool name and keywords.
- Active group auto-expands on navigation.
- Icon rail unchanged at 64 px; in collapsed state groups render as separated
  icon runs with a divider.
- The rail keeps a tooltip per icon, which matters more now that 28 glyphs must
  be distinguishable.

---

## 6. Execution phases

**Status: all seven phases complete.** 109 assertions pass, types and lint clean,
28 tool routes prerendered, first load 119 KB → 125 KB (the 18 new tools and the
icon set cost 6 KB, since every generator lives in the worker chunk).

| Phase | Work | Verification |
|---|---|---|
| **1** ✓ | `lucide-react`; icon per tool in the registry; replace every emoji in sidebar, cards, tool pages, 404 | build + visual grep for emoji |
| **2** ✓ | Tool page chrome: one-line description, capability chips, drop steps and HowTo, FAQ to bottom, About collapsed | assert reduced character count, FAQ still in HTML |
| **3** ✓ | 18 new tool implementations in `lib/json/` + worker ops + unit tests for each | `npm test` extended, one assertion group per tool |
| **4** ✓ | 18 registry entries + route pages; split `/json-converter`; fix redirects | all routes 200, unique titles, sitemap count |
| **5** ✓ | Sidebar groups + filter | build |
| **6** ✓ | Home page rebuild + design tokens | build, first-load JS delta |
| **7** ✓ | Full verification: types, lint, tests, build, route sweep, bundle comparison | all green |

### Risks

- **Bundle growth from 18 tools.** Generators are pure functions in the worker
  chunk, not the page bundle, so first-load JS should move only by the lucide
  icons. Verified by comparing the build table against the current 119 KB.
- **Thin content across 28 pages.** Mitigated by hand-written copy per tool and
  by declining duplicate-in-substance tools (§2.3).
- **Dark palette change touches every component.** Applied through the existing
  CSS custom properties in `globals.css`, so it is a token edit, not a sweep.
- **No headless browser here.** As with the previous pass, verification is
  types + lint + unit tests + built-HTML assertions + HTTP sweep. Visual and
  interaction checking still needs a manual pass.

---

## Sources

- Lucide vs Heroicons vs Phosphor — https://www.pkgpulse.com/guides/lucide-vs-heroicons-vs-phosphor-react-icon-libraries-2026
- Next.js `optimizePackageImports` — https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports
- Vercel, how package imports were optimized — https://vercel.com/blog/how-we-optimized-package-imports-in-next-js
- Google drops FAQ rich results — https://www.searchenginejournal.com/google-drops-faq-rich-results-from-search/574429/
- HowTo + FAQ rich result removal — https://www.redsharkdigital.com/news/google-how-to-faq-rich-results-update
- Collapsible content and SEO — https://www.marion.com/collapsible-content-seo-tabbed-accordion-click-to-expand/
- Hidden content, Google's position vs tests — https://www.freshegg.co.uk/blog/how-does-google-treat-hidden-content/
- Aceternity UI components — https://ui.aceternity.com/components
- Aceternity design principles — https://gist.github.com/eonist/f131274670b1481ccfd5eb1450071461
- JSONKit tool taxonomy — https://jsonkit.in/sitemap-page
- JSON Web Tools — https://jsonwebtools.com/
- JSON escape/unescape landscape — https://jsonlint.com/json-unescape

---

# Addendum: SEO + AEO pass

## What changed and why

### Answer Engine Optimization

AEO is optimizing to be the source an AI system quotes, not just a ranked link.
Research findings that drove the implementation:

- **A 40–60 word direct-answer block** near the top of a page is one of three
  structural moves that most separate cited pages from invisible ones (alongside
  question-shaped headings and named-entity density in the first 500 words).
- **Schema types that matter for citation** are Organization, Article, FAQPage,
  Product/Service and Person, deployed as one connected `@graph` rather than
  disconnected blocks. Entity-linked JSON-LD measurably improves retrieval
  accuracy in RAG pipelines.
- **Platform differences**: ChatGPT draws heavily on Bing's top 10; Perplexity is
  recency-primary and responds to structural change in 2–7 days; Google AI
  Overviews favour explicit schema and direct-answer sections.
- **Blocking an AI retrieval bot costs an estimated 18–34% of potential citations
  on that engine**, and 41% of B2B sites still block at least one.

Implemented:

| Change | Where |
|---|---|
| `answer` field on all 28 tools — 40–60 words, self-contained, hand-written | `lib/tools.ts` |
| Answer rendered as the first prose in the About block, and mirrored into JSON-LD | `tool-page.tsx`, `lib/seo.ts` |
| Connected `@graph`: WebSite + Organization + Person site-wide; SoftwareApplication + TechArticle + FAQPage + BreadcrumbList per tool, cross-referenced by `@id` | `lib/seo.ts` |
| `ItemList` of all 28 tools plus a site-level FAQPage on the home page | `toolListJsonLd()` |
| Visible FAQ section on the home page (not collapsed — the home page is the content page) | `app/page.tsx` |
| AI crawlers explicitly allowed, training and retrieval families annotated separately | `app/robots.ts` |
| `llms.txt` (curated map) and `llms-full.txt` (every tool's answer, description and FAQ as one document) | `app/llms.txt/`, `app/llms-full.txt/` |

**On the tension with "less text on the page":** the answer blocks live inside the
collapsed About element. AI crawlers parse raw HTML and do not evaluate CSS
visibility, so a collapsed block is fully extractable — while costing no screen
space. Visible prose per tool stays at roughly one line.

**On llms.txt honestly:** adoption is not universal and it is not a ranking
mechanism. It is a cheap static file that removes guesswork for anything that
does read it. The structured data and answer blocks do the real work.

### Social share previews

- `lib/og-image.tsx` renders every card: aurora wash on the site's palette,
  wordmark, category eyebrow, tool heading, one-line summary, capability chips,
  and a JSON specimen panel on the right so the card is unmistakably about JSON.
- One `opengraph-image.tsx` per route (28 + home), each 4 lines calling the
  shared renderer. Next injects `og:image`, its dimensions, its alt **and**
  `twitter:image` automatically — so those are deliberately *not* set in
  `metadata`, which would emit duplicate tags.
- Satori constraint: inline styles and flexbox only. No className, no grid, no
  CSS variables. System fonts, so no `.ttf` ships in the edge bundle.
- `public/og.png` is no longer referenced; every page now has its own card.

### Verified

29 pages and 28 OG images return 200. 28/28 unique titles, canonicals,
`twitter:card`, unique `og:image` and unique `twitter:image`. Both JSON-LD blocks
per page parse as valid JSON. `llms.txt` 6 KB, `llms-full.txt` 40 KB.

### Not done

`Speakable` schema (narrow applicability, voice-assistant only) and third-party
brand mentions — the strongest predictor of ChatGPT citation, but that is
off-site work: submissions, posts and links, not code.
