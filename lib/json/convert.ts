/** JSON -> CSV / YAML / XML. Kept dependency-free and worker-side. */

type Dict = Record<string, unknown>;

function isPlainObject(value: unknown): value is Dict {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Flattens nested structures into dotted column names so any shape can be tabular. */
function flattenRow(value: unknown, prefix = "", out: Dict = {}): Dict {
    if (isPlainObject(value)) {
        for (const [key, child] of Object.entries(value)) flattenRow(child, prefix ? `${prefix}.${key}` : key, out);
    } else if (Array.isArray(value)) {
        value.forEach((child, i) => flattenRow(child, `${prefix}[${i}]`, out));
    } else {
        out[prefix || "value"] = value;
    }
    return out;
}

function csvCell(value: unknown): string {
    if (value === null || value === undefined) return "";
    const text = typeof value === "object" ? JSON.stringify(value) : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(root: unknown): string {
    const records = Array.isArray(root) ? root : [root];
    const rows = records.map((record) => flattenRow(record));
    const columns: string[] = [];
    const seen = new Set<string>();
    for (const row of rows) for (const key of Object.keys(row)) if (!seen.has(key)) { seen.add(key); columns.push(key); }
    const lines = [columns.map(csvCell).join(",")];
    for (const row of rows) lines.push(columns.map((c) => csvCell(row[c])).join(","));
    return lines.join("\n");
}

const YAML_PLAIN = /^[A-Za-z_][\w./-]*$/;

function yamlScalar(value: unknown): string {
    if (value === null) return "null";
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    const text = String(value);
    if (text === "") return '""';
    // quote anything that YAML would otherwise reinterpret
    if (!YAML_PLAIN.test(text) || ["true", "false", "null", "yes", "no", "on", "off"].includes(text.toLowerCase())) {
        return JSON.stringify(text);
    }
    return text;
}

export function toYaml(root: unknown, indent = 0): string {
    const pad = "  ".repeat(indent);

    if (Array.isArray(root)) {
        if (root.length === 0) return `${pad}[]`;
        return root
            .map((item) => {
                if (isPlainObject(item) || Array.isArray(item)) {
                    const nested = toYaml(item, indent + 1);
                    return `${pad}-\n${nested}`;
                }
                return `${pad}- ${yamlScalar(item)}`;
            })
            .join("\n");
    }

    if (isPlainObject(root)) {
        const entries = Object.entries(root);
        if (entries.length === 0) return `${pad}{}`;
        return entries
            .map(([key, value]) => {
                const name = YAML_PLAIN.test(key) ? key : JSON.stringify(key);
                if (isPlainObject(value) || Array.isArray(value)) {
                    const empty = (Array.isArray(value) && value.length === 0) || (isPlainObject(value) && Object.keys(value).length === 0);
                    if (empty) return `${pad}${name}: ${Array.isArray(value) ? "[]" : "{}"}`;
                    return `${pad}${name}:\n${toYaml(value, indent + 1)}`;
                }
                return `${pad}${name}: ${yamlScalar(value)}`;
            })
            .join("\n");
    }

    return `${pad}${yamlScalar(root)}`;
}

function xmlEscape(text: string): string {
    return text.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}

function xmlTag(name: string): string {
    const cleaned = name.replace(/[^\w.-]/g, "_");
    return /^[A-Za-z_]/.test(cleaned) ? cleaned : `_${cleaned}`;
}

export function toXml(root: unknown, name = "root", indent = 0): string {
    const pad = "  ".repeat(indent);
    const tag = xmlTag(name);

    if (Array.isArray(root)) {
        const children = root.map((item) => toXml(item, "item", indent + 1)).join("\n");
        return `${pad}<${tag}>\n${children}\n${pad}</${tag}>`;
    }
    if (isPlainObject(root)) {
        const children = Object.entries(root).map(([key, value]) => toXml(value, key, indent + 1)).join("\n");
        return children ? `${pad}<${tag}>\n${children}\n${pad}</${tag}>` : `${pad}<${tag}/>`;
    }
    if (root === null) return `${pad}<${tag} nil="true"/>`;
    return `${pad}<${tag}>${xmlEscape(String(root))}</${tag}>`;
}
