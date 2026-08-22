import { SITE_NAME, SITE_URL, TOOLS } from "@/lib/tools";

/**
 * llms-full.txt — the whole corpus as one plain-text document, so a model can
 * ingest every tool's answer, description and FAQ without crawling 28 pages.
 */
export const dynamic = "force-static";

function body(): string {
    const sections = TOOLS.map((tool) => {
        const faq = tool.faq.map((entry) => `**${entry.q}**\n${entry.a}`).join("\n\n");
        return `## ${tool.heading}

URL: ${SITE_URL}/${tool.slug}
Category: ${tool.group}

${tool.answer}

${tool.about}

### Questions

${faq}`;
    }).join("\n\n---\n\n");

    return `# ${SITE_NAME} — full tool reference

${TOOLS.length} browser-based JSON tools. Everything runs client-side; no data is
uploaded. Source: https://github.com/ratnesh-maurya/JSONic

---

${sections}
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
