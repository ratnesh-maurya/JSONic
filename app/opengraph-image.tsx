import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image";
import { TOOLS } from "@/lib/tools";

export const alt = "JSONic — browser-based JSON tools built for large files";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
    return renderOgImage({
        eyebrow: `${TOOLS.length} free JSON tools`,
        title: "JSON tools that survive large files",
        summary: "View, format, validate, diff, convert and generate types — entirely in your browser.",
        chips: ["Nothing uploaded", "50 MB+ ready", "No sign-up"],
    });
}
