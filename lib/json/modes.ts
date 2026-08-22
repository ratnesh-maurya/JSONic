import type { JobOptions, Op } from "./worker-protocol";

/** Every tool page maps to one of these. */
export type WorkbenchMode =
    | "viewer" | "validator" | "jsonpath" | "size"
    | "formatter" | "minifier" | "sort" | "escape"
    | "flatten" | "merge" | "base64" | "jwt"
    | "csv" | "yaml" | "xml" | "csvToJson" | "ndjson" | "sql"
    | "typescript" | "go" | "python" | "rust" | "java" | "csharp" | "kotlin" | "zod" | "schema";

export type OutputKind = "tree" | "code" | "report" | "size" | "jwt";

export interface ModeSpec {
    op: Op;
    output: OutputKind;
    /** label above the output pane */
    outputLabel: string;
    /** download filename */
    filename: string;
    /** the input is not JSON, so JSON-specific affordances are hidden */
    freeformInput?: boolean;
    /** needs a second input document */
    dualInput?: boolean;
    /** syntax-highlight the output as JSON */
    highlightOutput?: boolean;
    /** placeholder for the input editor */
    placeholder?: string;
}

export const MODES: Record<WorkbenchMode, ModeSpec> = {
    viewer: { op: "parse", output: "tree", outputLabel: "Tree", filename: "document.json" },
    validator: { op: "validate", output: "report", outputLabel: "Result", filename: "report.txt" },
    jsonpath: { op: "jsonpath", output: "code", outputLabel: "Matches", filename: "matches.json", highlightOutput: true },
    size: { op: "size", output: "size", outputLabel: "Breakdown", filename: "size-report.txt" },

    formatter: { op: "format", output: "code", outputLabel: "Formatted", filename: "formatted.json", highlightOutput: true },
    minifier: { op: "minify", output: "code", outputLabel: "Minified", filename: "minified.json", highlightOutput: true },
    sort: { op: "sort", output: "code", outputLabel: "Sorted", filename: "sorted.json", highlightOutput: true },
    escape: {
        op: "escape", output: "code", outputLabel: "Result", filename: "escaped.txt", freeformInput: true,
        placeholder: "Paste JSON to escape, or an escaped string to unescape…",
    },

    flatten: { op: "flatten", output: "code", outputLabel: "Result", filename: "flattened.json", highlightOutput: true },
    merge: { op: "merge", output: "code", outputLabel: "Result", filename: "merged.json", dualInput: true, highlightOutput: true },
    base64: {
        op: "base64", output: "code", outputLabel: "Result", filename: "encoded.txt", freeformInput: true,
        placeholder: "Paste JSON to encode, or base64 to decode…",
    },
    jwt: {
        op: "jwt", output: "jwt", outputLabel: "Decoded", filename: "jwt.json", freeformInput: true,
        placeholder: "Paste a JWT (eyJhbGciOi…)",
    },

    csv: { op: "convert", output: "code", outputLabel: "CSV", filename: "data.csv" },
    yaml: { op: "convert", output: "code", outputLabel: "YAML", filename: "data.yaml" },
    xml: { op: "convert", output: "code", outputLabel: "XML", filename: "data.xml" },
    csvToJson: {
        op: "csvToJson", output: "code", outputLabel: "JSON", filename: "data.json", freeformInput: true,
        highlightOutput: true, placeholder: "Paste CSV, or drop a .csv file…",
    },
    ndjson: { op: "ndjson", output: "code", outputLabel: "Result", filename: "data.ndjson" },
    sql: { op: "sql", output: "code", outputLabel: "SQL", filename: "insert.sql" },

    typescript: { op: "types", output: "code", outputLabel: "TypeScript", filename: "types.ts" },
    go: { op: "types", output: "code", outputLabel: "Go", filename: "types.go" },
    python: { op: "types", output: "code", outputLabel: "Python", filename: "models.py" },
    rust: { op: "types", output: "code", outputLabel: "Rust", filename: "models.rs" },
    java: { op: "types", output: "code", outputLabel: "Java", filename: "Models.java" },
    csharp: { op: "types", output: "code", outputLabel: "C#", filename: "Models.cs" },
    kotlin: { op: "types", output: "code", outputLabel: "Kotlin", filename: "Models.kt" },
    zod: { op: "types", output: "code", outputLabel: "Zod", filename: "schema.ts", highlightOutput: false },
    schema: { op: "types", output: "code", outputLabel: "JSON Schema", filename: "schema.json", highlightOutput: true },
};

const TYPE_LANGUAGE: Partial<Record<WorkbenchMode, JobOptions["types"]["language"]>> = {
    typescript: "typescript", go: "go", python: "python", rust: "rust",
    java: "java", csharp: "csharp", kotlin: "kotlin", zod: "zod", schema: "schema",
};

export function typeLanguageFor(mode: WorkbenchMode) {
    return TYPE_LANGUAGE[mode];
}

const CONVERT_TARGET: Partial<Record<WorkbenchMode, JobOptions["convert"]["target"]>> = {
    csv: "csv", yaml: "yaml", xml: "xml",
};

export function convertTargetFor(mode: WorkbenchMode) {
    return CONVERT_TARGET[mode];
}
