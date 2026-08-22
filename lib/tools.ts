/**
 * Single source of truth for every tool: sidebar nav, routes, sitemap,
 * per-page metadata and structured data all read from here.
 *
 * Copy rules, applied per tool:
 *  - `summary` is the ONE visible line under the h1. Keep it under ~110 chars.
 *  - `about` is the long-form paragraph. It ships in the HTML but sits inside a
 *    collapsed <details>, so it stays indexable without filling the screen.
 *  - `faq` answers must be genuinely informative and written per tool. Twenty-eight
 *    pages of templated prose is exactly what gets classified as thin content.
 */

export const SITE_URL = "https://jsonic.ratnesh-maurya.com";
export const SITE_NAME = "JSONic";

export type ToolGroup = "Inspect" | "Format" | "Transform" | "Convert" | "Generate";

/** lucide-react icon name; resolved to a component in lib/tool-icons.ts */
export type IconName =
    | "ListTree" | "ShieldCheck" | "GitCompareArrows" | "Search" | "ChartPie"
    | "Sparkles" | "Minimize2" | "ArrowDownAZ" | "Quote"
    | "Layers" | "GitMerge" | "Binary" | "KeyRound"
    | "Table" | "FileCode2" | "Code2" | "FileInput" | "AlignJustify" | "Database"
    | "Braces" | "Blocks" | "Coffee" | "Hash" | "Boxes" | "Shapes" | "FileJson2" | "Gem";

export interface FaqEntry {
    q: string;
    a: string;
}

export interface Tool {
    id: string;
    slug: string;
    /** sidebar label — short enough for a 240px rail */
    name: string;
    group: ToolGroup;
    icon: IconName;
    heading: string;
    title: string;
    description: string;
    keywords: string[];
    /** the single visible line under the heading */
    summary: string;
    /** three two-word capability chips */
    chips: string[];
    /**
     * A 40-60 word self-contained answer to "what is this tool and what does it do".
     * Answer engines extract a block like this far more reliably than prose spread
     * across a page, and it is mirrored into the JSON-LD so it is available without
     * rendering. It lives inside the collapsed About block, so it costs no screen space.
     */
    answer: string;
    /** long-form copy, collapsed on the page */
    about: string;
    faq: FaqEntry[];
    legacyHash?: string;
}

const PRIVATE = "Nothing uploaded";
const WORKER = "Worker-parsed";
const LARGE = "50 MB+ ready";
const INSTANT = "Instant";

