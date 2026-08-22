import type { JsonErrorPosition, JsonStats } from "./types";
import type { FlattenConfig, SizeReport, SortConfig } from "./structure";
import type { CsvConfig } from "./csv";
import type { SqlOptions } from "./sql";
import type { JwtParts } from "./strings";

/**
 * One entry per operation. The job type is derived from this map, so adding an
 * operation is a single line here plus a case in the worker — the union and the
 * call sites stay in sync by construction.
 */
export interface JobOptions {
    parse: Record<string, never>;
    stats: Record<string, never>;
    validate: Record<string, never>;
    format: { indent: number; sortKeys: boolean; repair: boolean };
    minify: { repair: boolean };
    types: { language: "go" | "typescript" | "schema" | "python" | "rust" | "java" | "csharp" | "kotlin" | "zod"; style?: string };
    jsonpath: { query: string };
    convert: { target: "csv" | "yaml" | "xml" };
    escape: { direction: "escape" | "unescape" | "auto" };
    base64: { direction: "encode" | "decode"; urlSafe: boolean };
    jwt: Record<string, never>;
    flatten: { direction: "flatten" | "unflatten"; config: FlattenConfig; indent: number };
    sort: { config: SortConfig; indent: number };
    size: Record<string, never>;
    /** needs `text2`: the second document */
    merge: { mode: "merge" | "mergePatch" | "patch"; indent: number };
    csvToJson: { config: CsvConfig; indent: number };
    ndjson: { direction: "toNdjson" | "fromNdjson"; indent: number };
    sql: { options: SqlOptions };
}

export type Op = keyof JobOptions;

export type WorkerJob = {
    [K in Op]: {
        id: number;
        op: K;
        text: string;
        /** second document, for two-input operations */
        text2?: string;
        options: JobOptions[K];
    };
}[Op];

export interface WorkerOk {
    /** primary text output */
    text?: string;
    stats?: JsonStats;
    suggestions?: string[];
    originalSize?: number;
    minifiedSize?: number;
    /** structured-clone of the parsed document, for the tree */
    value?: unknown;
    matchCount?: number;
    sizeReport?: SizeReport;
    jwt?: JwtParts;
    /** what an "auto" direction resolved to, so the UI can show it */
    resolvedDirection?: string;
}

export type WorkerReply =
    | { id: number; ok: true; op: Op; result: WorkerOk }
    | { id: number; ok: false; op: Op; error: string; position?: JsonErrorPosition };
