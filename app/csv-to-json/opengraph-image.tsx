import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";
import { toolBySlug } from "@/lib/tools";

const tool = toolBySlug("csv-to-json")!;

export const alt = `${tool.heading} — JSONic`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
    return renderOgImage({
        eyebrow: tool.group,
        title: tool.heading,
        summary: tool.summary,
        chips: tool.chips,
    });
}
