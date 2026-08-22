/** String-level JSON operations: escape, base64, JWT. All pure and dependency-free. */

/** Escapes a raw string into a JSON string literal, without the surrounding quotes. */
export function escapeJsonString(input: string): string {
    // JSON.stringify handles every control character and surrogate correctly;
    // slicing the quotes off is safer than hand-rolling the escape table
    return JSON.stringify(input).slice(1, -1);
}

/** Reverses `escapeJsonString`. Throws on an invalid escape sequence. */
export function unescapeJsonString(input: string): string {
    // strip one layer of wrapping quotes if the whole value is a quoted literal
    const trimmed = input.trim();
    const body = trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 1
        ? trimmed.slice(1, -1)
        : input;
    return JSON.parse(`"${body.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")}"`) as string;
}

export type EscapeDirection = "escape" | "unescape";

/**
 * Picks a direction from the input itself: text containing backslash escapes but
 * no raw control characters is almost certainly already escaped.
 */
export function detectEscapeDirection(input: string): EscapeDirection {
    const hasEscapes = /\\[nrt"\\/bfu]/.test(input);
    const hasRawControl = /[\n\r\t]/.test(input);
    if (hasEscapes && !hasRawControl) return "unescape";
    return "escape";
}

// ---------------------------------------------------------------- base64

const B64_URL_SAFE = /^[A-Za-z0-9_-]+={0,2}$/;

/** UTF-8 safe base64 encode. btoa alone throws on any character above U+00FF. */
export function encodeBase64(input: string, urlSafe = false): string {
    const bytes = new TextEncoder().encode(input);
    let binary = "";
    // chunked to stay well under the argument-count limit of String.fromCharCode
    for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    const encoded = btoa(binary);
    return urlSafe ? encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : encoded;
}

export function decodeBase64(input: string): string {
    const cleaned = input.trim().replace(/\s+/g, "");
    const normalised = B64_URL_SAFE.test(cleaned)
        ? cleaned.replace(/-/g, "+").replace(/_/g, "/")
        : cleaned;
    // restore the padding base64url drops
    const padded = normalised + "=".repeat((4 - (normalised.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
}

// ---------------------------------------------------------------- JWT

export interface JwtParts {
    header: unknown;
    payload: unknown;
    signature: string;
    /** claims rendered as human-readable dates */
    timestamps: Array<{ claim: string; epoch: number; iso: string; relative: string }>;
    expired: boolean | null;
    algorithm: string | null;
}

const TIME_CLAIMS = ["exp", "iat", "nbf", "auth_time", "updated_at"];

function relativeTime(epochSeconds: number, now: number): string {
    const deltaSeconds = epochSeconds - Math.floor(now / 1000);
    const past = deltaSeconds < 0;
    const magnitude = Math.abs(deltaSeconds);
    const units: Array<[number, string]> = [[86400, "day"], [3600, "hour"], [60, "minute"], [1, "second"]];
    for (const [size, name] of units) {
        if (magnitude >= size) {
            const count = Math.floor(magnitude / size);
            return `${count} ${name}${count === 1 ? "" : "s"} ${past ? "ago" : "from now"}`;
        }
    }
    return "now";
}

/**
 * Decodes header and payload. Deliberately does NOT verify the signature:
 * verification requires the signing secret, and prompting for a production
 * secret in a web form is a habit worth not teaching.
 */
export function decodeJwt(token: string, now = Date.now()): JwtParts {
    const parts = token.trim().split(".");
    if (parts.length < 2) throw new Error("Not a JWT — expected header.payload.signature");

    const header = JSON.parse(decodeBase64(parts[0])) as Record<string, unknown>;
    const payload = JSON.parse(decodeBase64(parts[1])) as Record<string, unknown>;

    const timestamps = TIME_CLAIMS.filter((claim) => typeof payload?.[claim] === "number").map((claim) => {
        const epoch = payload[claim] as number;
        return {
            claim,
            epoch,
            iso: new Date(epoch * 1000).toISOString(),
            relative: relativeTime(epoch, now),
        };
    });

    const exp = typeof payload?.exp === "number" ? payload.exp : null;

    return {
        header,
        payload,
        signature: parts[2] ?? "",
        timestamps,
        expired: exp === null ? null : exp * 1000 < now,
        algorithm: typeof header?.alg === "string" ? header.alg : null,
    };
}
