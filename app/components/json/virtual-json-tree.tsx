"use client";

import { memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from "react";
import { FixedSizeList, type ListChildComponentProps } from "react-window";
import {
    ROOT_PATH,
    displayValue,
    flatten,
    pathsMatching,
    pathsToDepth,
    previewOf,
    type TreeRow,
} from "@/lib/json/flatten";

const ROW_HEIGHT = 22;
const INDENT_PX = 14;

const KIND_CLASS: Record<TreeRow["kind"], string> = {
    string: "text-emerald-700 dark:text-emerald-300",
    number: "text-violet-700 dark:text-violet-300",
    boolean: "text-rose-700 dark:text-rose-300",
    null: "text-gray-500 dark:text-gray-400 italic",
    object: "text-gray-500 dark:text-gray-400",
    array: "text-gray-500 dark:text-gray-400",
};

/** Detected inline previews, JSON-Hero style — cheap regex checks, display only. */
function smartHint(value: unknown): { label: string; href?: string; swatch?: string } | null {
    if (typeof value !== "string" || value.length < 4) return null;
    if (/^https?:\/\/\S+$/.test(value)) return { label: "url", href: value };
    if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) return { label: "color", swatch: value };
    if (/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?/.test(value)) return { label: "date" };
    if (/^data:image\/[a-z+]+;base64,/i.test(value)) return { label: "image" };
    if (/^[\w.-]+@[\w.-]+\.\w{2,}$/.test(value)) return { label: "email" };
    return null;
}

interface RowData {
    rows: TreeRow[];
    matches: Set<string>;
    activePath: string | null;
    onToggle: (path: string) => void;
    onSelect: (row: TreeRow) => void;
    onCopyValue: (row: TreeRow) => void;
    onCopyPath: (row: TreeRow) => void;
}

const Row = memo(function Row({ index, style, data }: ListChildComponentProps<RowData>) {
    const row = data.rows[index];
    const { onToggle, onSelect, onCopyValue, onCopyPath } = data;
    const isMatch = data.matches.has(row.path);
    const isActive = data.activePath === row.path;
    const expandable = row.hasChildren && !row.closing;
    const hint = row.closing ? null : smartHint(row.value);

    return (
        <div
            style={{ ...style, paddingLeft: 8 + row.depth * INDENT_PX }}
            role="treeitem"
            aria-level={row.depth + 1}
            aria-expanded={expandable ? data.rows[index + 1]?.depth === row.depth + 1 : undefined}
            aria-selected={isActive}
            onClick={() => (expandable ? onToggle(row.path) : onSelect(row))}
            className={`group flex items-center gap-1.5 pr-24 font-mono text-[12.5px] leading-[22px] whitespace-nowrap cursor-default
                ${isActive ? "bg-indigo-50 dark:bg-indigo-500/15" : isMatch ? "bg-amber-50 dark:bg-amber-500/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/60"}`}
        >
            {row.closing ? (
                <span className="text-gray-400 dark:text-gray-500">{row.kind === "array" ? "]" : "}"}</span>
            ) : (
                <>
                    <span
                        className={`w-3 shrink-0 select-none text-[9px] text-indigo-500 dark:text-indigo-400 ${expandable ? "" : "opacity-0"}`}
                        aria-hidden
                    >
                        {expandable ? (data.rows[index + 1]?.depth === row.depth + 1 ? "▼" : "▶") : "•"}
                    </span>

                    {row.key !== undefined && (
                        <span className="shrink-0">
                            {row.indexed ? (
                                <span className="text-amber-600 dark:text-amber-400">[{row.key}]</span>
                            ) : (
                                <span className="text-sky-700 dark:text-sky-300">&quot;{row.key}&quot;</span>
                            )}
                            <span className="text-gray-400 dark:text-gray-500">:</span>
                        </span>
                    )}

                    {row.hasChildren || row.kind === "object" || row.kind === "array" ? (
                        <span className="text-gray-500 dark:text-gray-400">
                            {data.rows[index + 1]?.depth === row.depth + 1 ? (row.kind === "array" ? "[" : "{") : previewOf(row)}
                        </span>
                    ) : (
                        <span className={`${KIND_CLASS[row.kind]} truncate`} title={typeof row.value === "string" ? row.value : undefined}>
                            {displayValue(row.value)}
                        </span>
                    )}

                    {hint?.swatch && (
                        <span
                            className="inline-block h-3 w-3 shrink-0 rounded border border-black/10 dark:border-white/20"
                            style={{ background: hint.swatch }}
                            aria-label={`colour ${hint.swatch}`}
                        />
                    )}
                    {hint?.href && (
                        <a
                            href={hint.href}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0 text-[10px] uppercase tracking-wide text-indigo-500 hover:underline"
                        >
                            open
                        </a>
                    )}

                    <span className="ml-auto hidden shrink-0 items-center gap-1 pl-3 group-hover:flex">
                        <button
                            onClick={(e) => { e.stopPropagation(); onCopyValue(row); }}
                            title="Copy value"
                            className="rounded px-1 text-[10px] text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
                        >
                            value
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onCopyPath(row); }}
                            title="Copy JSONPath"
                            className="rounded px-1 text-[10px] text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
                        >
                            path
                        </button>
                    </span>
                </>
            )}
        </div>
    );
});

