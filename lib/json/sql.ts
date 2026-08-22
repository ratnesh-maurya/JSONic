/** JSON -> SQL DDL and INSERT statements. */

type Dict = Record<string, unknown>;
export type SqlDialect = "postgres" | "mysql" | "sqlite";

function isPlainObject(value: unknown): value is Dict {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

const TYPE_MAP: Record<SqlDialect, Record<string, string>> = {
    postgres: { string: "TEXT", integer: "BIGINT", number: "DOUBLE PRECISION", boolean: "BOOLEAN", json: "JSONB", unknown: "TEXT" },
    mysql: { string: "TEXT", integer: "BIGINT", number: "DOUBLE", boolean: "BOOLEAN", json: "JSON", unknown: "TEXT" },
    sqlite: { string: "TEXT", integer: "INTEGER", number: "REAL", boolean: "INTEGER", json: "TEXT", unknown: "TEXT" },
};

function quoteIdentifier(name: string, dialect: SqlDialect): string {
    const cleaned = name.replace(/[^\w]/g, "_");
    return dialect === "mysql" ? `\`${cleaned}\`` : `"${cleaned}"`;
}

function quoteLiteral(value: unknown, dialect: SqlDialect): string {
    if (value === null || value === undefined) return "NULL";
    if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
    if (typeof value === "boolean") return dialect === "sqlite" ? (value ? "1" : "0") : value ? "TRUE" : "FALSE";
    const text = typeof value === "object" ? JSON.stringify(value) : String(value);
    return `'${text.replace(/'/g, "''")}'`;
}

/** Widens across every row: one string in a column of numbers makes the column TEXT. */
function inferColumnType(values: unknown[]): string {
    let sawInteger = false;
    let sawFloat = false;
    let sawBoolean = false;
    let sawString = false;
    let sawJson = false;

    for (const value of values) {
        if (value === null || value === undefined) continue;
        if (typeof value === "number") { if (Number.isInteger(value)) sawInteger = true; else sawFloat = true; continue; }
        if (typeof value === "boolean") { sawBoolean = true; continue; }
        if (typeof value === "object") { sawJson = true; continue; }
        sawString = true;
    }

    if (sawString || (sawJson && (sawInteger || sawFloat || sawBoolean))) return "string";
    if (sawJson) return "json";
    if (sawFloat) return "number";
    if (sawInteger && !sawBoolean) return "integer";
    if (sawBoolean) return "boolean";
    return "unknown";
}

export interface SqlOptions {
    tableName: string;
    dialect: SqlDialect;
    createTable: boolean;
    /** one multi-row INSERT rather than one statement per record */
    batchInsert: boolean;
}

export const DEFAULT_SQL: SqlOptions = { tableName: "records", dialect: "postgres", createTable: true, batchInsert: true };

const MAX_INSERT_ROWS = 1000;

export function jsonToSql(root: unknown, options: SqlOptions = DEFAULT_SQL): string {
    const records = (Array.isArray(root) ? root : [root]).filter(isPlainObject);
    if (records.length === 0) return "-- No object records found. JSON to SQL expects an object or an array of objects.";

    const columns: string[] = [];
    const seen = new Set<string>();
    for (const record of records) {
        for (const key of Object.keys(record)) if (!seen.has(key)) { seen.add(key); columns.push(key); }
    }

    const table = quoteIdentifier(options.tableName, options.dialect);
    const out: string[] = [];

    if (options.createTable) {
        const definitions = columns.map((column) => {
            const kind = inferColumnType(records.map((record) => record[column]));
            const nullable = records.some((record) => record[column] === null || record[column] === undefined);
            return `  ${quoteIdentifier(column, options.dialect)} ${TYPE_MAP[options.dialect][kind]}${nullable ? "" : " NOT NULL"}`;
        });
        out.push(`CREATE TABLE ${table} (\n${definitions.join(",\n")}\n);`, "");
    }

    const columnList = columns.map((column) => quoteIdentifier(column, options.dialect)).join(", ");
    const rowLiteral = (record: Dict) =>
        `(${columns.map((column) => quoteLiteral(record[column], options.dialect)).join(", ")})`;

    if (options.batchInsert) {
        // chunked: a single INSERT with 100k rows exceeds most servers' packet limits
        for (let i = 0; i < records.length; i += MAX_INSERT_ROWS) {
            const chunk = records.slice(i, i + MAX_INSERT_ROWS);
            out.push(`INSERT INTO ${table} (${columnList}) VALUES\n${chunk.map((r) => `  ${rowLiteral(r)}`).join(",\n")};`);
        }
    } else {
        for (const record of records) out.push(`INSERT INTO ${table} (${columnList}) VALUES ${rowLiteral(record)};`);
    }

    return out.join("\n");
}
