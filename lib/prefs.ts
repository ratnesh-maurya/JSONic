"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_FLATTEN, DEFAULT_SORT, type FlattenConfig, type SortConfig } from "./json/structure";
import { DEFAULT_CSV, type CsvConfig } from "./json/csv";
import { DEFAULT_SQL, type SqlOptions } from "./json/sql";

const PREFS_KEY = "jsonic:prefs:v3";

export interface Prefs {
    sidebarCollapsed: boolean;
    /** collapsed sidebar groups, by group name */
    collapsedGroups: string[];
    liveMode: boolean;

    indentSize: number;
    sortKeys: boolean;
    autoFix: boolean;

    jsonPathQuery: string;
    codegenStyle: string;

    escapeDirection: "escape" | "unescape" | "auto";
    base64Direction: "encode" | "decode";
    base64UrlSafe: boolean;
    flattenDirection: "flatten" | "unflatten";
    flattenConfig: FlattenConfig;
    sortConfig: SortConfig;
    mergeMode: "merge" | "mergePatch" | "patch";
    csvConfig: CsvConfig;
    ndjsonDirection: "toNdjson" | "fromNdjson";
    sqlOptions: SqlOptions;
}

export const DEFAULT_PREFS: Prefs = {
    sidebarCollapsed: false,
    collapsedGroups: [],
    liveMode: true,

    indentSize: 2,
    sortKeys: false,
    autoFix: true,

    jsonPathQuery: "$..*",
    codegenStyle: "",

    escapeDirection: "auto",
    base64Direction: "encode",
    base64UrlSafe: false,
    flattenDirection: "flatten",
    flattenConfig: DEFAULT_FLATTEN,
    sortConfig: DEFAULT_SORT,
    mergeMode: "merge",
    csvConfig: DEFAULT_CSV,
    ndjsonDirection: "toNdjson",
    sqlOptions: DEFAULT_SQL,
};

function read(): Prefs {
    if (typeof window === "undefined") return DEFAULT_PREFS;
    try {
        const raw = window.localStorage.getItem(PREFS_KEY);
        if (!raw) return DEFAULT_PREFS;
        const stored = JSON.parse(raw) as Partial<Prefs>;
        // spread over defaults so a newly added preference is never undefined,
        // and nested config objects still get their new fields
        return {
            ...DEFAULT_PREFS,
            ...stored,
            flattenConfig: { ...DEFAULT_FLATTEN, ...stored.flattenConfig },
            sortConfig: { ...DEFAULT_SORT, ...stored.sortConfig },
            csvConfig: { ...DEFAULT_CSV, ...stored.csvConfig },
            sqlOptions: { ...DEFAULT_SQL, ...stored.sqlOptions },
        };
    } catch {
        return DEFAULT_PREFS;
    }
}

/**
 * Small UI preferences only — localStorage caps out around 5 MB and writes
 * synchronously, so documents live in IndexedDB instead (lib/storage/documents).
 *
 * Reads happen after mount so the server and first client render agree.
 */
export function usePrefs() {
    const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setPrefs(read());
        setHydrated(true);
    }, []);

    const update = useCallback((patch: Partial<Prefs>) => {
        setPrefs((prev) => {
            const next = { ...prev, ...patch };
            try {
                window.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
            } catch {
                // private mode or quota — preferences are not worth failing a render over
            }
            return next;
        });
    }, []);

    return { prefs, update, hydrated };
}
