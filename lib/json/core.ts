import { EMPTY_STATS, type JsonErrorPosition, type JsonStats, type JsonTypeCounts } from "./types";

/**
 * Turns a byte offset into a 1-based line/column in one pass.
 * The old implementation re-ran JSON.parse for every column of every line,
 * which is O(n^2) parses and hangs the tab on anything past a few hundred KB.
 */
export function offsetToLineColumn(text: string, offset: number): JsonErrorPosition {
    const clamped = Math.max(0, Math.min(offset, text.length));
    let line = 1;
    let lastNewline = -1;
    for (let i = 0; i < clamped; i++) {
        if (text.charCodeAt(i) === 10) {
            line++;
            lastNewline = i;
        }
    }
    return { line, column: clamped - lastNewline, offset: clamped };
}


/**
 * Single-pass JSON scanner used to locate a syntax error when the engine's
 * message carries no offset (V8 often reports only "Unexpected token 'o'").
 * Returns the offset of the first structural problem, or null if the text scans
 * cleanly. Iterative, so deeply nested documents cannot overflow the stack.
 */
export function scanJsonError(text: string): number | null {
    const n = text.length;
    let i = 0;
    const stack: Array<"object" | "array"> = [];

    const skipWs = () => {
        while (i < n) {
            const code = text.charCodeAt(i);
            if (code === 32 || code === 9 || code === 10 || code === 13) i++;
            else break;
        }
    };

    const scanString = (): boolean => {
        i++; // opening quote
        while (i < n) {
            const char = text[i];
            if (char === "\\") {
                const escaped = text[i + 1];
                if (escaped === undefined) return false;
                if ('"\\/bfnrt'.includes(escaped)) { i += 2; continue; }
                if (escaped === "u") {
                    if (!/^[0-9a-fA-F]{4}$/.test(text.slice(i + 2, i + 6))) return false;
                    i += 6;
                    continue;
                }
                return false;
            }
            if (char === '"') { i++; return true; }
            if (text.charCodeAt(i) < 0x20) return false; // raw control character
            i++;
        }
        return false;
    };

    const scanNumber = (): boolean => {
        const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(i, i + 64));
        if (!match || match[0].length === 0) return false;
        i += match[0].length;
        return true;
    };

    /** consumes `"key" :` inside an object */
    const scanKey = (): boolean => {
        skipWs();
        if (text[i] !== '"' || !scanString()) return false;
        skipWs();
        if (text[i] !== ":") return false;
        i++;
        return true;
    };

    let expect: "value" | "afterValue" = "value";

    for (;;) {
        if (expect === "value") {
            skipWs();
            if (i >= n) return i;
            const char = text[i];

            if (char === "{") {
                i++;
                stack.push("object");
                skipWs();
                if (text[i] === "}") { i++; stack.pop(); expect = "afterValue"; continue; }
                if (!scanKey()) return i;
                continue;
            }
            if (char === "[") {
                i++;
                stack.push("array");
                skipWs();
                if (text[i] === "]") { i++; stack.pop(); expect = "afterValue"; continue; }
                continue;
            }
            if (char === '"') {
                const start = i;
                if (!scanString()) return start;
                expect = "afterValue";
                continue;
            }
            if (text.startsWith("true", i)) { i += 4; expect = "afterValue"; continue; }
            if (text.startsWith("false", i)) { i += 5; expect = "afterValue"; continue; }
            if (text.startsWith("null", i)) { i += 4; expect = "afterValue"; continue; }
            if (char === "-" || (char >= "0" && char <= "9")) {
                const start = i;
                if (!scanNumber()) return start;
                expect = "afterValue";
                continue;
            }
            return i;
        }

        skipWs();
        if (stack.length === 0) return i < n ? i : null;

        const container = stack[stack.length - 1];
        const char = text[i];

        if (char === ",") {
            i++;
            if (container === "array") { expect = "value"; continue; }
            const start = i;
            if (!scanKey()) return start;
            expect = "value";
            continue;
        }
        if (container === "object" && char === "}") { i++; stack.pop(); continue; }
        if (container === "array" && char === "]") { i++; stack.pop(); continue; }
        return i; // wrong delimiter, or ran out of input mid-container
    }
}

/** V8/JSC/SpiderMonkey all report an offset; formats differ, so try each. */
export function errorPositionFromMessage(text: string, message: string): JsonErrorPosition {
    const atPosition = message.match(/at position (\d+)/i);
    if (atPosition) return offsetToLineColumn(text, Number(atPosition[1]));

    const lineCol = message.match(/line (\d+) column (\d+)/i);
    if (lineCol) return { line: Number(lineCol[1]), column: Number(lineCol[2]), offset: -1 };

    const jsc = message.match(/JSON Parse error.*?(\d+)/i);
    if (jsc) return offsetToLineColumn(text, Number(jsc[1]));

    // No offset in the message — locate the problem ourselves rather than
    // blaming the last line, which is almost never where the error is.
    const scanned = scanJsonError(text);
    return offsetToLineColumn(text, scanned ?? text.length);
}

export interface ParseResult {
    ok: boolean;
    value?: unknown;
    error?: string;
    position?: JsonErrorPosition;
}

export function parseJson(text: string): ParseResult {
    try {
        return { ok: true, value: JSON.parse(text) };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid JSON";
        return { ok: false, error: message, position: errorPositionFromMessage(text, message) };
    }
}

/**
 * Best-effort repair of the mistakes people actually paste: unquoted keys,
 * single-quoted strings, trailing commas, JS comments. Runs a real tokenizer
 * rather than global regex so it can't corrupt string contents.
 */