export interface VirtualJsonTreeHandle {
    expandToDepth: (depth: number) => void;
    collapseAll: () => void;
    search: (query: string) => { matches: number; capped: boolean };
    clearSearch: () => void;
}

interface VirtualJsonTreeProps {
    /** already-parsed document — parsing belongs in the worker, not here */
    data: unknown;
    height: number;
    className?: string;
    onCopy?: (text: string, label: string) => void;
    onSelectPath?: (path: string) => void;
}

/**
 * Renders only the rows inside the viewport. Expanding a container just adds a
 * path to a Set; the flat row list is recomputed and the list re-renders ~40
 * DOM nodes regardless of document size.
 */
export const VirtualJsonTree = forwardRef<VirtualJsonTreeHandle, VirtualJsonTreeProps>(function VirtualJsonTree(
    { data, height, className, onCopy, onSelectPath },
    ref,
) {
    const [expanded, setExpanded] = useState<Set<string>>(() => new Set([ROOT_PATH]));
    const [matches, setMatches] = useState<Set<string>>(() => new Set());
    const [activePath, setActivePath] = useState<string | null>(null);
    const listRef = useRef<FixedSizeList>(null);

    // a new document invalidates every remembered path
    useEffect(() => {
        setExpanded(new Set([ROOT_PATH]));
        setMatches(new Set());
        setActivePath(null);
        listRef.current?.scrollTo(0);
    }, [data]);

    const { rows, truncated } = useMemo(() => flatten(data, { expanded }), [data, expanded]);

    const onToggle = useCallback((path: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });
        setActivePath(path);
        onSelectPath?.(path);
    }, [onSelectPath]);

    const onSelect = useCallback((row: TreeRow) => {
        setActivePath(row.path);
        onSelectPath?.(row.path);
    }, [onSelectPath]);

    const valueAt = useCallback((row: TreeRow) => {
        if (row.kind !== "object" && row.kind !== "array") {
            return typeof row.value === "string" ? row.value : JSON.stringify(row.value);
        }
        // containers: re-resolve the subtree from the path segments
        const segments = row.path.slice(ROOT_PATH.length).match(/\[[^\]]+\]|\.[^.[]+/g) ?? [];
        let current: unknown = data;
        for (const segment of segments) {
            const key = segment.startsWith("[")
                ? segment.slice(1, -1).replace(/^"|"$/g, "")
                : segment.slice(1);
            if (current === null || typeof current !== "object") return "";
            current = (current as Record<string, unknown>)[key];
        }
        return JSON.stringify(current, null, 2);
    }, [data]);

    const rowData = useMemo<RowData>(() => ({
        rows,
        matches,
        activePath,
        onToggle,
        onSelect,
        onCopyValue: (row) => onCopy?.(valueAt(row), "Value copied"),
        onCopyPath: (row) => onCopy?.(row.path, "Path copied"),
    }), [rows, matches, activePath, onToggle, onSelect, onCopy, valueAt]);

    useImperativeHandle(ref, () => ({
        expandToDepth: (depth: number) => setExpanded(pathsToDepth(data, depth)),
        collapseAll: () => setExpanded(new Set([ROOT_PATH])),
        search: (query: string) => {
            if (!query.trim()) {
                setMatches(new Set());
                return { matches: 0, capped: false };
            }
            const { paths, matches: hits, capped } = pathsMatching(data, query.trim());
            // expand the ancestors so every hit is actually on screen
            setExpanded((prev) => new Set([...prev, ...paths]));
            setMatches(new Set(hits));
            return { matches: hits.length, capped };
        },
        clearSearch: () => setMatches(new Set()),
    }), [data]);

    // scroll the first search hit into view once the rows include it
    useEffect(() => {
        if (matches.size === 0) return;
        const index = rows.findIndex((row) => matches.has(row.path));
        if (index >= 0) listRef.current?.scrollToItem(index, "center");
    }, [matches, rows]);

    return (
        <div className={className} role="tree" aria-label="JSON tree">
            <FixedSizeList
                ref={listRef}
                height={height}
                itemCount={rows.length}
                itemSize={ROW_HEIGHT}
                width="100%"
                itemData={rowData}
                overscanCount={12}
                className="scrollbar-thin"
            >
                {Row}
            </FixedSizeList>
            {truncated && (
                <p className="border-t border-amber-200 bg-amber-50 px-3 py-1 text-[11px] text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                    Row limit reached — collapse a branch to keep exploring.
                </p>
            )}
        </div>
    );
});
