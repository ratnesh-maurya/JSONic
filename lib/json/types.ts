export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export interface JsonErrorPosition {
    line: number;
    column: number;
    offset: number;
}

export interface JsonTypeCounts {
    strings: number;
    numbers: number;
    booleans: number;
    nulls: number;
    objects: number;
    arrays: number;
}

export interface JsonStats {
    nodes: number;
    depth: number;
    size: number;
    types: JsonTypeCounts;
}

export const EMPTY_STATS: JsonStats = {
    nodes: 0,
    depth: 0,
    size: 0,
    types: { strings: 0, numbers: 0, booleans: 0, nulls: 0, objects: 0, arrays: 0 },
};

/** Size tiers drive which features stay on. Bytes. */
export const SIZE_TIER = {
    /** below this everything is live: auto-analyze on keystroke, syntax highlight */
    LIVE: 1_000_000,
    /** below this we still parse, but only on explicit action */
    MANUAL: 25_000_000,
} as const;

export type SizeTier = "live" | "manual" | "huge";

export function sizeTier(bytes: number): SizeTier {
    if (bytes < SIZE_TIER.LIVE) return "live";
    if (bytes < SIZE_TIER.MANUAL) return "manual";
    return "huge";
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
