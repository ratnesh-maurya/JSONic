import type { MetadataRoute } from "next";
import { SITE_URL, TOOLS } from "@/lib/tools";

/**
 * Real routes only. The previous sitemap listed #hash fragments, which search
 * engines discard — every entry collapsed to the same single URL.
 */
export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date();

    return [
        { url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
        ...TOOLS.map((tool) => ({
            url: `${SITE_URL}/${tool.slug}`,
            lastModified,
            changeFrequency: "monthly" as const,
            // Inspect and Format tools are the entry points most searches land on;
            // a flat 0.8 across 28 URLs tells a crawler nothing about relative depth.
            priority: tool.group === "Inspect" || tool.group === "Format" ? 0.9 : 0.7,
            images: [`${SITE_URL}/${tool.slug}/opengraph-image`],
        })),
    ];
}
