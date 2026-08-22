/**
 * Additional language targets. Every generator reuses the inference in
 * codegen.ts — `mergeSamples` unions the shape of all array elements and
 * `optionalKeys` finds keys missing from some of them — so optional/nullable
 * detection behaves identically across all of them.
 */

import { type Dict, isPlainObject, mergeSamples, optionalKeys, pascalCase } from "./codegen";

function snakeCase(input: string): string {
    return input
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/[^\w]+/g, "_")
        .toLowerCase()
        .replace(/^_+|_+$/g, "") || "field";
}

function camelCase(input: string): string {
    const pascal = pascalCase(input);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Shared driver: walks the document, emits one named type per object shape, and
 * returns them with the root first. `emit` renders a single type from its fields.
 */
interface Field {
    key: string;
    type: string;
    optional: boolean;
}

interface LangSpec {
    scalar: (value: unknown, optional: boolean) => string;
    array: (element: string) => string;
    emptyArray: string;
    reference: (name: string, optional: boolean) => string;
    emit: (name: string, fields: Field[]) => string;
    /** prepended once, e.g. imports */
    preamble?: string;
}

function generate(root: unknown, rootName: string, spec: LangSpec): string {
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

    const typeOf = (value: unknown, hint: string, optional: boolean): string => {
        if (Array.isArray(value)) {
            if (value.length === 0) return spec.emptyArray;
            const sample = mergeSamples(value);
            if (isPlainObject(sample)) return spec.array(emitType(sample, `${hint}Item`, optionalKeys(value)));
            return spec.array(typeOf(sample, `${hint}Item`, false));
        }
        if (isPlainObject(value)) return spec.reference(emitType(value, hint, new Set()), optional);
        return spec.scalar(value, optional);
    };

    const emitType = (object: Dict, hint: string, optional: Set<string>): string => {
        const name = uniqueName(hint);
        const fields: Field[] = Object.entries(object).map(([key, value]) => ({
            key,
            type: typeOf(value, pascalCase(key), optional.has(key)),
            optional: optional.has(key),
        }));
        emitted.set(name, spec.emit(name, fields));
        return name;
    };

    if (isPlainObject(root)) {
        emitType(root, rootName, new Set());
    } else if (Array.isArray(root)) {
        if (root.length === 0) return `${spec.preamble ?? ""}// empty array — no shape to infer`;
        const sample = mergeSamples(root);
        if (isPlainObject(sample)) {
            emitType(sample, `${rootName}Item`, optionalKeys(root));
        } else {
            return `${spec.preamble ?? ""}// root is an array of ${typeOf(sample, rootName, false)}`;
        }
    } else {
        return `${spec.preamble ?? ""}// root is a scalar: ${typeOf(root, rootName, false)}`;
    }

    const body = [...emitted.values()].reverse().join("\n\n");
    return `${spec.preamble ?? ""}${body}`;
}

// ---------------------------------------------------------------- Python

export function jsonToPython(root: unknown, style: "dataclass" | "typeddict" = "dataclass"): string {
    const scalar = (value: unknown, optional: boolean) => {
        const base = value === null ? "Any"
            : typeof value === "string" ? "str"
                : typeof value === "boolean" ? "bool"
                    : typeof value === "number" ? (Number.isInteger(value) ? "int" : "float")
                        : "Any";
        return optional ? `Optional[${base}]` : base;
    };

    return generate(root, "Root", {
        preamble: style === "dataclass"
            ? "from dataclasses import dataclass, field\nfrom typing import Any, List, Optional\n\n\n"
            : "from typing import Any, List, Optional, TypedDict\n\n\n",
        scalar,
        array: (element) => `List[${element}]`,
        emptyArray: "List[Any]",
        reference: (name, optional) => (optional ? `Optional[${name}]` : name),
        emit: (name, fields) => {
            const lines = fields.map((f) => {
                const attribute = snakeCase(f.key);
                // dataclasses require defaults after any defaulted field, so
                // optional entries default to None
                const suffix = style === "dataclass" && f.optional ? " = None" : "";
                const alias = attribute !== f.key ? `  # ${f.key}` : "";
                return `    ${attribute}: ${f.type}${suffix}${alias}`;
            });
            const body = lines.length ? lines.join("\n") : "    pass";
            return style === "dataclass"
                ? `@dataclass\nclass ${name}:\n${body}`
                : `class ${name}(TypedDict, total=False):\n${body}`;
        },
    });
}

// ---------------------------------------------------------------- Rust

export function jsonToRust(root: unknown): string {
    return generate(root, "Root", {
        preamble: "use serde::{Deserialize, Serialize};\n\n",
        scalar: (value, optional) => {
            const base = value === null ? "serde_json::Value"
                : typeof value === "string" ? "String"
                    : typeof value === "boolean" ? "bool"
                        : typeof value === "number" ? (Number.isInteger(value) ? "i64" : "f64")
                            : "serde_json::Value";
            return optional ? `Option<${base}>` : base;
        },
        array: (element) => `Vec<${element}>`,
        emptyArray: "Vec<serde_json::Value>",
        reference: (name, optional) => (optional ? `Option<${name}>` : name),
        emit: (name, fields) => {
            const lines = fields.map((f) => {
                const ident = snakeCase(f.key);
                // serde needs an explicit rename whenever the Rust ident differs
                const rename = ident !== f.key ? `    #[serde(rename = "${f.key}")]\n` : "";
                return `${rename}    pub ${ident}: ${f.type},`;
            });
            const body = lines.length ? `\n${lines.join("\n")}\n` : "";
            return `#[derive(Debug, Clone, Serialize, Deserialize)]\npub struct ${name} {${body}}`;
        },
    });
}

// ---------------------------------------------------------------- Java

export function jsonToJava(root: unknown, style: "record" | "class" = "record"): string {
    const scalar = (value: unknown, optional: boolean) => {
        if (value === null) return "Object";
        if (typeof value === "string") return "String";
        // boxed types so a missing key can be null
        if (typeof value === "boolean") return optional ? "Boolean" : "boolean";
        if (typeof value === "number") return Number.isInteger(value) ? (optional ? "Long" : "long") : optional ? "Double" : "double";
        return "Object";
    };

    return generate(root, "Root", {
        preamble: "import com.fasterxml.jackson.annotation.JsonProperty;\nimport java.util.List;\n\n",
        scalar,
        array: (element) => `List<${element}>`,
        emptyArray: "List<Object>",
        reference: (name) => name,
        emit: (name, fields) => {
            if (style === "record") {
                const params = fields.map((f) => `    @JsonProperty("${f.key}") ${f.type} ${camelCase(f.key)}`);
                return `public record ${name}(\n${params.join(",\n")}\n) {}`;
            }
            const members = fields.map((f) => `    @JsonProperty("${f.key}")\n    private ${f.type} ${camelCase(f.key)};`);
            const accessors = fields.map((f) => {
                const method = pascalCase(f.key);
                const variable = camelCase(f.key);
                return `    public ${f.type} get${method}() { return ${variable}; }\n    public void set${method}(${f.type} ${variable}) { this.${variable} = ${variable}; }`;
            });
            return `public class ${name} {\n${members.join("\n")}\n\n${accessors.join("\n")}\n}`;
        },
    });
}

// ---------------------------------------------------------------- C#

export function jsonToCSharp(root: unknown): string {
    return generate(root, "Root", {
        preamble: "using System.Collections.Generic;\nusing System.Text.Json.Serialization;\n\n",
        scalar: (value, optional) => {
            if (value === null) return "object?";
            const base = typeof value === "string" ? "string"
                : typeof value === "boolean" ? "bool"
                    : typeof value === "number" ? (Number.isInteger(value) ? "long" : "double")
                        : "object";
            // reference types are already nullable under nullable reference types
            return optional ? (base === "string" ? "string?" : `${base}?`) : base;
        },
        array: (element) => `List<${element}>`,
        emptyArray: "List<object>",
        reference: (name, optional) => (optional ? `${name}?` : name),
        emit: (name, fields) => {
            const members = fields.map(
                (f) => `    [JsonPropertyName("${f.key}")]\n    public ${f.type} ${pascalCase(f.key)} { get; set; }`,
            );
            const body = members.length ? `\n${members.join("\n\n")}\n` : "";
            return `public class ${name}\n{${body}}`;
        },
    });
}

// ---------------------------------------------------------------- Kotlin

export function jsonToKotlin(root: unknown): string {
    return generate(root, "Root", {
        preamble: "import kotlinx.serialization.SerialName\nimport kotlinx.serialization.Serializable\n\n",
        scalar: (value, optional) => {
            const base = value === null ? "String?"
                : typeof value === "string" ? "String"
                    : typeof value === "boolean" ? "Boolean"
                        : typeof value === "number" ? (Number.isInteger(value) ? "Long" : "Double")
                            : "String";
            return optional && !base.endsWith("?") ? `${base}?` : base;
        },
        array: (element) => `List<${element}>`,
        emptyArray: "List<String>",
        reference: (name, optional) => (optional ? `${name}?` : name),
        emit: (name, fields) => {
            const lines = fields.map((f) => {
                const property = camelCase(f.key);
                const annotation = property !== f.key ? `    @SerialName("${f.key}")\n` : "";
                const fallback = f.optional ? " = null" : "";
                return `${annotation}    val ${property}: ${f.type}${fallback},`;
            });
            const body = lines.length ? `\n${lines.join("\n").replace(/,$/, "")}\n` : "";
            return `@Serializable\ndata class ${name}(${body})`;
        },
    });
}

// ---------------------------------------------------------------- Zod

export function jsonToZod(root: unknown): string {
    const emitted: string[] = [];
    const used = new Set<string>();

    const uniqueName = (base: string) => {
        const name = camelCase(`${pascalCase(base)}Schema`);
        if (!used.has(name)) { used.add(name); return name; }
        let i = 2;
        while (used.has(`${name}${i}`)) i++;
        used.add(`${name}${i}`);
        return `${name}${i}`;
    };

    /**
     * `optional` describes the object in `value`, and has to be supplied by the
     * caller: for an array element it can only be derived from the whole array,
     * which the merged sample no longer carries.
     */
    const schemaFor = (value: unknown, hint: string, optional: Set<string> = new Set()): string => {
        if (value === null) return "z.null()";
        if (Array.isArray(value)) {
            if (value.length === 0) return "z.array(z.unknown())";
            const sample = mergeSamples(value);
            return `z.array(${schemaFor(sample, `${hint}Item`, optionalKeys(value))})`;
        }
        if (isPlainObject(value)) {
            const name = uniqueName(hint);
            const entries = Object.entries(value).map(([key, child]) => {
                const safeKey = /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
                return `  ${safeKey}: ${schemaFor(child, pascalCase(key))}${optional.has(key) ? ".optional()" : ""},`;
            });
            // emitted in dependency order: children are pushed before the parent
            emitted.push(`export const ${name} = z.object({\n${entries.join("\n")}\n});`);
            return name;
        }
        if (typeof value === "string") return "z.string()";
        if (typeof value === "boolean") return "z.boolean()";
        if (typeof value === "number") return Number.isInteger(value) ? "z.number().int()" : "z.number()";
        return "z.unknown()";
    };

    if (isPlainObject(root)) {
        const optional = optionalKeys([root]);
        const entries = Object.entries(root).map(([key, child]) => {
            const safeKey = /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
            return `  ${safeKey}: ${schemaFor(child, pascalCase(key))}${optional.has(key) ? ".optional()" : ""},`;
        });
        emitted.push(`export const rootSchema = z.object({\n${entries.join("\n")}\n});`);
        emitted.push(`export type Root = z.infer<typeof rootSchema>;`);
    } else if (Array.isArray(root)) {
        const sample = root.length ? mergeSamples(root) : null;
        const inner = root.length ? schemaFor(sample, "Root") : "z.unknown()";
        emitted.push(`export const rootSchema = z.array(${inner});`);
        emitted.push(`export type Root = z.infer<typeof rootSchema>;`);
    } else {
        emitted.push(`export const rootSchema = ${schemaFor(root, "Root")};`);
    }

    return `import { z } from "zod";\n\n${emitted.join("\n\n")}`;
}
