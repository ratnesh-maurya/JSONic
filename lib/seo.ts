import type { Metadata } from "next";
import { SITE_NAME, SITE_URL, TOOLS, type Tool } from "./tools";

export const AUTHOR = {
    name: "Ratnesh Maurya",
    url: "https://ratnesh-maurya.com",
    twitter: "@ratnesh_maurya_",
    github: "https://github.com/ratnesh-maurya",
} as const;

/**
 * Per-tool metadata.
 *
 * og:image and twitter:image are NOT set here — each route has an
 * `opengraph-image.tsx`, and Next injects og:image, its dimensions, its alt and
 * the matching twitter:image automatically from that file. Setting them here as
 * well would emit duplicate tags that crawlers resolve inconsistently.
 */
export function toolMetadata(tool: Tool): Metadata {
    const url = `${SITE_URL}/${tool.slug}`;

    return {
        title: tool.title,
        description: tool.description,
        keywords: tool.keywords,
        alternates: { canonical: url },
        openGraph: {
            type: "website",
            locale: "en_US",
            url,
            siteName: SITE_NAME,
            title: tool.title,
            description: tool.description,
        },
        twitter: {
            card: "summary_large_image",
            title: tool.title,
            description: tool.description,
            site: AUTHOR.twitter,
            creator: AUTHOR.twitter,
        },
        other: {
            // read by some answer engines and readability extractors as a
            // pre-extracted summary of the page's purpose
            "article:author": AUTHOR.name,
        },
    };
}

/**
 * Structured data for a tool page.
 *
 * Types chosen for answer-engine extraction rather than rich results: FAQ and
 * HowTo rich results are both retired, but Organization, SoftwareApplication,
 * FAQPage, TechArticle and BreadcrumbList are still parsed to understand a page
 * and are the shapes AI search systems read. They are emitted as one connected
 * @graph so the entities reference each other rather than floating free.
 */
export function toolJsonLd(tool: Tool) {
    const url = `${SITE_URL}/${tool.slug}`;

    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "SoftwareApplication",
                "@id": `${url}#app`,
                name: `${tool.name} — ${SITE_NAME}`,
                alternateName: tool.heading,
                url,
                applicationCategory: "DeveloperApplication",
                applicationSubCategory: "JSON utility",
                operatingSystem: "Any (web browser)",
                description: tool.answer,
                abstract: tool.summary,
                featureList: tool.chips,
                keywords: tool.keywords.join(", "),
                offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
                isAccessibleForFree: true,
                browserRequirements: "Requires JavaScript",
                permissions: "No data leaves the browser",
                author: { "@id": `${SITE_URL}/#person` },
                publisher: { "@id": `${SITE_URL}/#person` },
                isPartOf: { "@id": `${SITE_URL}/#website` },
            },
            {
                // the page itself, carrying the direct answer as its description
                "@type": "TechArticle",
                "@id": `${url}#article`,
                headline: tool.heading,
                description: tool.answer,
                url,
                inLanguage: "en",
                isPartOf: { "@id": `${SITE_URL}/#website` },
                author: { "@id": `${SITE_URL}/#person` },
                proficiencyLevel: "Beginner",
                dependencies: "A modern web browser",
                about: { "@id": `${url}#app` },
            },
            {
                "@type": "FAQPage",
                "@id": `${url}#faq`,
                mainEntity: tool.faq.map((entry) => ({
                    "@type": "Question",
                    name: entry.q,
                    acceptedAnswer: { "@type": "Answer", text: entry.a },
                })),
            },
            {
                "@type": "BreadcrumbList",
                "@id": `${url}#breadcrumb`,
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
                    { "@type": "ListItem", position: 2, name: tool.group, item: `${SITE_URL}/#${tool.group.toLowerCase()}` },
                    { "@type": "ListItem", position: 3, name: tool.name, item: url },
                ],
            },
        ],
    };
}

/**
 * Site-wide entities, emitted once from the root layout. Everything else
 * references these by @id instead of repeating them.
 */
export function siteJsonLd() {
    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "@id": `${SITE_URL}/#website`,
                url: SITE_URL,
                name: SITE_NAME,
                description:
                    "Free browser-based JSON tools: viewer, formatter, validator, diff, converters and type generators for TypeScript, Go, Python, Rust, Java, C#, Kotlin and Zod.",
                inLanguage: "en",
                publisher: { "@id": `${SITE_URL}/#person` },
            },
            {
                "@type": "Organization",
                "@id": `${SITE_URL}/#organization`,
                name: SITE_NAME,
                url: SITE_URL,
                logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon/android-icon-192x192.png`, width: 192, height: 192 },
                founder: { "@id": `${SITE_URL}/#person` },
                sameAs: ["https://github.com/ratnesh-maurya/JSONic"],
            },
            {
                "@type": "Person",
                "@id": `${SITE_URL}/#person`,
                name: AUTHOR.name,
                url: AUTHOR.url,
                sameAs: [AUTHOR.url, "https://blog.ratnesh-maurya.com", AUTHOR.github, "https://x.com/ratnesh_maurya_"],
                knowsAbout: ["JSON", "TypeScript", "Go", "React", "Next.js", "Web performance"],
            },
        ],
    };
}

/** Home page: an enumerable list of every tool, which answer engines read directly. */
export function toolListJsonLd() {
    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "ItemList",
                "@id": `${SITE_URL}/#tools`,
                name: `${SITE_NAME} JSON tools`,
                description: `All ${TOOLS.length} JSON tools available on ${SITE_NAME}, each running entirely in the browser.`,
                numberOfItems: TOOLS.length,
                itemListOrder: "https://schema.org/ItemListOrderAscending",
                itemListElement: TOOLS.map((tool, index) => ({
                    "@type": "ListItem",
                    position: index + 1,
                    name: tool.name,
                    description: tool.summary,
                    url: `${SITE_URL}/${tool.slug}`,
                })),
            },
            {
                "@type": "FAQPage",
                "@id": `${SITE_URL}/#faq`,
                mainEntity: [
                    {
                        "@type": "Question",
                        name: "Is JSONic free, and does it require an account?",
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: `All ${TOOLS.length} tools are free with no account, no sign-up and no usage limit. JSONic is open source and runs entirely as a static site.`,
                        },
                    },
                    {
                        "@type": "Question",
                        name: "Is my JSON uploaded to a server?",
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: "No. Every operation runs in your browser using a Web Worker. There is no upload step and no server-side processing, so your data never leaves your machine — which matters when the payload contains production data.",
                        },
                    },
                    {
                        "@type": "Question",
                        name: "How large a JSON file can JSONic open?",
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: "Files in the tens of megabytes. Parsing runs off the main thread and the tree renders only the rows inside the viewport, so cost scales with what you look at rather than with file size. Above 1 MB live processing pauses until you press Run, and above 4 MB the editor becomes a read-only virtualized view.",
                        },
                    },
                    {
                        "@type": "Question",
                        name: "Why do other online JSON viewers freeze on large files?",
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: "Most build a DOM node for every value in the document and call JSON.parse on the main thread, so a large file means both a blocked event loop and hundreds of thousands of elements. JSONic keeps a flat row model, mounts only visible rows, and parses inside a Web Worker.",
                        },
                    },
                ],
            },
        ],
    };
}