export function repairJson(input: string): string {
    let out = "";
    let i = 0;
    const n = input.length;

    const isKeyStart = (c: string) => /[A-Za-z_$]/.test(c);

    while (i < n) {
        const c = input[i];

        // double-quoted string: copy verbatim, honouring escapes
        if (c === '"') {
            let j = i + 1;
            out += c;
            while (j < n) {
                if (input[j] === "\\") {
                    out += input[j] + (input[j + 1] ?? "");
                    j += 2;
                    continue;
                }
                out += input[j];
                if (input[j] === '"') { j++; break; }
                j++;
            }
            i = j;
            continue;
        }

        // single-quoted string -> double-quoted
        if (c === "'") {
            let j = i + 1;
            let body = "";
            while (j < n) {
                if (input[j] === "\\") {
                    const escaped = input[j + 1] ?? "";
                    // \' is legal inside a single-quoted string but not in JSON
                    if (escaped === "'") body += "'";
                    else if (escaped === '"') body += '\\"';
                    else body += input[j] + escaped;
                    j += 2;
                    continue;
                }
                if (input[j] === "'") { j++; break; }
                body += input[j] === '"' ? '\\"' : input[j];
                j++;
            }
            out += `"${body}"`;
            i = j;
            continue;
        }

        // comments
        if (c === "/" && input[i + 1] === "/") {
            while (i < n && input[i] !== "\n") i++;
            continue;
        }
        if (c === "/" && input[i + 1] === "*") {
            i += 2;
            while (i < n && !(input[i] === "*" && input[i + 1] === "/")) i++;
            i += 2;
            continue;
        }

        // trailing comma before } or ]
        if (c === ",") {
            let k = i + 1;
            while (k < n && /\s/.test(input[k])) k++;
            if (input[k] === "}" || input[k] === "]") { i++; continue; }
            out += c;
            i++;
            continue;
        }

        // bare identifier used as a key -> quote it
        if (isKeyStart(c)) {
            let j = i;
            while (j < n && /[\w$]/.test(input[j])) j++;
            const word = input.slice(i, j);
            let k = j;
            while (k < n && /\s/.test(input[k])) k++;
            if (input[k] === ":" && !["true", "false", "null"].includes(word)) {
                out += `"${word}"`;
            } else {
                out += word;
            }
            i = j;
            continue;
        }

        out += c;
        i++;
    }

    return out;
}

export function sortObjectKeys(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(sortObjectKeys);
    if (typeof value !== "object" || value === null) return value;
    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) result[key] = sortObjectKeys(source[key]);
    return result;
}

/**
 * Single traversal for node count, depth and type histogram.
 * The old version called JSON.stringify at every node (O(n^2) bytes);
 * size now comes from the source string length instead.
 */
export function computeStats(value: unknown, sizeBytes: number): JsonStats {
    const types: JsonTypeCounts = { strings: 0, numbers: 0, booleans: 0, nulls: 0, objects: 0, arrays: 0 };
    let nodes = 0;
    let maxDepth = 0;

    // explicit stack — deep documents would blow the call stack with recursion
    const stack: Array<{ value: unknown; depth: number }> = [{ value, depth: 0 }];
    while (stack.length) {
        const { value: current, depth } = stack.pop()!;
        nodes++;
        if (depth > maxDepth) maxDepth = depth;

        if (current === null) { types.nulls++; continue; }
        if (Array.isArray(current)) {
            types.arrays++;
            for (let i = current.length - 1; i >= 0; i--) stack.push({ value: current[i], depth: depth + 1 });
            continue;
        }
        switch (typeof current) {
            case "string": types.strings++; break;
            case "number": types.numbers++; break;
            case "boolean": types.booleans++; break;
            case "object": {
                types.objects++;
                const entries = Object.values(current as Record<string, unknown>);
                for (let i = entries.length - 1; i >= 0; i--) stack.push({ value: entries[i], depth: depth + 1 });
                break;
            }
        }
    }

    return { nodes, depth: maxDepth, size: sizeBytes, types };
}

export { EMPTY_STATS };

export function validationSuggestions(source: string, parsed: unknown): string[] {
    const out: string[] = [];
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        const keys = Object.keys(parsed as Record<string, unknown>);
        if (keys.some((k) => k.includes(" "))) out.push("Some keys contain spaces — camelCase or snake_case travels better across languages.");
        if (keys.length > 40) out.push(`${keys.length} keys on the root object — consider grouping into nested objects.`);
    }
    if (Array.isArray(parsed) && parsed.length > 5000) out.push(`${parsed.length} array items — paginate or stream this on the wire.`);
    if (source.length > 1_000_000) out.push("Over 1 MB — gzip/brotli on transport and consider NDJSON for streaming.");
    return out;
}

export function fixSuggestions(source: string, message: string): string[] {
    const out: string[] = [];
    if (/unexpected end/i.test(message)) out.push("Unbalanced brackets — a closing } or ] is missing.");
    if (/unexpected token/i.test(message)) out.push("Check for an unescaped quote, a stray comma, or a value that is not quoted.");
    if (/,\s*[}\]]/.test(source)) out.push("Trailing comma before a closing bracket — JSON does not allow it.");
    if (/'/.test(source)) out.push("Single-quoted strings found — JSON requires double quotes.");
    if (/[{,]\s*[A-Za-z_$][\w$]*\s*:/.test(source)) out.push("Unquoted property names found — wrap keys in double quotes.");
    if (/\/\/|\/\*/.test(source)) out.push("Comments found — JSON has no comment syntax.");
    if (/\bNaN\b|\bInfinity\b|\bundefined\b/.test(source)) out.push("NaN / Infinity / undefined are not valid JSON values.");
    if (out.length === 0) out.push("Run Auto-fix to repair the common cases automatically.");
    return out;
}
