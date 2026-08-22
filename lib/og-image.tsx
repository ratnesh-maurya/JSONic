import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** Fixed specimen rendered on every card — colours match the app's token palette. */
const SPECIMEN: Array<{ indent: number; key?: string; value: string; color: string }> = [
    { indent: 0, value: "{", color: "#64748b" },
    { indent: 1, key: "id", value: '"ord_9f2a41"', color: "#6ee7b7" },
    { indent: 1, key: "status", value: '"shipped"', color: "#6ee7b7" },
    { indent: 1, key: "items", value: "[ 128 items ]", color: "#64748b" },
    { indent: 1, key: "total", value: "1309.19", color: "#c4b5fd" },
    { indent: 1, key: "paid", value: "true", color: "#fda4af" },
    { indent: 0, value: "}", color: "#64748b" },
];
export const OG_CONTENT_TYPE = "image/png";

/**
 * Shared social-card renderer.
 *
 * Satori (which backs ImageResponse) supports inline styles and flexbox only —
 * no className, no grid, no CSS variables. Every value here is literal for that
 * reason. Fonts fall back to the runtime's built-in sans, which keeps the route
 * dependency-free and avoids shipping a .ttf into the edge bundle.
 */
export function renderOgImage({
    eyebrow,
    title,
    summary,
    chips,
}: {
    eyebrow: string;
    title: string;
    summary: string;
    chips: string[];
}) {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    background: "#0b0f17",
                    padding: 64,
                    position: "relative",
                }}
            >
                {/* aurora wash — two soft radial blooms, same palette as the site */}
                <div
                    style={{
                        position: "absolute",
                        top: -160,
                        left: -80,
                        width: 620,
                        height: 620,
                        borderRadius: 9999,
                        background: "radial-gradient(circle, rgba(99,102,241,0.45) 0%, rgba(99,102,241,0) 70%)",
                        display: "flex",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: -220,
                        right: -120,
                        width: 640,
                        height: 640,
                        borderRadius: 9999,
                        background: "radial-gradient(circle, rgba(168,85,247,0.38) 0%, rgba(168,85,247,0) 70%)",
                        display: "flex",
                    }}
                />

                {/* wordmark */}
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div
                        style={{
                            width: 52,
                            height: 52,
                            borderRadius: 14,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                            fontSize: 30,
                            fontWeight: 700,
                            color: "#ffffff",
                        }}
                    >
                        J
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ fontSize: 26, fontWeight: 700, color: "#f1f5f9", letterSpacing: -0.5 }}>JSONic</div>
                        <div style={{ fontSize: 16, color: "#64748b" }}>jsonic.ratnesh-maurya.com</div>
                    </div>
                </div>

                {/* main row: copy on the left, a JSON specimen on the right */}
                <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                        <div
                            style={{
                                fontSize: 18,
                                fontWeight: 600,
                                color: "#818cf8",
                                textTransform: "uppercase",
                                letterSpacing: 2.5,
                                marginBottom: 14,
                            }}
                        >
                            {eyebrow}
                        </div>
                        <div
                            style={{
                                fontSize: title.length > 26 ? 52 : 62,
                                fontWeight: 700,
                                color: "#ffffff",
                                letterSpacing: -1.6,
                                lineHeight: 1.06,
                            }}
                        >
                            {title}
                        </div>
                        <div style={{ fontSize: 23, color: "#94a3b8", marginTop: 18, lineHeight: 1.35 }}>
                            {summary}
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            width: 384,
                            borderRadius: 16,
                            border: "1px solid #223049",
                            background: "rgba(15,22,32,0.82)",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 7,
                                padding: "11px 15px",
                                borderBottom: "1px solid #223049",
                            }}
                        >
                            <div style={{ display: "flex", width: 10, height: 10, borderRadius: 9999, background: "#f87171" }} />
                            <div style={{ display: "flex", width: 10, height: 10, borderRadius: 9999, background: "#fbbf24" }} />
                            <div style={{ display: "flex", width: 10, height: 10, borderRadius: 9999, background: "#34d399" }} />
                            <div style={{ display: "flex", fontSize: 14, color: "#475569", marginLeft: 8 }}>orders.json · 42.6 MB</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", padding: "14px 16px", fontSize: 17 }}>
                            {SPECIMEN.map((row, i) => (
                                <div key={i} style={{ display: "flex", paddingLeft: row.indent * 15, marginBottom: 5 }}>
                                    {row.key ? (
                                        <div style={{ display: "flex", color: "#7dd3fc" }}>&quot;{row.key}&quot;</div>
                                    ) : null}
                                    {row.key ? <div style={{ display: "flex", color: "#475569" }}>:&nbsp;</div> : null}
                                    <div style={{ display: "flex", color: row.color }}>{row.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {chips.map((chip) => (
                        <div
                            key={chip}
                            style={{
                                display: "flex",
                                fontSize: 19,
                                color: "#cbd5e1",
                                border: "1px solid #27364b",
                                background: "rgba(30,41,59,0.6)",
                                borderRadius: 9999,
                                padding: "8px 18px",
                            }}
                        >
                            {chip}
                        </div>
                    ))}
                </div>
            </div>
        ),
        OG_SIZE,
    );
}
