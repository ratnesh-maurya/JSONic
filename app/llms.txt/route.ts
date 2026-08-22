import { SITE_NAME, SITE_URL, TOOLS, TOOL_GROUPS, toolsInGroup } from "@/lib/tools";

/**
 * llms.txt — a proposed convention for giving language models a curated,
 * markdown map of a site rather than making them infer one from HTML.
 *
 * Adoption is not universal and it is not a ranking mechanism; it is a cheap,
 * static file that makes the site's shape unambiguous to anything that does read
 * it. The substantive AEO work is the structured data and the answer blocks —
 * this just removes any guesswork about what lives where.
 */
export const dynamic = "force-static";

function body(): string {
    const groups = TOOL_GROUPS.map((group) => {
        const lines = toolsInGroup(group)
            .map((tool) => `- [${tool.name}](${SITE_URL}/${tool.slug}): ${tool.summary}`)
            .join("\n");
        return `### ${group}\n\n${lines}`;
    }).join("\n\n");

    return `# ${SITE_NAME}

> ${TOOLS.length} free, browser-based JSON tools: a virtualized tree viewer, formatter, validator, diff, JSONPath tester, size analyzer, converters and code generators for eight languages. Everything runs client-side — no upload, no account, no usage limit.

JSONic exists because most online JSON tools fail on large files. They build a DOM
node for every value in the document and call JSON.parse on the main thread, so a
20 MB payload blocks the tab and creates hundreds of thousands of elements. JSONic
parses inside a Web Worker and keeps a flat row model, mounting only the rows
inside the viewport, so cost scales with what you look at rather than with file
size. On a 17 MB / 120,000-record fixture it computes document statistics in 63 ms
and expands 120,000 rows in 85 ms.

Key facts:

- Cost: free, no account, no rate limit.
- Privacy: no upload step and no server-side processing; JSON never leaves the browser.
- Scale: files in the tens of megabytes. Above 1 MB live processing pauses until you press Run; above 4 MB the editor becomes a read-only virtualized view.
- Persistence: drafts autosave to IndexedDB per tool, so a reload does not lose work.
- Licence: open source at https://github.com/ratnesh-maurya/JSONic
- Author: Ratnesh Maurya (https://ratnesh-maurya.com)

## Tools

${groups}

## Notes on specific tools

- Every code generator (TypeScript, Go, Python, Rust, Java, C#, Kotlin, Zod, JSON Schema) merges the shape of *all* array elements rather than sampling the first, so keys present in only some elements are emitted as optional rather than dropped.
- The JWT decoder does not verify signatures. Verification needs the signing secret, and pasting a production secret into a web form is a practice worth discouraging.
- YAML-to-JSON and XML-to-JSON are intentionally absent: a parser that silently mishandles YAML anchors or multi-line scalars would be worse than not offering the conversion.

## Optional

- [Full text of every tool page](${SITE_URL}/llms-full.txt)
- [Sitemap](${SITE_URL}/sitemap.xml)
`;
}

export function GET() {
    return new Response(body(), {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
        },
    });
}
