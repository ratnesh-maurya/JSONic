import type { NextConfig } from "next";

/** Long-lived caching for immutable build output; conservative headers elsewhere. */
const SECURITY_HEADERS = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
    // lets a verification build run alongside a dev server without sharing .next
    distDir: process.env.NEXT_DIST_DIR || ".next",
    reactStrictMode: true,
    poweredByHeader: false,
    productionBrowserSourceMaps: false,
    compress: true,

    experimental: {
        // barrel-file imports get rewritten to deep imports so unused exports drop out
        // lucide-react is on the default list; listed here as documentation
        optimizePackageImports: ["react-window", "lucide-react"],
    },

    async headers() {
        return [
            {
                source: "/:path*",
                headers: SECURITY_HEADERS,
            },
            {
                // hashed build assets never change under the same URL
                source: "/_next/static/:path*",
                headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
            },
            {
                source: "/favicon/:path*",
                headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
            },
        ];
    },

    async redirects() {
        return [
            // slugs people are likely to try, pointed at the canonical route
            { source: "/formatter", destination: "/json-formatter", permanent: true },
            { source: "/validator", destination: "/json-validator", permanent: true },
            { source: "/viewer", destination: "/json-viewer", permanent: true },
            { source: "/tree", destination: "/json-viewer", permanent: true },
            { source: "/diff", destination: "/json-compare", permanent: true },
            { source: "/json-diff", destination: "/json-compare", permanent: true },
            { source: "/jsonpath", destination: "/jsonpath-tester", permanent: true },
            { source: "/json-beautifier", destination: "/json-formatter", permanent: true },
            { source: "/json-converter", destination: "/json-to-csv", permanent: true },
            { source: "/json-escape-unescape", destination: "/json-escape", permanent: true },
            { source: "/json-unescape", destination: "/json-escape", permanent: true },
            { source: "/jsonl", destination: "/json-to-ndjson", permanent: true },
            { source: "/json-lines", destination: "/json-to-ndjson", permanent: true },
            { source: "/jwt", destination: "/jwt-decoder", permanent: true },
            { source: "/json-to-dataclass", destination: "/json-to-python", permanent: true },
            { source: "/json-to-pojo", destination: "/json-to-java", permanent: true },
            { source: "/json-to-serde", destination: "/json-to-rust", permanent: true },
        ];
    },
};

export default nextConfig;
