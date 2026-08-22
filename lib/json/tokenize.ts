export type TokenType = "key" | "string" | "number" | "boolean" | "null" | "punctuation" | "plain";

export interface Token {
    type: TokenType;
    value: string;
}

/**
 * Tokenizes a *single line*. The old highlighter tokenized the whole document
 * into one span per token; here the virtualized viewer calls this only for the
 * ~50 lines actually on screen, so cost is independent of document size.
 */
export function tokenizeLine(line: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    const n = line.length;

    while (i < n) {
        const char = line[i];

        if (char === '"') {
            let j = i + 1;
            while (j < n) {
                if (line[j] === "\\") { j += 2; continue; }
                if (line[j] === '"') break;
                j++;
            }
            const text = line.slice(i, Math.min(j + 1, n));
            // a colon after the closing quote makes it a key
            let k = j + 1;
            while (k < n && line[k] === " ") k++;
            tokens.push({ type: line[k] === ":" ? "key" : "string", value: text });
            i = j + 1;
            continue;
        }

        if (char === "-" || (char >= "0" && char <= "9")) {
            const match = /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(line.slice(i));
            if (match) {
                tokens.push({ type: "number", value: match[0] });
                i += match[0].length;
                continue;
            }
        }

        if (line.startsWith("true", i) || line.startsWith("false", i)) {
            const word = line.startsWith("true", i) ? "true" : "false";
            tokens.push({ type: "boolean", value: word });
            i += word.length;
            continue;
        }

        if (line.startsWith("null", i)) {
            tokens.push({ type: "null", value: "null" });
            i += 4;
            continue;
        }

        if ("{}[],:".includes(char)) {
            tokens.push({ type: "punctuation", value: char });
            i++;
            continue;
        }

        // runs of whitespace/other collapse into one plain token
        let j = i;
        while (j < n && !'"{}[],:'.includes(line[j]) && !/[-\d]/.test(line[j]) && !line.startsWith("true", j) && !line.startsWith("false", j) && !line.startsWith("null", j)) j++;
        tokens.push({ type: "plain", value: line.slice(i, Math.max(j, i + 1)) });
        i = Math.max(j, i + 1);
    }

    return tokens;
}

export const TOKEN_CLASS: Record<TokenType, string> = {
    key: "text-sky-700 dark:text-sky-300",
    string: "text-emerald-700 dark:text-emerald-300",
    number: "text-violet-700 dark:text-violet-300",
    boolean: "text-rose-700 dark:text-rose-300",
    null: "text-gray-500 dark:text-gray-400",
    punctuation: "text-gray-500 dark:text-gray-400",
    plain: "text-gray-800 dark:text-gray-200",
};

/**
 * Splits text into lines without building one giant array for huge documents.
 * Returns line start offsets so a line can be sliced on demand.
 */
export function lineIndex(text: string): number[] {
    const starts = [0];
    for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) starts.push(i + 1);
    return starts;
}

export function lineAt(text: string, starts: number[], index: number): string {
    const start = starts[index];
    if (start === undefined) return "";
    const end = index + 1 < starts.length ? starts[index + 1] - 1 : text.length;
    return text.slice(start, end);
}
