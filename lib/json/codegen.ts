/**
 * JSON -> Go / TypeScript type generation.
 *
 * Both generators merge across *all* array elements rather than sampling only
 * element 0, so heterogeneous arrays produce a type that actually compiles.
 * Nested types are emitted once and deduplicated by name.
 */

export type Dict = Record<string, unknown>;

const RESERVED_GO = new Set(["type", "func", "range", "map", "chan", "select", "go", "defer"]);

export function pascalCase(input: string): string {
    const cleaned = input.replace(/[^\w]+/g, "_");
    const parts = cleaned.split(/[_\-\s]+/).filter(Boolean);
    if (parts.length === 0) return "Field";
    const joined = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
    return /^\d/.test(joined) ? `F${joined}` : joined;
}

export function isPlainObject(value: unknown): value is Dict {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Union of the shapes seen across every element of an array. */
export function mergeSamples(values: unknown[]): unknown {
    const objects = values.filter(isPlainObject);
    if (objects.length === 0) return values[0];
    const merged: Dict = {};
    for (const object of objects) {
        for (const [key, value] of Object.entries(object)) {
            if (!(key in merged) || merged[key] === null || merged[key] === undefined) merged[key] = value;
            else if (isPlainObject(merged[key]) && isPlainObject(value)) merged[key] = mergeSamples([merged[key], value]);
        }
    }
    return merged;
}

/** Keys absent from some elements become optional/pointer fields. */
export function optionalKeys(values: unknown[]): Set<string> {
    const objects = values.filter(isPlainObject);
    if (objects.length < 2) return new Set();
    const counts = new Map<string, number>();
    for (const object of objects) for (const key of Object.keys(object)) counts.set(key, (counts.get(key) ?? 0) + 1);
    const optional = new Set<string>();
    for (const [key, count] of counts) if (count < objects.length) optional.add(key);
    return optional;
}

// ---------------------------------------------------------------- Go

export function jsonToGo(root: unknown, rootName = "Root"): string {
    const emitted = new Map<string, string>();
    const used = new Set<string>();

    const uniqueName = (base: string): string => {
        const name = pascalCase(base);
        if (!used.has(name)) { used.add(name); return name; }
        let i = 2;
        while (used.has(`${name}${i}`)) i++;
        used.add(`${name}${i}`);
        return `${name}${i}`;
    };

    const goType = (value: unknown, nameHint: string, optional: boolean): string => {
        if (value === null || value === undefined) return "interface{}";
        if (Array.isArray(value)) {
            if (value.length === 0) return "[]interface{}";
            const sample = mergeSamples(value);
            if (isPlainObject(sample)) {
                // keys missing from some elements become pointer + omitempty
                return `[]${emitStruct(sample, `${nameHint}Item`, optionalKeys(value))}`;
            }
            return `[]${goType(sample, `${nameHint}Item`, false)}`;
        }
        if (isPlainObject(value)) {
            const structName = emitStruct(value, nameHint, new Set());
            return optional ? `*${structName}` : structName;
        }
        switch (typeof value) {
            case "string": return optional ? "*string" : "string";
            case "boolean": return optional ? "*bool" : "bool";
            case "number": {
                const t = Number.isInteger(value) ? "int64" : "float64";
                return optional ? `*${t}` : t;
            }
            default: return "interface{}";
        }
    };

    const emitStruct = (object: Dict, nameHint: string, optional: Set<string>): string => {
        const name = uniqueName(nameHint);
        const lines: string[] = [];
        for (const [key, value] of Object.entries(object)) {
            let field = pascalCase(key);
            if (RESERVED_GO.has(field.toLowerCase()) && field.toLowerCase() === field) field = `${field}Field`;
            const isOptional = optional.has(key);
            const type = goType(value, field, isOptional);
            const tag = isOptional ? `\`json:"${key},omitempty"\`` : `\`json:"${key}"\``;
            lines.push(`\t${field} ${type} ${tag}`);
        }
        const body = lines.length ? `\n${lines.join("\n")}\n` : "";
        emitted.set(name, `type ${name} struct {${body}}`);
        return name;
    };

    if (isPlainObject(root)) {
        emitStruct(root, rootName, new Set());
    } else if (Array.isArray(root)) {
        if (root.length === 0) return `type ${pascalCase(rootName)} []interface{}`;
        const sample = mergeSamples(root);
        if (isPlainObject(sample)) {
            const item = emitStruct(sample, `${rootName}Item`, optionalKeys(root));
            return [`type ${pascalCase(rootName)} []${item}`, ...emitted.values()].join("\n\n");
        }
        return `type ${pascalCase(rootName)} []${goType(sample, rootName, false)}`;
    } else {
        return `type ${pascalCase(rootName)} ${goType(root, rootName, false)}`;
    }

    // structs are emitted innermost-first; reverse so Root reads at the top
    return [...emitted.values()].reverse().join("\n\n");
}

// ---------------------------------------------------------------- TypeScript

export function jsonToTypeScript(root: unknown, rootName = "Root"): string {
    const emitted = new Map<string, string>();
    const used = new Set<string>();

    const uniqueName = (base: string): string => {
        const name = pascalCase(base);
        if (!used.has(name)) { used.add(name); return name; }
        let i = 2;
        while (used.has(`${name}${i}`)) i++;
        used.add(`${name}${i}`);
        return `${name}${i}`;
    };

    const tsType = (value: unknown, nameHint: string): string => {
        if (value === null || value === undefined) return "null";
        if (Array.isArray(value)) {
            if (value.length === 0) return "unknown[]";
            const sample = mergeSamples(value);
            if (isPlainObject(sample)) {
                // keys missing from some elements become optional properties
                return `${emitInterface(sample, `${nameHint}Item`, optionalKeys(value))}[]`;
            }
            return `${tsType(sample, `${nameHint}Item`)}[]`;
        }
        if (isPlainObject(value)) return emitInterface(value, nameHint, new Set());
        switch (typeof value) {
            case "string": return "string";
            case "number": return "number";
            case "boolean": return "boolean";
            default: return "unknown";
        }
    };

    const emitInterface = (object: Dict, nameHint: string, optional: Set<string>): string => {
        const name = uniqueName(nameHint);
        const lines: string[] = [];
        for (const [key, value] of Object.entries(object)) {
            const safeKey = /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
            const type = tsType(value, pascalCase(key));
            lines.push(`  ${safeKey}${optional.has(key) ? "?" : ""}: ${type};`);
        }
        const body = lines.length ? `\n${lines.join("\n")}\n` : "";
        emitted.set(name, `export interface ${name} {${body}}`);
        return name;
    };

    if (isPlainObject(root)) {
        emitInterface(root, rootName, new Set());
        return [...emitted.values()].reverse().join("\n\n");
    }
    if (Array.isArray(root)) {
        if (root.length === 0) return `export type ${pascalCase(rootName)} = unknown[];`;
        const sample = mergeSamples(root);
        if (isPlainObject(sample)) {
            const item = emitInterface(sample, `${rootName}Item`, optionalKeys(root));
            return [`export type ${pascalCase(rootName)} = ${item}[];`, ...[...emitted.values()].reverse()].join("\n\n");
        }
        return `export type ${pascalCase(rootName)} = ${tsType(sample, rootName)}[];`;
    }
    return `export type ${pascalCase(rootName)} = ${tsType(root, rootName)};`;
}

// ---------------------------------------------------------------- JSON Schema

export function jsonToSchema(root: unknown): string {
    const build = (value: unknown): Record<string, unknown> => {
        if (value === null) return { type: "null" };
        if (Array.isArray(value)) {
            if (value.length === 0) return { type: "array", items: {} };
            return { type: "array", items: build(mergeSamples(value)) };
        }
        if (isPlainObject(value)) {
            const properties: Record<string, unknown> = {};
            for (const [key, child] of Object.entries(value)) properties[key] = build(child);
            return { type: "object", properties, required: Object.keys(value) };
        }
        if (typeof value === "number") return { type: Number.isInteger(value) ? "integer" : "number" };
        return { type: typeof value };
    };

    return JSON.stringify({ $schema: "https://json-schema.org/draft/2020-12/schema", ...build(root) }, null, 2);
}
