/** Structural JSON operations: flatten, merge, patch, sort, size analysis. */

type Dict = Record<string, unknown>;

function isPlainObject(value: unknown): value is Dict {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

// ---------------------------------------------------------------- flatten

export interface FlattenConfig {
    delimiter: string;
    /** `a.0.b` when false, `a[0].b` when true */
    bracketArrays: boolean;
    /** keep empty objects/arrays as leaf values so the round trip is lossless */
    preserveEmpty: boolean;
}

export const DEFAULT_FLATTEN: FlattenConfig = { delimiter: ".", bracketArrays: false, preserveEmpty: true };

export function flattenObject(value: unknown, config: FlattenConfig = DEFAULT_FLATTEN): Dict {
    const out: Dict = {};

    const walk = (current: unknown, path: string) => {
        if (Array.isArray(current)) {
            if (current.length === 0) {
                if (config.preserveEmpty && path) out[path] = [];
                return;
            }
            current.forEach((item, index) => {
                const next = config.bracketArrays
                    ? `${path}[${index}]`
                    : path ? `${path}${config.delimiter}${index}` : String(index);
                walk(item, next);
            });
            return;
        }
        if (isPlainObject(current)) {
            const keys = Object.keys(current);
            if (keys.length === 0) {
                if (config.preserveEmpty && path) out[path] = {};
                return;
            }
            for (const key of keys) walk(current[key], path ? `${path}${config.delimiter}${key}` : key);
            return;
        }
        out[path || "value"] = current;
    };

    walk(value, "");
    return out;
}

/** Splits `a.b[0].c` into ["a","b","0","c"], honouring both array notations. */
function splitPath(path: string, delimiter: string): string[] {
    const segments: string[] = [];
    let buffer = "";
    for (let i = 0; i < path.length; i++) {
        const char = path[i];
        if (path.startsWith(delimiter, i) && delimiter.length > 0) {
            if (buffer) { segments.push(buffer); buffer = ""; }
            i += delimiter.length - 1;
            continue;
        }
        if (char === "[") {
            if (buffer) { segments.push(buffer); buffer = ""; }
            const close = path.indexOf("]", i);
            if (close === -1) { buffer += char; continue; }
            segments.push(path.slice(i + 1, close));
            i = close;
            continue;
        }
        buffer += char;
    }
    if (buffer) segments.push(buffer);
    return segments;
}

export function unflattenObject(flat: Dict, config: FlattenConfig = DEFAULT_FLATTEN): unknown {
    const isIndex = (segment: string) => /^\d+$/.test(segment);
    // the root's own shape is decided by whether the first segment is an index
    const firstKey = Object.keys(flat)[0];
    if (firstKey === undefined) return {};
    const rootIsArray = isIndex(splitPath(firstKey, config.delimiter)[0] ?? "");
    const root: unknown = rootIsArray ? [] : {};

    for (const [path, value] of Object.entries(flat)) {
        const segments = splitPath(path, config.delimiter);
        let cursor: Dict | unknown[] = root as Dict | unknown[];

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const last = i === segments.length - 1;

            if (last) {
                if (Array.isArray(cursor)) cursor[Number(segment)] = value;
                else (cursor as Dict)[segment] = value;
                break;
            }

            const nextIsIndex = isIndex(segments[i + 1]);
            const existing = Array.isArray(cursor) ? cursor[Number(segment)] : (cursor as Dict)[segment];

            if (existing === undefined || typeof existing !== "object" || existing === null) {
                const created: Dict | unknown[] = nextIsIndex ? [] : {};
                if (Array.isArray(cursor)) cursor[Number(segment)] = created;
                else (cursor as Dict)[segment] = created;
                cursor = created;
            } else {
                cursor = existing as Dict | unknown[];
            }
        }
    }

    return root;
}

// ---------------------------------------------------------------- merge

/** Recursive merge. Arrays are replaced, not concatenated — the conventional choice. */
export function deepMerge(base: unknown, overlay: unknown): unknown {
    if (!isPlainObject(base) || !isPlainObject(overlay)) return overlay;
    const out: Dict = { ...base };
    for (const [key, value] of Object.entries(overlay)) {
        out[key] = key in base ? deepMerge(base[key], value) : value;
    }
    return out;
}

/**
 * RFC 7386 merge patch: the diff that, applied to `from`, yields `to`.
 * A null value means "delete this key".
 */
export function mergePatch(from: unknown, to: unknown): unknown {
    if (!isPlainObject(from) || !isPlainObject(to)) return to;
    const patch: Dict = {};
    for (const key of new Set([...Object.keys(from), ...Object.keys(to)])) {
        if (!(key in to)) { patch[key] = null; continue; }
        if (!(key in from)) { patch[key] = to[key]; continue; }
        if (JSON.stringify(from[key]) === JSON.stringify(to[key])) continue;
        patch[key] = isPlainObject(from[key]) && isPlainObject(to[key]) ? mergePatch(from[key], to[key]) : to[key];
    }
    return patch;
}

export interface PatchOp {
    op: "add" | "remove" | "replace";
    path: string;
    value?: unknown;
}