export const TOOLS: Tool[] = [
    // ----------------------------------------------------------------- Inspect
    {
        id: "viewer",
        slug: "json-viewer",
        name: "Tree Viewer",
        group: "Inspect",
        icon: "ListTree",
        heading: "JSON Viewer",
        title: "JSON Viewer — Explore Large JSON Files Online",
        description:
            "Open and explore JSON of any size in an interactive tree. Virtualized rendering and worker-based parsing keep 50 MB+ documents smooth. Search keys and values, copy any JSONPath, all in your browser.",
        keywords: ["json viewer", "json tree view", "large json viewer", "json explorer", "view json online", "big json file viewer"],
        summary: "Explore JSON as a collapsible tree — built for files that freeze other viewers.",
        chips: [WORKER, LARGE, PRIVATE],
        answer:
            "A JSON viewer opens a JSON file as a collapsible tree so you can explore its structure instead of reading raw text. JSONic parses in a Web Worker and renders only the rows currently on screen, so files in the tens of megabytes stay responsive. Search keys and values, expand to a depth, and copy any node's JSONPath.",
        about:
            "Paste or drop a JSON file and explore it as a collapsible tree. Parsing runs in a background worker and the tree renders only the rows currently on screen, so multi-megabyte documents open without freezing the tab. Search jumps to matching keys and values and expands the path to reach them, every node exposes a copyable JSONPath, and detected values such as URLs, colours, dates and base64 images get an inline preview.",
        faq: [
            {
                q: "How large a JSON file can this viewer open?",
                a: "Files in the tens of megabytes open comfortably. Parsing runs in a Web Worker and the tree only renders the rows inside the viewport, so cost scales with what you look at rather than with file size. Above 4 MB the editor switches to a read-only view, because browsers cannot keep an editable textarea that large responsive.",
            },
            {
                q: "Is my JSON uploaded to a server?",
                a: "No. Every operation runs in your browser. Nothing is transmitted, logged or stored server-side.",
            },
            {
                q: "Why does this open files that other JSON viewers cannot?",
                a: "Most viewers build a DOM node for every value in the document, so a million values means a million elements. JSONic keeps a flat row model and mounts only the visible rows, and it never re-serialises the document to compute statistics.",
            },
        ],
        legacyHash: "treeview",
    },
    {
        id: "validator",
        slug: "json-validator",
        name: "Validator",
        group: "Inspect",
        icon: "ShieldCheck",
        heading: "JSON Validator",
        title: "JSON Validator — Check JSON Syntax Online with Line Numbers",
        description:
            "Validate JSON and get the exact line and column of the first syntax error, plus concrete suggestions for fixing it. Handles large files without blocking the browser.",
        keywords: ["json validator", "validate json", "json syntax checker", "json lint", "check json online", "json error line"],
        summary: "Find the exact line and column that breaks your JSON, and what to do about it.",
        chips: ["Exact line", "Fix hints", PRIVATE],
        answer:
            "A JSON validator checks whether text parses as valid JSON and reports the first syntax error. JSONic gives the exact line and column, explains the likely cause — an unbalanced bracket, a trailing comma, a single-quoted string — and offers a one-click auto-fix for the common cases.",
        about:
            "Paste JSON to check whether it parses. When it does not, JSONic reports the failing line and column and explains the likely cause — an unbalanced bracket, a trailing comma, a single-quoted string — instead of only echoing the raw parser message. When the engine gives no offset, a structural scanner locates the problem instead of blaming the last line. Valid documents get a type histogram and notes on structure worth reconsidering.",
        faq: [
            {
                q: "Which JSON specification is used?",
                a: "The browser's native JSON.parse, which implements RFC 8259. NaN, Infinity, undefined, comments and trailing commas are rejected, exactly as a strict parser would.",
            },
            {
                q: "Why did another validator report a different line?",
                a: "Some validators report the offset of the token the parser gave up on, others the start of the construct that failed. JSONic maps the engine's byte offset directly to a line and column, and falls back to its own scanner when the engine reports no offset at all.",
            },
            {
                q: "Can it validate against a JSON Schema?",
                a: "Not yet — this checks syntax, not conformance. The schema generator can infer a draft 2020-12 schema from a sample document as a starting point.",
            },
        ],
        legacyHash: "validator",
    },
    {
        id: "compare",
        slug: "json-compare",
        name: "Compare",
        group: "Inspect",
        icon: "GitCompareArrows",
        heading: "JSON Compare",
        title: "JSON Diff — Compare Two JSON Files Online",
        description:
            "Compare two JSON documents side by side and see added, removed and changed values. Optional key sorting so ordering differences do not show up as changes.",
        keywords: ["json diff", "compare json", "json compare online", "json difference checker", "diff two json files"],
        summary: "See what actually changed between two documents, without ordering noise.",
        chips: ["Side by side", "Sort first", PRIVATE],
        answer:
            "A JSON diff shows what changed between two documents: which keys were added, removed, or given a different value. JSONic compares them side by side, and can sort keys on both sides first so that differences in property order do not show up as changes.",
        about:
            "Put two JSON documents side by side to see what changed. Sorting keys first removes ordering noise, so the diff shows only genuine additions, removals and value changes — the fastest way to check an API response against a known-good fixture. Both a line diff and a structural tree view are available for each side.",
        faq: [
            {
                q: "Does property order count as a difference?",
                a: "Not if you enable key sorting, which normalises both sides first. JSON objects are unordered by specification, so ordering is usually noise rather than signal.",
            },
            {
                q: "Are arrays compared by index or by content?",
                a: "By index. Inserting an element near the start therefore marks the following elements as changed, which is the conventional behaviour for structural JSON diffs. If you need a semantic patch instead, the Merge & Patch tool produces RFC 6902 operations.",
            },
            {
                q: "Can it compare large files?",
                a: "Both sides are parsed in a worker, but a diff is proportional to the data on both sides, so very large pairs are slower than single-document tools. Narrow to the region you care about first.",
            },
        ],
        legacyHash: "comparer",
    },
    {
        id: "jsonpath",
        slug: "jsonpath-tester",
        name: "JSONPath",
        group: "Inspect",
        icon: "Search",
        heading: "JSONPath Tester",
        title: "JSONPath Tester — Evaluate JSONPath Expressions Online",
        description:
            "Run JSONPath expressions against your document and see the matches instantly. Supports recursive descent, wildcards, slices and filter expressions, evaluated locally.",
        keywords: ["jsonpath tester", "jsonpath evaluator", "jsonpath online", "query json", "jsonpath expression", "json query tool"],
        summary: "Query a document with a JSONPath expression and see every match as you type.",
        chips: ["Live results", "Filters", PRIVATE],
        answer:
            "JSONPath is an expression language for selecting values from a JSON document, much as XPath does for XML. An expression such as $.users[*].email returns every email in the users array. JSONic evaluates expressions as you type and reports the matches and the match count.",
        about:
            "JSONPath is to JSON what XPath is to XML: a compact expression for selecting values out of a document. Paste your JSON, type an expression such as $.users[*].email, and see every match immediately. Evaluation runs in a background worker, so large documents stay responsive while you refine the expression.",
        faq: [
            {
                q: "What JSONPath syntax is supported?",
                a: "The Goessner-style syntax: $ root, . and .. descent, [*] wildcards, [start:end] slices, and [?(@.field == 'value')] filter expressions.",
            },
            {
                q: "What is the difference between $.a.b and $..b?",
                a: "$.a.b selects b only directly under a. $..b performs a recursive descent and selects every b anywhere in the document, at any depth.",
            },
            {
                q: "How do I filter an array by a value?",
                a: "Use a filter expression: $.items[?(@.price > 100)] selects every item whose price exceeds 100. Filters can compare, and combine with && and ||.",
            },
        ],
        legacyHash: "jsonpath",
    },
    {
        id: "size",
        slug: "json-size-analyzer",
        name: "Size Analyzer",
        group: "Inspect",
        icon: "ChartPie",
        heading: "JSON Size Analyzer",
        title: "JSON Size Analyzer — Find What Makes Your JSON Large",
        description:
            "Break a JSON document down by byte weight: which branches, arrays and keys account for the payload, how much goes to key names, and where the largest string lives.",
        keywords: ["json size analyzer", "json payload size", "reduce json size", "why is my json so large", "json bytes breakdown"],
        summary: "Find which branches, arrays and key names are actually consuming the bytes.",
        chips: ["Byte weight", "Key overhead", PRIVATE],
        answer:
            "A JSON size analyzer shows which parts of a document account for its bytes. JSONic ranks branches and arrays by serialized size with a share-of-total bar, reports how many bytes go to key names rather than values, and points at the single largest string in the document.",
        about:
            "Knowing a response is 40 MB is not useful; knowing that one array of embedded base64 thumbnails is 36 MB of it is. This tool measures the serialized size of each branch, ranks them biggest-first with a share-of-total bar, reports how many bytes go to key names rather than values, and points at the single largest string in the document. It is the tool to reach for before deciding what to paginate, drop or move behind a separate request.",
        faq: [
            {
                q: "Why measure key names separately?",
                a: "In wide, shallow documents — an array of thousands of small records — key names can be a third of the payload, because every record repeats them. That is the case where shortening keys or switching to a columnar shape actually pays, and the case where it does not is worth knowing too.",
            },
            {
                q: "Are these the bytes that travel over the network?",
                a: "These are the uncompressed serialized bytes. Gzip and brotli compress repeated key names very effectively, so the compressed saving from renaming keys is much smaller than the raw number suggests. Treat the raw figure as an upper bound.",
            },
            {
                q: "How deep does the breakdown go?",
                a: "Two levels, and large arrays are reported as a whole rather than element by element. That is enough to identify the branch responsible without producing a report as long as the document.",
            },
        ],
    },

    // ------------------------------------------------------------------ Format
    {
        id: "formatter",
        slug: "json-formatter",
        name: "Formatter",
        group: "Format",
        icon: "Sparkles",
        heading: "JSON Formatter",
        title: "JSON Formatter & Beautifier — Free Online Pretty Print",
        description:
            "Format and beautify JSON with 2, 4 or 8 space indentation, optional key sorting, and auto-repair for trailing commas, single quotes, unquoted keys and comments.",
        keywords: ["json formatter", "json beautifier", "pretty print json", "format json online", "json indent", "json prettify"],
        summary: "Beautify JSON, and repair the mistakes that normally stop it parsing at all.",
        chips: ["Auto-repair", "Sort keys", PRIVATE],
        answer:
            "A JSON formatter re-indents JSON so it is readable. JSONic lets you choose 2, 4, or 8 spaces, optionally sort keys for stable diffs, and auto-repair the mistakes that usually block parsing altogether: trailing commas, single-quoted strings, unquoted property names, and JavaScript comments.",
        about:
            "Paste messy JSON and get readable, correctly indented output. Choose your indent width, sort keys alphabetically for stable diffs, and let auto-repair fix the mistakes that normally break a parse: trailing commas, single-quoted strings, unquoted property names and JavaScript comments. Repair runs a real tokenizer rather than regular expressions, so it never rewrites content inside string values.",
        faq: [
            {
                q: "What exactly does auto-repair fix?",
                a: "Trailing commas before a closing bracket, single-quoted strings, unquoted object keys, and // or /* */ comments. It tokenizes the input, so a comma or brace inside a string value is left alone — which is where naive regex-based fixers corrupt data.",
            },
            {
                q: "Why would I sort keys?",
                a: "Sorted keys make two exports of the same data diff cleanly, which is what you want before committing fixtures or comparing API responses across environments.",
            },
            {
                q: "Does formatting change my data?",
                a: "Formatting only changes whitespace. Sorting keys reorders object members, which JSON treats as unordered, so the data remains equivalent — though a consumer that wrongly depends on key order would notice.",
            },
        ],
        legacyHash: "formatter",
    },
    {
        id: "minifier",
        slug: "json-minifier",
        name: "Minifier",
        group: "Format",
        icon: "Minimize2",
        heading: "JSON Minifier",
        title: "JSON Minifier — Compress JSON Online and See the Savings",
        description:
            "Minify JSON by removing all insignificant whitespace, and see exactly how many bytes and what percentage you saved. Client-side, no upload.",
        keywords: ["json minifier", "minify json", "compress json", "json compressor", "reduce json size", "json whitespace remover"],
        summary: "Strip every insignificant byte, and see exactly what it saved.",
        chips: ["Byte report", "Auto-repair", PRIVATE],
        answer:
            "Minifying JSON removes every byte of whitespace between tokens, producing an identical value in fewer bytes. JSONic reports the original size, the minified size, and the percentage saved. Pretty-printed input typically shrinks by 10 to 30 percent, depending on nesting depth and indent width.",
        about:
            "Minifying removes every byte of insignificant whitespace from a JSON document. Paste a formatted payload to see the minified output alongside the original size, the minified size and the percentage saved — useful before shipping config, fixtures or API responses over the wire.",
        faq: [
            {
                q: "Is minified JSON still valid?",
                a: "Yes. Whitespace between tokens is insignificant in JSON, so the minified document parses to exactly the same value.",
            },
            {
                q: "How much smaller does JSON usually get?",
                a: "Typically 10–30% for pretty-printed input, depending on nesting depth and indent width. Deeply nested documents with 4-space indentation save the most.",
            },
            {
                q: "Should I minify if my server already gzips?",
                a: "The extra saving is small, because compression already handles repeated whitespace well. Minify when uncompressed size is what matters — bundled fixtures, embedded config, database rows, or anything counted against a payload limit before compression.",
            },
        ],
        legacyHash: "compressor",
    },
    {
        id: "sort",
        slug: "json-sort",
        name: "Sort Keys",
        group: "Format",
        icon: "ArrowDownAZ",
        heading: "JSON Sort",
        title: "JSON Sort — Sort Keys and Arrays Online",
        description:
            "Sort JSON object keys recursively with natural, case-insensitive or reverse ordering, and sort arrays of objects by any field. Produces stable output for clean diffs.",
        keywords: ["json sort", "sort json keys", "sort json alphabetically", "json sort array by field", "normalize json"],
        summary: "Recursive key sorting with natural ordering, plus sorting arrays by any field.",
        chips: ["Natural order", "Sort arrays", PRIVATE],
        answer:
            "Sorting JSON makes two exports of the same data comparable. JSONic sorts object keys recursively using natural ordering, so item2 comes before item10, optionally ignoring case or reversing direction. It can also sort arrays of objects by any field that every element shares.",
        about:
            "Sorting is how you make two exports of the same data comparable. This goes further than an alphabetical key sort: natural ordering puts item2 before item10 rather than after it, case-insensitive mode stops uppercase keys clustering at the top, and arrays of objects can be ordered by any field they all share. The result is a document that diffs cleanly against another export of the same data.",
        faq: [
            {
                q: "How is this different from the formatter's Sort keys checkbox?",
                a: "The formatter does a plain alphabetical key sort. This tool adds natural ordering, case-insensitive comparison, reverse order, and sorting arrays of objects by a chosen field — none of which a single checkbox can express.",
            },
            {
                q: "What is natural ordering?",
                a: "Lexicographic sorting puts item10 before item2, because it compares character by character. Natural ordering compares embedded numbers numerically, giving item2 then item10 — which is almost always what you meant.",
            },
            {
                q: "Does sorting arrays change my data?",
                a: "Array order is significant in JSON, so yes, that is a real change. Key sorting is not, since objects are unordered. Arrays are only reordered when you name a field, and only when every element actually has it.",
            },
        ],
    },
    {
        id: "escape",
        slug: "json-escape",
        name: "Escape",
        group: "Format",
        icon: "Quote",
        heading: "JSON Escape & Unescape",
        title: "JSON Escape / Unescape — Stringify JSON Online",
        description:
            "Escape JSON into a string literal you can embed in code, or unescape a stringified payload back into readable JSON. Direction is detected automatically.",
        keywords: ["json escape", "json unescape", "escape json string", "unescape json", "stringify json", "json string literal"],
        summary: "Turn JSON into an embeddable string literal, or a stringified payload back into JSON.",
        chips: ["Auto-direction", "Unicode safe", PRIVATE],
        answer:
            "Escaping JSON turns a document into a string literal you can embed in code. Unescaping reverses it, stripping the backslashes a payload collects when it is nested inside another JSON string or written to a log line. JSONic detects which direction you need from the input itself.",
        about:
            "A JSON payload that has been through a log line, a database column or a nested API response arrives covered in backslashes. This unescapes it back into something readable — and goes the other way, turning a document into the escaped literal you can paste into source code or a test fixture. Direction is detected from the input: text containing backslash escapes but no raw newlines is treated as already escaped.",
        faq: [
            {
                q: "How does direction detection work?",
                a: "Input containing backslash escape sequences but no raw control characters is almost certainly already escaped, so it gets unescaped. Anything else gets escaped. You can override the choice.",
            },
            {
                q: "Does it handle Unicode and emoji correctly?",
                a: "Yes. Escaping goes through the engine's own string serializer, so surrogate pairs, combining characters and control characters are handled exactly as a compliant parser expects.",
            },
            {
                q: "Why does my escaped output still contain backslashes after unescaping?",
                a: "Because the payload was escaped more than once — a common outcome when a JSON string is logged into another JSON document. Run unescape again for each layer.",
            },
        ],
    },

    // --------------------------------------------------------------- Transform
    {
        id: "flatten",
        slug: "json-flatten",
        name: "Flatten",
        group: "Transform",
        icon: "Layers",
        heading: "JSON Flatten & Unflatten",
        title: "JSON Flatten / Unflatten — Nested to Dotted Paths",
        description:
            "Flatten nested JSON into single-level dotted paths, or rebuild nested structure from flat paths. Configurable delimiter and array notation, lossless round trip.",
        keywords: ["json flatten", "flatten json", "unflatten json", "nested json to flat", "json dot notation", "json to key value"],
        summary: "Nested structure to single-level dotted paths, and losslessly back again.",
        chips: ["Round trips", "Custom delimiter", PRIVATE],
        answer:
            "Flattening JSON converts nested structure into a single level of dotted paths such as user.address.city — the shape that config systems, environment variables and spreadsheets expect. Unflattening rebuilds the nesting. JSONic preserves empty objects and arrays, so the round trip returns exactly what you started with.",
        about:
            "Flattening turns nested structure into one level of dotted paths — the shape environment variables, feature flags, i18n catalogues and spreadsheet columns all want. Unflatten reverses it, rebuilding objects and arrays from the path segments. The delimiter and array notation are configurable, and empty objects and arrays are preserved so the round trip returns exactly what you started with.",
        faq: [
            {
                q: "Is the round trip lossless?",
                a: "Yes, provided your keys do not themselves contain the delimiter. Empty objects and arrays are preserved as leaf values rather than dropped, which is where most flatten implementations lose data.",
            },
            {
                q: "How are array indices represented?",
                a: "Either as another path segment (items.0.name) or in bracket notation (items[0].name). Bracket notation is unambiguous when keys can be numeric; dotted is more common in config systems.",
            },
            {
                q: "What if a key contains a dot?",
                a: "Change the delimiter to something absent from your keys — a slash or a double colon. With the default dot, a key containing a dot will be split on unflatten and the round trip will not be exact.",
            },
        ],
    },
    {
        id: "merge",
        slug: "json-merge",
        name: "Merge & Patch",
        group: "Transform",
        icon: "GitMerge",
        heading: "JSON Merge & Patch",
        title: "JSON Merge, Merge Patch & JSON Patch Generator",
        description:
            "Deep-merge two JSON documents, or generate the RFC 7386 merge patch or RFC 6902 JSON Patch that transforms one into the other.",
        keywords: ["json merge", "deep merge json", "json patch", "rfc 6902", "json merge patch", "rfc 7386", "json diff patch"],
        summary: "Deep-merge two documents, or generate the RFC 7386 or RFC 6902 patch between them.",
        chips: ["RFC 6902", "RFC 7386", PRIVATE],
        answer:
            "JSONic performs three operations on a pair of JSON documents: a deep merge that combines them, an RFC 7386 merge patch that uses null to signal a deletion, and an RFC 6902 JSON Patch listing explicit add, remove and replace operations with correctly escaped JSON Pointers.",
        about:
            "Three related operations on a pair of documents. Deep merge combines them, with the right-hand document winning on conflicts and arrays replaced rather than concatenated. Merge patch (RFC 7386) produces the compact diff you would PATCH to an API, using null to mean deletion. JSON Patch (RFC 6902) produces the explicit add/remove/replace operation list, with correctly escaped JSON Pointers.",
        faq: [
            {
                q: "When should I use JSON Patch rather than merge patch?",
                a: "Merge patch is smaller and easier to read, but it cannot express setting a value to null, and it replaces arrays wholesale. JSON Patch can express both, and is what you want when the target API declares application/json-patch+json.",
            },
            {
                q: "Why are arrays replaced rather than merged?",
                a: "Because merging them requires guessing whether elements are identities or positions. Replacing is predictable, and is what RFC 7386 specifies. For element-level changes, use the JSON Patch output, which addresses array indices individually.",
            },
            {
                q: "Are JSON Pointer special characters handled?",
                a: "Yes — keys containing / or ~ are escaped as ~1 and ~0 in the generated pointers, as the specification requires.",
            },
        ],
    },
    {
        id: "base64",
        slug: "json-base64",
        name: "Base64",
        group: "Transform",
        icon: "Binary",
        heading: "JSON Base64 Encode & Decode",
        title: "JSON to Base64 — Encode & Decode Online",
        description:
            "Encode JSON to base64 or decode base64 back to JSON, UTF-8 safe and with base64url support for tokens and URL parameters.",
        keywords: ["json to base64", "base64 to json", "base64 encode json", "decode base64 json", "base64url"],
        summary: "UTF-8 safe base64 in both directions, including the URL-safe alphabet.",
        chips: ["UTF-8 safe", "base64url", PRIVATE],
        answer:
            "Base64 encodes JSON as opaque text that survives URLs, headers and QR codes. JSONic encodes and decodes both the standard and URL-safe alphabets and handles the full Unicode range, unlike encoders built on btoa alone, which throw on any character above U+00FF.",
        about:
            "Base64 is how JSON travels through places that only accept opaque text: URL parameters, headers, QR codes, embedded config. This encodes and decodes both the standard and URL-safe alphabets, and handles the whole Unicode range correctly — btoa alone throws on any character above U+00FF, which is why so many hand-rolled encoders break on the first emoji or accented name.",
        faq: [
            {
                q: "What is base64url and when do I need it?",
                a: "A variant that replaces + and / with - and _ and drops the = padding, so the result is safe in URLs and filenames. JWTs use it. Decoding here accepts either alphabet automatically.",
            },
            {
                q: "Why do other tools fail on my JSON?",
                a: "They call btoa directly, which only accepts characters up to U+00FF and throws on anything else. This encodes to UTF-8 bytes first, so any valid string works.",
            },
            {
                q: "Is base64 a form of encryption?",
                a: "No. It is an encoding, fully reversible by anyone. It hides nothing — never use it to protect a secret.",
            },
        ],
    },
    {
        id: "jwt",
        slug: "jwt-decoder",
        name: "JWT Decoder",
        group: "Transform",
        icon: "KeyRound",
        heading: "JWT Decoder",
        title: "JWT Decoder — Decode JSON Web Tokens Online",
        description:
            "Decode a JWT's header and payload, with exp, iat and nbf rendered as readable dates and expiry flagged. Decode only — no signature verification, no secret required.",
        keywords: ["jwt decoder", "decode jwt", "jwt parser", "json web token decoder", "jwt claims", "jwt expiry"],
        summary: "Decode a token's header and claims, with timestamps and expiry made readable.",
        chips: ["Claim dates", "Expiry check", "No secret"],
        answer:
            "A JWT decoder reads the header and payload of a JSON Web Token without verifying its signature. JSONic renders the exp, iat and nbf claims as readable dates and flags expired tokens. Verification is deliberately omitted, because it requires your signing secret, which should never be pasted into a web form.",
        about:
            "Paste a JSON Web Token to read its header and payload. Registered time claims — exp, iat, nbf — are rendered as ISO timestamps with a relative description, and an expired token is flagged. Decoding is deliberate: this tool does not verify the signature, because verification needs your signing secret and pasting a production secret into a web form is a habit worth not forming. Verify in your own code, where the key already lives.",
        faq: [
            {
                q: "Why does this not verify the signature?",
                a: "Verification requires the signing key. Asking for a production secret in a browser form normalises a genuinely bad practice, whatever the page promises about staying client-side. Decode here to read the claims; verify in your service, where the key belongs.",
            },
            {
                q: "Is the token sent anywhere?",
                a: "No. It is split and base64url-decoded in your browser. That said, a JWT is a credential — treat one pasted anywhere as potentially compromised, and prefer expired or test tokens when debugging.",
            },
            {
                q: "What do exp, iat and nbf mean?",
                a: "Expiry, issued-at and not-before, all as seconds since the Unix epoch — not milliseconds, which is the most common source of tokens that appear to expire in 1970 or in the year 55000.",
            },
        ],
    },

    // ----------------------------------------------------------------- Convert
    {
        id: "csv",
        slug: "json-to-csv",
        name: "To CSV",
        group: "Convert",
        icon: "Table",
        heading: "JSON to CSV",
        title: "JSON to CSV Converter — Free Online",
        description:
            "Convert JSON to CSV in the browser. Nested objects and arrays are flattened into dotted columns, columns are the union of all records, and values are quoted per RFC 4180.",
        keywords: ["json to csv", "convert json to csv", "json to excel", "json to spreadsheet", "json csv converter"],
        summary: "Records to rows, with nested structure flattened into dotted columns.",
        chips: ["RFC 4180", "Nested keys", PRIVATE],
        answer:
            "Converting JSON to CSV turns records into rows. JSONic flattens nested objects into dotted column names, takes the union of every record's keys as the column set so that missing fields become empty cells rather than shifted columns, and quotes values according to RFC 4180.",
        about:
            "Spreadsheets want a rectangle; JSON is a tree. This flattens each record into dotted paths, takes the union of every record's keys as the column set so records with missing fields get empty cells rather than shifted columns, and quotes any value containing a comma, quote or newline as RFC 4180 requires.",
        faq: [
            {
                q: "How is nested JSON turned into columns?",
                a: "Each record is flattened into dotted paths, so { user: { name: 'a' } } becomes a user.name column. Nested arrays become indexed columns such as tags.0 and tags.1.",
            },
            {
                q: "What happens when records have different keys?",
                a: "Columns are the union of every record's keys, in first-seen order, and missing values become empty cells. No record is silently truncated to match the first one.",
            },
            {
                q: "Will it open correctly in Excel?",
                a: "Yes for standard cases. Excel does apply its own type coercion on open — long digit strings can become scientific notation — so import as text if you have identifiers that must survive intact.",
            },
        ],
    },
    {
        id: "yaml",
        slug: "json-to-yaml",
        name: "To YAML",
        group: "Convert",
        icon: "AlignJustify",
        heading: "JSON to YAML",
        title: "JSON to YAML Converter — Free Online",
        description:
            "Convert JSON to YAML in the browser, with correct quoting for values YAML would otherwise reinterpret as booleans, numbers or null.",
        keywords: ["json to yaml", "convert json to yaml", "json yaml converter", "yaml from json", "json to yml"],
        summary: "Readable YAML, with the ambiguous values quoted so nothing changes meaning.",
        chips: ["Safe quoting", "Config ready", PRIVATE],
        answer:
            "Converting JSON to YAML produces the format configuration files use. The risk is YAML's type coercion: no, on and off are read as booleans. JSONic quotes any string that would change meaning and emits empty collections explicitly as [] and {} rather than leaving a bare key.",
        about:
            "YAML is what config files want. The risk in converting to it is YAML's type coercion: the strings no, on, off and y are read as booleans, and 1.20 loses its trailing zero. This quotes anything that would change meaning, and emits empty collections explicitly as [] and {} rather than leaving a key with nothing after it.",
        faq: [
            {
                q: "Which values get quoted, and why?",
                a: "Strings that YAML 1.1 would read as booleans (yes, no, on, off, y, n, true, false), as null, or as a number. Without quoting, a country code of NO becomes the boolean false — a genuinely well-known source of production incidents.",
            },
            {
                q: "Is the output safe to use as Kubernetes or CI config?",
                a: "Yes for the data itself. Those systems expect specific top-level schemas, so the conversion gives you correct YAML, not a valid manifest.",
            },
            {
                q: "Can I convert YAML back to JSON here?",
                a: "Not yet. A YAML parser that quietly mishandles anchors, multi-line scalars or type coercion would be worse than not offering one, so that direction is waiting on a vetted parser.",
            },
        ],
    },
    {
        id: "xml",
        slug: "json-to-xml",
        name: "To XML",
        group: "Convert",
        icon: "FileCode2",
        heading: "JSON to XML",
        title: "JSON to XML Converter — Free Online",
        description:
            "Convert JSON to XML in the browser, with keys sanitised into valid element names, arrays as repeated elements and text content properly escaped.",
        keywords: ["json to xml", "convert json to xml", "json xml converter", "xml from json"],
        summary: "Elements from keys, repeated tags for arrays, everything correctly escaped.",
        chips: ["Valid names", "Escaped text", PRIVATE],
        answer:
            "Converting JSON to XML maps object keys to element names and array items to repeated elements. JSONic sanitises names XML does not permit, escapes text content for the five predefined entities, and marks nulls with nil=\"true\". The transformation is one-way, so treat the XML as an export rather than a round trip.",
        about:
            "XML is still what a lot of enterprise and legacy systems accept. Keys become element names with invalid characters replaced, since XML names cannot start with a digit or contain spaces. Array elements are wrapped in repeated item tags, null becomes an element with nil=\"true\", and text content is escaped for the five predefined entities.",
        faq: [
            {
                q: "What happens to keys that are not valid XML names?",
                a: "Characters XML does not allow in a name become underscores, and a leading digit gets an underscore prefix. The transformation is not reversible, so treat the XML as an export rather than a round-trip format.",
            },
            {
                q: "How are arrays represented?",
                a: "As repeated <item> elements inside an element named after the key. XML has no array type, so this is the conventional encoding.",
            },
            {
                q: "Are attributes ever produced?",
                a: "No — everything becomes elements, apart from nil=\"true\" on nulls. JSON carries no distinction between what should be an attribute and what should be an element, so guessing would produce inconsistent output.",
            },
        ],
    },
    {
        id: "csv-to-json",
        slug: "csv-to-json",
        name: "CSV to JSON",
        group: "Convert",
        icon: "FileInput",
        heading: "CSV to JSON",
        title: "CSV to JSON Converter — Free Online",
        description:
            "Convert CSV to JSON in the browser. RFC 4180 parsing handles quoted fields, escaped quotes and embedded newlines, with optional type inference.",
        keywords: ["csv to json", "convert csv to json", "csv json converter", "csv parser online", "excel to json"],
        summary: "Rows to records, with proper handling of quotes, newlines and delimiters.",
        chips: ["RFC 4180", "Type inference", PRIVATE],
        answer:
            "Converting CSV to JSON turns rows into records. JSONic uses an RFC 4180 parser, so quoted fields, doubled quotes and newlines inside values all parse correctly. Type inference is deliberately conservative: 01234 stays a string, because leading zeros almost always indicate an identifier rather than a number.",
        about:
            "Most CSV-to-JSON converters split on commas, which breaks the moment a field contains one. This uses a real RFC 4180 parser: quoted fields, doubled quotes inside them, and newlines inside quoted values are all handled. Type inference is optional and deliberately conservative — it will not turn a zip code of 01234 into the number 1234.",
        faq: [
            {
                q: "Does it handle commas and newlines inside fields?",
                a: "Yes. Quoted fields are parsed properly, including doubled quotes as an escaped quote and literal newlines inside a quoted value.",
            },
            {
                q: "What does type inference convert?",
                a: "Plain integers and decimals, true, false, null, and empty cells to null. Numbers with leading zeros are left as strings, because those are almost always identifiers rather than quantities.",
            },
            {
                q: "Can I use tabs or semicolons as the delimiter?",
                a: "Yes — the delimiter is configurable, so TSV and semicolon-separated exports from European locales both work.",
            },
        ],
    },
    {
        id: "ndjson",
        slug: "json-to-ndjson",
        name: "NDJSON",
        group: "Convert",
        icon: "AlignJustify",
        heading: "JSON to NDJSON",
        title: "JSON to NDJSON / JSON Lines Converter",
        description:
            "Convert a JSON array to newline-delimited JSON, or parse NDJSON back into an array. Errors report the failing line number.",
        keywords: ["json to ndjson", "ndjson to json", "json lines", "jsonl converter", "newline delimited json"],
        summary: "Array to one document per line, and back — with per-line error reporting.",
        chips: ["Both ways", "Line errors", PRIVATE],
        answer:
            "NDJSON, also called JSON Lines or JSONL, puts one compact JSON document on each line. Log pipelines, BigQuery and Elasticsearch bulk endpoints expect it, because a reader can process a line at a time without loading the whole file. JSONic converts both directions and reports the failing line number.",
        about:
            "NDJSON — also called JSON Lines or JSONL — puts one compact document per line. It is what log pipelines, BigQuery, Elasticsearch bulk endpoints and streaming APIs expect, because a consumer can process each line without holding the whole file in memory. Converting back reports the exact line that failed rather than a byte offset into a multi-megabyte file.",
        faq: [
            {
                q: "When is NDJSON better than a JSON array?",
                a: "Whenever the data is a stream or is too large to hold in memory. A reader can consume one line at a time, and a writer can append without rewriting a closing bracket.",
            },
            {
                q: "What is the difference between NDJSON, JSONL and JSON Lines?",
                a: "In practice, nothing — three names for the same convention. NDJSON has a slightly stricter specification about line separators, but every common tool treats them interchangeably.",
            },
            {
                q: "Are blank lines allowed?",
                a: "They are skipped when parsing. Every non-blank line must be a complete JSON document on its own.",
            },
        ],
    },
    {
        id: "sql",
        slug: "json-to-sql",
        name: "To SQL",
        group: "Convert",
        icon: "Database",
        heading: "JSON to SQL",
        title: "JSON to SQL — Generate CREATE TABLE and INSERT Statements",
        description:
            "Turn JSON records into SQL: a CREATE TABLE with inferred column types and batched INSERT statements, for PostgreSQL, MySQL or SQLite.",
        keywords: ["json to sql", "json to insert statement", "json to create table", "json to postgres", "json to mysql"],
        summary: "CREATE TABLE with inferred types, plus batched INSERTs for three dialects.",
        chips: ["3 dialects", "Type inference", PRIVATE],
        answer:
            "Converting JSON to SQL produces a CREATE TABLE with column types inferred across every record, plus batched INSERT statements. JSONic supports PostgreSQL, MySQL and SQLite, widens a column to text when it holds mixed types, and marks a column nullable only where a null actually appears.",
        about:
            "Getting a JSON fixture into a database usually means writing the schema by hand. This infers column types across every record — widening to text when a column holds mixed types, marking columns nullable only when a null actually appears — and emits a CREATE TABLE plus INSERT statements in PostgreSQL, MySQL or SQLite syntax. Large arrays are batched rather than emitted as one enormous statement.",
        faq: [
            {
                q: "How are column types inferred?",
                a: "By widening across all records: integers stay integer only if no record has a decimal, and any string in the column makes the whole column text. Nested objects and arrays become JSONB, JSON or TEXT depending on dialect.",
            },
            {
                q: "Is the output safe against SQL injection?",
                a: "String literals are escaped by doubling single quotes, which is correct for literal values in all three dialects. It is still generated SQL from untrusted input — review it before running it against anything that matters, and prefer parameterised inserts for production loading.",
            },
            {
                q: "Why are INSERTs split into batches?",
                a: "A single INSERT with a hundred thousand rows exceeds server packet limits and is painful to debug. Statements are chunked at 1000 rows, which every dialect handles comfortably.",
            },
        ],
    },

    // ---------------------------------------------------------------- Generate
    {
        id: "typescript",
        slug: "json-to-typescript",
        name: "TypeScript",
        group: "Generate",
        icon: "Braces",
        heading: "JSON to TypeScript",
        title: "JSON to TypeScript — Generate Interfaces Online",
        description:
            "Turn a JSON sample into TypeScript interfaces. Merges every array element so heterogeneous arrays produce a type that compiles, and marks inconsistent keys optional.",
        keywords: ["json to typescript", "json to interface", "generate typescript types from json", "json to ts", "typescript type generator"],
        summary: "Interfaces inferred from every array element, not just the first one.",
        chips: ["Optional keys", "Nested types", INSTANT],
        answer:
            "Generating TypeScript from JSON produces interfaces matching a sample response. JSONic merges the shape of every array element rather than sampling only the first, so keys present in some objects but not others become optional properties instead of disappearing — the failure that makes most generated types unreliable.",
        about:
            "Paste a JSON response and get TypeScript interfaces for it. Rather than sampling only the first array element, JSONic merges the shape of every element, so keys that appear in some objects but not others come out as optional properties instead of silently disappearing — which is the failure mode that makes generated types worse than useless.",
        faq: [
            {
                q: "How are arrays of mixed objects handled?",
                a: "Every element is merged into a single shape. Keys missing from some elements are emitted as optional (key?: T) rather than dropped, so the type reflects what the data can actually contain.",
            },
            {
                q: "What happens to null values?",
                a: "A value that is null in the sample is typed as null, since the sample carries no information about what else it could be. Widen it by hand once you know the real type.",
            },
            {
                q: "Are nested interfaces named sensibly?",
                a: "They are named after their property in PascalCase, and de-duplicated with a numeric suffix if two different shapes would claim the same name.",
            },
        ],
        legacyHash: "types",
    },
    {
        id: "go",
        slug: "json-to-go",
        name: "Go",
        group: "Generate",
        icon: "Blocks",
        heading: "JSON to Go",
        title: "JSON to Go Struct — Generate Go Types Online",
        description:
            "Convert JSON into Go structs with correct json tags, int64/float64 inference, pointer types for inconsistent keys and omitempty where appropriate.",
        keywords: ["json to go", "json to go struct", "generate go struct from json", "golang json struct", "go type generator"],
        summary: "Idiomatic structs with json tags, and pointers where keys are inconsistent.",
        chips: ["json tags", "Pointer fields", INSTANT],
        answer:
            "Generating Go structs from JSON produces exported PascalCase fields with json tags preserving the original keys. JSONic chooses int64 or float64 depending on whether the sample value is integral, and uses pointer fields with omitempty for keys that are missing from some array elements.",
        about:
            "Paste JSON and get idiomatic Go structs: exported PascalCase field names, a json tag preserving the original key, int64 or float64 chosen by whether the sample value is integral, and pointer types with omitempty for keys that only appear in some array elements.",
        faq: [
            {
                q: "Why int64 rather than int?",
                a: "JSON numbers have no declared width, and int is platform-sized. int64 decodes any integral JSON number identically on every architecture.",
            },
            {
                q: "When does a field become a pointer?",
                a: "When the key was missing from at least one element of an array of objects. A pointer plus omitempty lets you distinguish absent from zero-valued, which matters when the zero value is meaningful.",
            },
            {
                q: "How are keys that are not valid Go identifiers handled?",
                a: "They are converted to PascalCase with non-word characters removed, and the original key is preserved verbatim in the json tag, so decoding still matches.",
            },
        ],
    },
    {
        id: "python",
        slug: "json-to-python",
        name: "Python",
        group: "Generate",
        icon: "Code2",
        heading: "JSON to Python",
        title: "JSON to Python Dataclass — Generate Types Online",
        description:
            "Convert JSON into Python dataclasses or TypedDicts, with Optional types for inconsistent keys and snake_case field names that keep the original key in a comment.",
        keywords: ["json to python", "json to dataclass", "json to typeddict", "python type generator", "json to python class"],
        summary: "Dataclasses or TypedDicts, with Optional where the sample is inconsistent.",
        chips: ["Dataclass", "TypedDict", INSTANT],
        answer:
            "Generating Python types from JSON produces dataclasses or TypedDicts. JSONic converts field names to snake_case and keeps the original key in a comment, and marks keys absent from some array elements as Optional with a None default so the generated class stays constructible.",
        about:
            "Paste JSON and get Python type definitions. Dataclasses give you runtime objects with constructors; TypedDicts describe the dict shape without changing how you access it, which suits code that already passes parsed JSON around. Field names are converted to snake_case with the original key kept in a comment, and keys missing from some array elements become Optional with a None default.",
        faq: [
            {
                q: "Dataclass or TypedDict — which should I choose?",
                a: "TypedDict when you keep working with the parsed dict and just want type checking. Dataclass when you want real objects with attribute access and a constructor, and are willing to write the conversion step.",
            },
            {
                q: "Why do optional fields default to None?",
                a: "Dataclasses require that any field with a default comes after fields without one. Defaulting optional fields to None keeps the generated class constructible without reordering your data.",
            },
            {
                q: "Do the snake_case names still match my JSON keys?",
                a: "Not automatically — dataclasses do not rename on deserialization. The original key is kept in a trailing comment so you can wire up a mapping, or use pydantic's alias support if you need it enforced.",
            },
        ],
    },
    {
        id: "rust",
        slug: "json-to-rust",
        name: "Rust",
        group: "Generate",
        icon: "Shapes",
        heading: "JSON to Rust",
        title: "JSON to Rust Struct — Generate serde Types Online",
        description:
            "Convert JSON into Rust structs with serde derives, Option<T> for inconsistent keys, and serde rename attributes where the Rust identifier differs from the JSON key.",
        keywords: ["json to rust", "json to serde struct", "rust struct from json", "serde derive generator", "rust type generator"],
        summary: "serde-ready structs, with rename attributes wherever the identifier differs.",
        chips: ["serde derive", "Option<T>", INSTANT],
        answer:
            "Generating Rust structs from JSON produces serde-annotated types. JSONic converts fields to snake_case and adds a serde rename wherever the Rust identifier differs from the JSON key, so deserialization still matches. Keys missing from some array elements become Option<T>.",
        about:
            "Paste JSON and get Rust structs annotated for serde. Field names are converted to snake_case, and any key whose Rust identifier differs gets an explicit serde rename so deserialization still matches. Keys absent from some array elements become Option<T>, and integral numbers map to i64 with non-integral falling back to f64.",
        faq: [
            {
                q: "Why is a serde rename attribute emitted?",
                a: "Because Rust field names are snake_case by convention but JSON keys often are not. Without the rename, serde would look for a key that does not exist. An explicit per-field rename is more predictable than a container-level rename_all when key styles are mixed.",
            },
            {
                q: "What about numbers that do not fit in i64?",
                a: "They will not round-trip. JSON has no integer width, so a value beyond i64 needs u64 or a big-number type chosen by hand — check the range if your ids come from a system that uses unsigned 64-bit values.",
            },
            {
                q: "Does the output compile as-is?",
                a: "It needs serde with the derive feature in Cargo.toml, and serde_json if any field fell back to serde_json::Value. The struct definitions themselves are complete.",
            },
        ],
    },
    {
        id: "java",
        slug: "json-to-java",
        name: "Java",
        group: "Generate",
        icon: "Coffee",
        heading: "JSON to Java",
        title: "JSON to Java Record or POJO — Generate Classes Online",
        description:
            "Convert JSON into Java records or POJOs with Jackson JsonProperty annotations, boxed types for nullable fields and nested types for nested objects.",
        keywords: ["json to java", "json to pojo", "json to java record", "jackson class generator", "java class from json"],
        summary: "Records or POJOs with Jackson annotations and boxed types where nullable.",
        chips: ["Records", "Jackson", INSTANT],
        answer:
            "Generating Java types from JSON produces records or traditional POJOs with Jackson JsonProperty annotations preserving the original key names. JSONic uses boxed types for fields that can be absent, so a missing value deserializes to null rather than silently becoming zero.",
        about:
            "Paste JSON and get Java type definitions. Records give you immutable carriers in a few lines; the POJO mode emits the traditional private fields with getters and setters for frameworks that require them. Jackson JsonProperty annotations preserve the original key names, and fields that can be absent use boxed types so null is representable.",
        faq: [
            {
                q: "Record or POJO?",
                a: "Records for anything Java 16 or later that just carries data — they are immutable and far shorter. POJOs when a framework requires a no-argument constructor and mutable setters, which some older ORM and bean-binding stacks still do.",
            },
            {
                q: "Why are some fields boxed (Long rather than long)?",
                a: "Primitives cannot be null. Any field that was missing from some array elements is boxed so an absent value deserializes to null rather than silently becoming zero.",
            },
            {
                q: "Does this work with Gson instead of Jackson?",
                a: "The structure does; the annotations do not. Replace @JsonProperty with @SerializedName and the classes work unchanged.",
            },
        ],
    },
    {
        id: "csharp",
        slug: "json-to-csharp",
        name: "C#",
        group: "Generate",
        icon: "Hash",
        heading: "JSON to C#",
        title: "JSON to C# Class — Generate Types Online",
        description:
            "Convert JSON into C# classes with System.Text.Json JsonPropertyName attributes, nullable reference types for inconsistent keys and nested class generation.",
        keywords: ["json to csharp", "json to c# class", "generate c# class from json", "system.text.json generator", "json to dotnet"],
        summary: "Classes with System.Text.Json attributes and nullable annotations.",
        chips: ["System.Text.Json", "Nullable", INSTANT],
        answer:
            "Generating C# classes from JSON produces auto-properties with System.Text.Json JsonPropertyName attributes preserving the original keys. JSONic annotates properties that can be absent as nullable, so the classes compile cleanly under nullable reference types. Swap the attribute for JsonProperty to use Newtonsoft instead.",
        about:
            "Paste JSON and get C# classes ready for System.Text.Json. Property names become PascalCase with a JsonPropertyName attribute preserving the original key, and keys absent from some array elements are annotated nullable so they work under nullable reference types rather than producing warnings.",
        faq: [
            {
                q: "Does this target System.Text.Json or Newtonsoft?",
                a: "System.Text.Json, the built-in serializer since .NET Core 3.0. For Newtonsoft.Json, swap JsonPropertyName for JsonProperty — the class structure is identical.",
            },
            {
                q: "Will it work with nullable reference types enabled?",
                a: "Yes. Properties that can be absent are annotated with ?, so the compiler does not warn about uninitialised non-nullable members.",
            },
            {
                q: "Are properties or fields generated?",
                a: "Auto-properties with get and set, which is what System.Text.Json binds to by default. Fields require explicit configuration to be serialized at all.",
            },
        ],
    },
    {
        id: "kotlin",
        slug: "json-to-kotlin",
        name: "Kotlin",
        group: "Generate",
        icon: "Boxes",
        heading: "JSON to Kotlin",
        title: "JSON to Kotlin Data Class — Generate Types Online",
        description:
            "Convert JSON into Kotlin data classes with kotlinx.serialization annotations, nullable types for inconsistent keys and SerialName where the property name differs.",
        keywords: ["json to kotlin", "json to data class", "kotlin data class from json", "kotlinx serialization generator"],
        summary: "Data classes with kotlinx.serialization annotations and nullable types.",
        chips: ["Data class", "kotlinx", INSTANT],
        answer:
            "Generating Kotlin types from JSON produces data classes annotated for kotlinx.serialization. JSONic adds SerialName wherever the camelCase property differs from the JSON key, and gives keys missing from some array elements a nullable type with a null default so decoding does not fail.",
        about:
            "Paste JSON and get Kotlin data classes annotated for kotlinx.serialization. Property names become camelCase with a SerialName annotation wherever they differ from the JSON key, and keys absent from some array elements become nullable with a null default so deserialization does not fail on incomplete records.",
        faq: [
            {
                q: "Does this work with Moshi or Gson?",
                a: "The data classes do. Replace @Serializable and @SerialName with @JsonClass and @Json for Moshi, or @SerializedName for Gson.",
            },
            {
                q: "Why do nullable properties get a null default?",
                a: "kotlinx.serialization throws on a missing field unless the property has a default. A null default makes absent keys decode cleanly instead of failing the whole payload.",
            },
            {
                q: "Are Long or Int used for numbers?",
                a: "Long for integral values, since JSON numbers have no declared width and a 64-bit id would silently overflow an Int.",
            },
        ],
    },
    {
        id: "zod",
        slug: "json-to-zod",
        name: "Zod",
        group: "Generate",
        icon: "Gem",
        heading: "JSON to Zod",
        title: "JSON to Zod Schema — Generate Validators Online",
        description:
            "Convert JSON into Zod schemas with optional fields for inconsistent keys, integer detection, and an inferred TypeScript type exported alongside.",
        keywords: ["json to zod", "zod schema generator", "generate zod from json", "zod from json sample", "typescript runtime validation"],
        summary: "Zod schemas plus the inferred TypeScript type, from a sample document.",
        chips: ["z.infer type", "Optional keys", INSTANT],
        answer:
            "Generating a Zod schema from JSON gives you runtime validation and a static TypeScript type from a single definition. JSONic extracts nested objects into named schemas, detects integers, marks inconsistent keys optional, and exports the inferred type so the schema remains the single source of truth.",
        about:
            "Zod gives you runtime validation and a static type from one definition, which is why it has become the default way to validate API boundaries in TypeScript. Paste a sample response to get the schema, with nested objects extracted into their own named schemas, integers detected as z.number().int(), and the inferred type exported alongside so you never define the shape twice.",
        faq: [
            {
                q: "Which Zod version does this target?",
                a: "Zod 3 syntax, which Zod 4 also accepts for everything generated here.",
            },
            {
                q: "Should I use the generated schema as-is?",
                a: "As a starting point. A sample cannot tell you that an email field must be an email or that a quantity must be positive — add .email(), .min(), .uuid() and the rest where you know the real constraints. That refinement is the whole point of runtime validation.",
            },
            {
                q: "Why is the inferred type exported too?",
                a: "So the schema is the single source of truth. z.infer keeps the static type in step with the validator automatically, instead of leaving you to maintain a duplicate interface.",
            },
        ],
    },
    {
        id: "schema",
        slug: "json-schema-generator",
        name: "JSON Schema",
        group: "Generate",
        icon: "FileJson2",
        heading: "JSON Schema Generator",
        title: "JSON Schema Generator — Infer Draft 2020-12 Schema",
        description:
            "Generate a JSON Schema (draft 2020-12) from a sample document, with integer versus number inference and required keys derived from the sample.",
        keywords: ["json schema generator", "generate json schema", "json to schema", "infer json schema", "json schema from example"],
        summary: "A draft 2020-12 schema inferred from a sample, ready to refine.",
        chips: ["Draft 2020-12", "Merged arrays", INSTANT],
        answer:
            "Generating a JSON Schema from a sample produces a draft 2020-12 document describing the data's types and required keys. JSONic merges array element shapes into one items schema and distinguishes integer from number. Treat it as a starting point and relax what the sample could not tell it.",
        about:
            "Paste a representative JSON document to get a draft 2020-12 schema for it: object properties with their types, arrays typed from their merged element shape, and integer distinguished from number where the sample allows it. Use it as a starting point for contract tests and request validation, then relax the required list and widen types where the sample was incomplete.",
        faq: [
            {
                q: "Why is every key marked required?",
                a: "The sample is the only evidence available, so every key present is marked required. Remove the ones that are genuinely optional in your API — a generated schema that is too strict is at least easy to loosen.",
            },
            {
                q: "How are arrays typed?",
                a: "Element shapes are merged into a single items schema, so an array of similar-but-not-identical objects yields one usable schema rather than a positional tuple.",
            },
            {
                q: "Which draft is emitted?",
                a: "Draft 2020-12, declared through the $schema keyword. Most current validators — Ajv, python-jsonschema, everit — support it.",
            },
        ],
    },
];

export const TOOL_GROUPS: ToolGroup[] = ["Inspect", "Format", "Transform", "Convert", "Generate"];

export function toolBySlug(slug: string): Tool | undefined {
    return TOOLS.find((tool) => tool.slug === slug);
}

export function toolsInGroup(group: ToolGroup): Tool[] {
    return TOOLS.filter((tool) => tool.group === group);
}

export function toolUrl(tool: Tool): string {
    return `${SITE_URL}/${tool.slug}`;
}

/** Old single-page hash -> new route, used by the client-side redirect shim. */
export const LEGACY_HASH_MAP: Record<string, string> = Object.fromEntries(
    TOOLS.filter((tool) => tool.legacyHash).map((tool) => [tool.legacyHash!, `/${tool.slug}`]),
);
