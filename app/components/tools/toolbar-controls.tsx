"use client";

import { ChevronsDownUp, ChevronsUpDown, Search } from "lucide-react";
import type { Prefs } from "@/lib/prefs";
import type { WorkbenchMode } from "@/lib/json/modes";

export const BUTTON =
    "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800";

export const PRIMARY =
    "inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50";

const SELECT =
    "rounded-md border border-gray-200 bg-white px-1.5 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300";

const INPUT =
    "min-w-[160px] flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200";

interface Props {
    mode: WorkbenchMode;
    prefs: Prefs;
    update: (patch: Partial<Prefs>) => void;
    onTreeSearch: (query: string) => void;
    onExpandDepth: (depth: number) => void;
    onCollapseAll: () => void;
}

/** Per-mode controls. Everything here is a preference, so it persists between visits. */
export function ToolbarControls({ mode, prefs, update, onTreeSearch, onExpandDepth, onCollapseAll }: Props) {
    return (
        <>
            {mode === "viewer" && (
                <>
                    <label className="relative flex min-w-[180px] flex-1 items-center">
                        <Search className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-gray-400" aria-hidden />
                        <input
                            onChange={(e) => onTreeSearch(e.target.value)}
                            spellCheck={false}
                            placeholder="Search keys and values…"
                            aria-label="Search the tree"
                            className={`${INPUT} pl-7`}
                        />
                    </label>
                    <button onClick={() => onExpandDepth(3)} className={BUTTON}>
                        <ChevronsUpDown className="h-3.5 w-3.5" aria-hidden /> Depth 3
                    </button>
                    <button onClick={() => onExpandDepth(99)} className={BUTTON}>Expand all</button>
                    <button onClick={onCollapseAll} className={BUTTON}>
                        <ChevronsDownUp className="h-3.5 w-3.5" aria-hidden /> Collapse
                    </button>
                </>
            )}

            {mode === "jsonpath" && (
                <input
                    value={prefs.jsonPathQuery}
                    onChange={(e) => update({ jsonPathQuery: e.target.value })}
                    spellCheck={false}
                    placeholder="$.users[*].email"
                    aria-label="JSONPath expression"
                    className={`${INPUT} min-w-[220px] font-mono`}
                />
            )}

            {mode === "formatter" && (
                <>
                    <Select label="Indent" value={String(prefs.indentSize)} onChange={(v) => update({ indentSize: Number(v) })}
                        options={[["2", "2"], ["4", "4"], ["8", "8"]]} />
                    <Check label="Sort keys" checked={prefs.sortKeys} onChange={(v) => update({ sortKeys: v })} />
                </>
            )}

            {(mode === "formatter" || mode === "minifier") && (
                <Check label="Auto-fix" checked={prefs.autoFix} onChange={(v) => update({ autoFix: v })} />
            )}

            {mode === "sort" && (
                <>
                    <Segmented
                        value={prefs.sortConfig.direction}
                        onChange={(v) => update({ sortConfig: { ...prefs.sortConfig, direction: v as "asc" | "desc" } })}
                        options={[["asc", "A→Z"], ["desc", "Z→A"]]}
                    />
                    <Check label="Natural" checked={prefs.sortConfig.natural}
                        onChange={(v) => update({ sortConfig: { ...prefs.sortConfig, natural: v } })} />
                    <Check label="Ignore case" checked={prefs.sortConfig.caseInsensitive}
                        onChange={(v) => update({ sortConfig: { ...prefs.sortConfig, caseInsensitive: v } })} />
                    <input
                        value={prefs.sortConfig.arrayKey}
                        onChange={(e) => update({ sortConfig: { ...prefs.sortConfig, arrayKey: e.target.value } })}
                        placeholder="Sort arrays by field…"
                        aria-label="Sort arrays by this field"
                        className={`${INPUT} max-w-[190px]`}
                    />
                </>
            )}

            {mode === "escape" && (
                <Segmented
                    value={prefs.escapeDirection}
                    onChange={(v) => update({ escapeDirection: v as Prefs["escapeDirection"] })}
                    options={[["auto", "Auto"], ["escape", "Escape"], ["unescape", "Unescape"]]}
                />
            )}

            {mode === "base64" && (
                <>
                    <Segmented
                        value={prefs.base64Direction}
                        onChange={(v) => update({ base64Direction: v as Prefs["base64Direction"] })}
                        options={[["encode", "Encode"], ["decode", "Decode"]]}
                    />
                    <Check label="URL-safe" checked={prefs.base64UrlSafe} onChange={(v) => update({ base64UrlSafe: v })} />
                </>
            )}

            {mode === "flatten" && (
                <>
                    <Segmented
                        value={prefs.flattenDirection}
                        onChange={(v) => update({ flattenDirection: v as Prefs["flattenDirection"] })}
                        options={[["flatten", "Flatten"], ["unflatten", "Unflatten"]]}
                    />
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                        Delimiter
                        <input
                            value={prefs.flattenConfig.delimiter}
                            onChange={(e) => update({ flattenConfig: { ...prefs.flattenConfig, delimiter: e.target.value || "." } })}
                            className={`${SELECT} w-10 text-center font-mono`}
                            maxLength={3}
                            aria-label="Path delimiter"
                        />
                    </label>
                    <Check label="a[0] notation" checked={prefs.flattenConfig.bracketArrays}
                        onChange={(v) => update({ flattenConfig: { ...prefs.flattenConfig, bracketArrays: v } })} />
                </>
            )}

            {mode === "merge" && (
                <Segmented
                    value={prefs.mergeMode}
                    onChange={(v) => update({ mergeMode: v as Prefs["mergeMode"] })}
                    options={[["merge", "Deep merge"], ["mergePatch", "Merge patch"], ["patch", "JSON Patch"]]}
                />
            )}

            {mode === "csvToJson" && (
                <>
                    <Select label="Delimiter" value={prefs.csvConfig.delimiter}
                        onChange={(v) => update({ csvConfig: { ...prefs.csvConfig, delimiter: v } })}
                        options={[[",", "Comma"], [";", "Semicolon"], ["\t", "Tab"], ["|", "Pipe"]]} />
                    <Check label="Header row" checked={prefs.csvConfig.header}
                        onChange={(v) => update({ csvConfig: { ...prefs.csvConfig, header: v } })} />
                    <Check label="Infer types" checked={prefs.csvConfig.inferTypes}
                        onChange={(v) => update({ csvConfig: { ...prefs.csvConfig, inferTypes: v } })} />
                </>
            )}

            {mode === "ndjson" && (
                <Segmented
                    value={prefs.ndjsonDirection}
                    onChange={(v) => update({ ndjsonDirection: v as Prefs["ndjsonDirection"] })}
                    options={[["toNdjson", "JSON → NDJSON"], ["fromNdjson", "NDJSON → JSON"]]}
                />
            )}

            {mode === "sql" && (
                <>
                    <Select label="Dialect" value={prefs.sqlOptions.dialect}
                        onChange={(v) => update({ sqlOptions: { ...prefs.sqlOptions, dialect: v as "postgres" | "mysql" | "sqlite" } })}
                        options={[["postgres", "PostgreSQL"], ["mysql", "MySQL"], ["sqlite", "SQLite"]]} />
                    <input
                        value={prefs.sqlOptions.tableName}
                        onChange={(e) => update({ sqlOptions: { ...prefs.sqlOptions, tableName: e.target.value } })}
                        placeholder="table name"
                        aria-label="Table name"
                        className={`${INPUT} max-w-[140px] font-mono`}
                    />
                    <Check label="CREATE TABLE" checked={prefs.sqlOptions.createTable}
                        onChange={(v) => update({ sqlOptions: { ...prefs.sqlOptions, createTable: v } })} />
                </>
            )}

            {mode === "python" && (
                <Segmented
                    value={prefs.codegenStyle || "dataclass"}
                    onChange={(v) => update({ codegenStyle: v })}
                    options={[["dataclass", "Dataclass"], ["typeddict", "TypedDict"]]}
                />
            )}

            {mode === "java" && (
                <Segmented
                    value={prefs.codegenStyle || "record"}
                    onChange={(v) => update({ codegenStyle: v })}
                    options={[["record", "Record"], ["class", "POJO"]]}
                />
            )}

            <span className="ml-auto">
                <Check label="Live" checked={prefs.liveMode} onChange={(v) => update({ liveMode: v })} />
            </span>
        </>
    );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 accent-indigo-600 dark:border-gray-600"
            />
            {label}
        </label>
    );
}

function Select({ label, value, onChange, options }: {
    label: string; value: string; onChange: (v: string) => void; options: Array<[string, string]>;
}) {
    return (
        <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            {label}
            <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT}>
                {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
        </label>
    );
}

function Segmented({ value, onChange, options }: {
    value: string; onChange: (v: string) => void; options: Array<[string, string]>;
}) {
    return (
        <div className="inline-flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
            {options.map(([v, l]) => (
                <button
                    key={v}
                    onClick={() => onChange(v)}
                    aria-pressed={value === v}
                    className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                        value === v
                            ? "bg-indigo-600 text-white"
                            : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    }`}
                >
                    {l}
                </button>
            ))}
        </div>
    );
}
