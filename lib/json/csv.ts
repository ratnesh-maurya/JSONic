/** CSV -> JSON and NDJSON conversion. RFC 4180 parsing, no dependencies. */

type Dict = Record<string, unknown>;

export interface CsvConfig {
    delimiter: string;
    /** first row supplies the column names */
    header: boolean;
    /** turn "42" into 42, "true" into true, "" into null */
    inferTypes: boolean;
}

export const DEFAULT_CSV: CsvConfig = { delimiter: ",", header: true, inferTypes: true };

/** Handles quoted fields, escaped quotes ("" inside a field) and embedded newlines. */
export function parseCsv(input: string, delimiter = ","): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let inQuotes = false;
    let i = 0;
    const n = input.length;

    const endField = () => { row.push(field); field = ""; };
    const endRow = () => { endField(); rows.push(row); row = []; };

    while (i < n) {
        const char = input[i];

        if (inQuotes) {
            if (char === '"') {
                if (input[i + 1] === '"') { field += '"'; i += 2; continue; } // escaped quote
                inQuotes = false;
                i++;
                continue;
            }
            field += char;
            i++;
            continue;
        }

        if (char === '"' && field === "") { inQuotes = true; i++; continue; }
        if (input.startsWith(delimiter, i)) { endField(); i += delimiter.length; continue; }
        if (char === "\r") { i++; continue; }
        if (char === "\n") { endRow(); i++; continue; }

        field += char;
        i++;
    }

    // a file not ending in a newline still has a final row
    if (field !== "" || row.length > 0) endRow();
    return rows;
}

function inferValue(raw: string): unknown {
    if (raw === "") return null;
    if (raw === "true") return true;
    if (raw === "false") return false;
    if (raw === "null") return null;
    // avoid turning "0123" (a zip code, an id) into 123
    if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(raw)) {
        const numeric = Number(raw);
        if (Number.isFinite(numeric)) return numeric;
    }
    return raw;
}

export function csvToJson(input: string, config: CsvConfig = DEFAULT_CSV): unknown[] {
    const rows = parseCsv(input.trim(), config.delimiter).filter((row) => row.length > 1 || row[0] !== "");
    if (rows.length === 0) return [];

    const columns = config.header
        ? rows[0].map((name, i) => name.trim() || `column_${i + 1}`)
        : rows[0].map((_, i) => `column_${i + 1}`);
    const body = config.header ? rows.slice(1) : rows;

    return body.map((row) => {
        const record: Dict = {};
        columns.forEach((column, i) => {
            const raw = row[i] ?? "";
            record[column] = config.inferTypes ? inferValue(raw) : raw;
        });
        return record;
    });
}

// ---------------------------------------------------------------- NDJSON

/** Array -> one compact JSON document per line. */
export function jsonToNdjson(root: unknown): string {
    const records = Array.isArray(root) ? root : [root];
    return records.map((record) => JSON.stringify(record)).join("\n");
}

/** One document per line -> array. Reports which line failed rather than the offset. */
export function ndjsonToJson(input: string, indent = 2): string {
    const records: unknown[] = [];
    const lines = input.split("\n");
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        try {
            records.push(JSON.parse(line));
        } catch (error) {
            throw new Error(`Line ${i + 1}: ${error instanceof Error ? error.message : "invalid JSON"}`);
        }
    }
    return JSON.stringify(records, null, indent);
}
