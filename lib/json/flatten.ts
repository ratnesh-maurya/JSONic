/**
 * Flat row model for the virtualized tree.
 *
 * The tree is never materialised as React elements. Instead we walk the parsed
 * value and emit one row per *visible* line, skipping the entire subtree of any
 * collapsed container. Cost is therefore O(visible rows), not O(total nodes),
 * so a 50 MB document with everything collapsed produces a handful of rows.
 */

export type NodeKind = "object" | "array" | "string" | "number" | "boolean" | "null";

export interface TreeRow {
    /** JSONPath-ish address, also the expand-set key and React key */
    path: string;
    /** property name, or array index as a string; undefined at the root */
    key?: string;
    /** true when the parent is an array — renders the key as [n] */
    indexed: boolean;
    kind: NodeKind;
    depth: number;
    hasChildren: boolean;
    childCount: number;
    /** primitives only: the rendered value. containers get a collapsed preview. */
    value?: unknown;
    /** closing bracket row for an expanded container */
    closing?: boolean;
}

export function kindOf(value: unknown): NodeKind {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    switch (typeof value) {
        case "string": return "string";
        case "number": return "number";
        case "boolean": return "boolean";
        default: return "object";
    }
}

function childEntries(value: unknown): Array<[string, unknown]> {
    if (Array.isArray(value)) return value.map((v, i) => [String(i), v] as [string, unknown]);
    return Object.entries(value as Record<string, unknown>);
}

export function childPath(parentPath: string, key: string, parentIsArray: boolean): string {
    if (parentIsArray) return `${parentPath}[${key}]`;
    return /^[A-Za-z_$][\w$]*$/.test(key) ? `${parentPath}.${key}` : `${parentPath}[${JSON.stringify(key)}]`;
}

export interface FlattenOptions {
    expanded: ReadonlySet<string>;
    /** hard cap so a pathological expand-all can't lock the renderer */
    maxRows?: number;
    /** when set, only rows whose key or value match are emitted (plus ancestors) */
    filter?: string;
}

export interface FlattenResult {
    rows: TreeRow[];
    truncated: boolean;
    total: number;
}

const DEFAULT_MAX_ROWS = 200_000;
export const ROOT_PATH = "$";

export function flatten(root: unknown, options: FlattenOptions): FlattenResult {
    const { expanded, maxRows = DEFAULT_MAX_ROWS } = options;
    const rows: TreeRow[] = [];
    let truncated = false;

    // iterative walk with an explicit frame stack: recursion overflows on deep docs
    type Frame = {
        value: unknown;
        path: string;
        key?: string;
        indexed: boolean;
        depth: number;
        /** emit the closing bracket instead of descending */
        close?: boolean;
    };

    const stack: Frame[] = [{ value: root, path: ROOT_PATH, indexed: false, depth: 0 }];

    while (stack.length) {
        if (rows.length >= maxRows) { truncated = true; break; }
        const frame = stack.pop()!;
        const kind = kindOf(frame.value);
        const isContainer = kind === "object" || kind === "array";

        if (frame.close) {
            rows.push({
                path: `${frame.path}#close`,
                indexed: false,
                kind,
                depth: frame.depth,
                hasChildren: false,
                childCount: 0,
                closing: true,
            });
            continue;
        }

        const entries = isContainer ? childEntries(frame.value) : [];
        const isExpanded = isContainer && expanded.has(frame.path);

        rows.push({
            path: frame.path,
            key: frame.key,
            indexed: frame.indexed,
            kind,
            depth: frame.depth,
            hasChildren: isContainer && entries.length > 0,
            childCount: entries.length,
            value: isContainer ? undefined : frame.value,
        });

        if (!isExpanded || entries.length === 0) continue;

        // push in reverse so the stack pops children in document order
        stack.push({ ...frame, close: true });
        const parentIsArray = kind === "array";
        for (let i = entries.length - 1; i >= 0; i--) {
            const [key, value] = entries[i];
            stack.push({
                value,
                path: childPath(frame.path, key, parentIsArray),
                key,
                indexed: parentIsArray,
                depth: frame.depth + 1,
            });
        }
    }

    return { rows, truncated, total: rows.length };
}

/** Collapsed-container summary: `{3 keys}` / `[128 items]`. */
export function previewOf(row: TreeRow): string {
    if (row.kind === "array") return row.childCount === 0 ? "[]" : `[ ${row.childCount} ${row.childCount === 1 ? "item" : "items"} ]`;
    if (row.kind === "object") return row.childCount === 0 ? "{}" : `{ ${row.childCount} ${row.childCount === 1 ? "key" : "keys"} }`;
    return "";
}

/** Long strings are clipped for display; the copy action still yields the full value. */
export const MAX_INLINE_STRING = 240;

export function displayValue(value: unknown): string {
    if (typeof value === "string") {
        const clipped = value.length > MAX_INLINE_STRING ? `${value.slice(0, MAX_INLINE_STRING)}…` : value;
        return JSON.stringify(clipped);
    }
    if (value === null) return "null";
    return String(value);
}

/**
 * Every ancestor path of the matches, so a search can auto-expand the way in.
 * Bounded by maxMatches because "e" matches everything in a 50 MB document.
 */
export function pathsMatching(root: unknown, query: string, maxMatches = 2000): { paths: Set<string>; matches: string[]; capped: boolean } {
    const needle = query.toLowerCase();
    const ancestors = new Set<string>();
    const matches: string[] = [];
    let capped = false;

    const stack: Array<{ value: unknown; path: string; key?: string; trail: string[] }> = [
        { value: root, path: ROOT_PATH, trail: [] },
    ];

    while (stack.length) {
        if (matches.length >= maxMatches) { capped = true; break; }
        const { value, path, key, trail } = stack.pop()!;
        const kind = kindOf(value);
        const isContainer = kind === "object" || kind === "array";

        const keyHit = key !== undefined && key.toLowerCase().includes(needle);
        const valueHit = !isContainer && String(value).toLowerCase().includes(needle);
        if (keyHit || valueHit) {
            matches.push(path);
            for (const ancestor of trail) ancestors.add(ancestor);
        }

        if (!isContainer) continue;
        const nextTrail = [...trail, path];
        const parentIsArray = kind === "array";
        for (const [childKey, childValue] of childEntries(value)) {
            stack.push({ value: childValue, path: childPath(path, childKey, parentIsArray), key: childKey, trail: nextTrail });
        }
    }

    return { paths: ancestors, matches, capped };
}

/** Expand every container down to `depth` levels — the usual "expand all" affordance. */
export function pathsToDepth(root: unknown, depth: number, maxPaths = 50_000): Set<string> {
    const out = new Set<string>();
    const stack: Array<{ value: unknown; path: string; level: number }> = [{ value: root, path: ROOT_PATH, level: 0 }];
    while (stack.length) {
        if (out.size >= maxPaths) break;
        const { value, path, level } = stack.pop()!;
        const kind = kindOf(value);
        if (kind !== "object" && kind !== "array") continue;
        if (level >= depth) continue;
        out.add(path);
        const parentIsArray = kind === "array";
        for (const [key, child] of childEntries(value)) {
            stack.push({ value: child, path: childPath(path, key, parentIsArray), level: level + 1 });
        }
    }
    return out;
}