/** RFC 6902 JSON Patch. Arrays are compared by index. */
export function jsonPatch(from: unknown, to: unknown, basePath = ""): PatchOp[] {
    const ops: PatchOp[] = [];
    // ~ and / carry meaning inside a JSON Pointer and must be escaped
    const pointer = (segment: string) => `${basePath}/${segment.replace(/~/g, "~0").replace(/\//g, "~1")}`;

    if (isPlainObject(from) && isPlainObject(to)) {
        for (const key of new Set([...Object.keys(from), ...Object.keys(to)])) {
            const path = pointer(key);
            if (!(key in to)) { ops.push({ op: "remove", path }); continue; }
            if (!(key in from)) { ops.push({ op: "add", path, value: to[key] }); continue; }
            ops.push(...jsonPatch(from[key], to[key], path));
        }
        return ops;
    }

    if (Array.isArray(from) && Array.isArray(to)) {
        const shared = Math.min(from.length, to.length);
        for (let i = 0; i < shared; i++) ops.push(...jsonPatch(from[i], to[i], `${basePath}/${i}`));
        for (let i = shared; i < to.length; i++) ops.push({ op: "add", path: `${basePath}/${i}`, value: to[i] });
        // remove from the tail forwards so earlier indices stay valid as ops apply
        for (let i = from.length - 1; i >= shared; i--) ops.push({ op: "remove", path: `${basePath}/${i}` });
        return ops;
    }

    if (JSON.stringify(from) !== JSON.stringify(to)) {
        ops.push({ op: "replace", path: basePath || "", value: to });
    }
    return ops;
}

// ---------------------------------------------------------------- sort

export interface SortConfig {
    direction: "asc" | "desc";
    caseInsensitive: boolean;
    /** `item2` before `item10` instead of lexicographic */
    natural: boolean;
    /** sort arrays of objects by this key; empty leaves array order alone */
    arrayKey: string;
}

export const DEFAULT_SORT: SortConfig = { direction: "asc", caseInsensitive: false, natural: true, arrayKey: "" };

function comparator(config: SortConfig): (a: string, b: string) => number {
    const collator = new Intl.Collator(undefined, {
        numeric: config.natural,
        sensitivity: config.caseInsensitive ? "base" : "variant",
    });
    return (a, b) => (config.direction === "asc" ? 1 : -1) * collator.compare(a, b);
}

export function sortJson(value: unknown, config: SortConfig = DEFAULT_SORT): unknown {
    const compare = comparator(config);

    const walk = (current: unknown): unknown => {
        if (Array.isArray(current)) {
            const mapped = current.map(walk);
            if (!config.arrayKey) return mapped;
            // only reorder when every element actually carries the key
            const sortable = mapped.every((item) => isPlainObject(item) && config.arrayKey in item);
            if (!sortable) return mapped;
            return mapped.sort((a, b) =>
                compare(String((a as Dict)[config.arrayKey]), String((b as Dict)[config.arrayKey])),
            );
        }
        if (!isPlainObject(current)) return current;
        const out: Dict = {};
        for (const key of Object.keys(current).sort(compare)) out[key] = walk(current[key]);
        return out;
    };

    return walk(value);
}

// ---------------------------------------------------------------- size analysis

export interface SizeEntry {
    path: string;
    bytes: number;
    share: number;
    kind: string;
    count: number;
}

export interface SizeReport {
    total: number;
    entries: SizeEntry[];
    /** total bytes attributable to key names rather than values */
    keyBytes: number;
    deepestPath: string;
    largestString: { path: string; bytes: number } | null;
}

/**
 * Attributes bytes to top-level and second-level paths so it is obvious which
 * branch is responsible for a large document. Measures the serialized form, so
 * the numbers match what actually travels over the wire.
 */
export function analyseSize(root: unknown, maxEntries = 40): SizeReport {
    const total = JSON.stringify(root)?.length ?? 0;
    const entries: SizeEntry[] = [];
    let keyBytes = 0;
    let deepestPath = "$";
    let deepest = -1;
    let largestString: { path: string; bytes: number } | null = null;

    const countKeys = (value: unknown, path: string, depth: number) => {
        if (depth > deepest) { deepest = depth; deepestPath = path; }
        if (typeof value === "string" && (!largestString || value.length > largestString.bytes)) {
            largestString = { path, bytes: value.length };
        }
        if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) countKeys(value[i], `${path}[${i}]`, depth + 1);
            return;
        }
        if (isPlainObject(value)) {
            for (const [key, child] of Object.entries(value)) {
                keyBytes += key.length + 3; // quotes and colon
                countKeys(child, `${path}.${key}`, depth + 1);
            }
        }
    };
    countKeys(root, "$", 0);

    const measure = (value: unknown, path: string, depth: number) => {
        const serialized = JSON.stringify(value);
        const bytes = serialized?.length ?? 0;
        entries.push({
            path,
            bytes,
            share: total > 0 ? bytes / total : 0,
            kind: Array.isArray(value) ? "array" : value === null ? "null" : typeof value,
            count: Array.isArray(value) ? value.length : isPlainObject(value) ? Object.keys(value).length : 0,
        });
        // two levels is enough to point at the culprit without measuring every leaf
        if (depth >= 2) return;
        if (Array.isArray(value)) {
            // an array of similar items: report the array, not each element
            if (value.length > 20) return;
            value.forEach((item, i) => measure(item, `${path}[${i}]`, depth + 1));
            return;
        }
        if (isPlainObject(value)) {
            for (const [key, child] of Object.entries(value)) measure(child, `${path}.${key}`, depth + 1);
        }
    };
    measure(root, "$", 0);

    entries.sort((a, b) => b.bytes - a.bytes);
    return {
        total,
        entries: entries.slice(0, maxEntries),
        keyBytes,
        deepestPath,
        largestString,
    };
}
