/// <reference lib="webworker" />

import { computeStats, parseJson, repairJson, sortObjectKeys, validationSuggestions } from "./core";
import { jsonToGo, jsonToSchema, jsonToTypeScript } from "./codegen";
import { jsonToCSharp, jsonToJava, jsonToKotlin, jsonToPython, jsonToRust, jsonToZod } from "./codegen-langs";
import { toCsv, toXml, toYaml } from "./convert";
import { analyseSize, deepMerge, flattenObject, jsonPatch, mergePatch, sortJson, unflattenObject } from "./structure";
import { csvToJson, jsonToNdjson, ndjsonToJson } from "./csv";
import { jsonToSql } from "./sql";
import { decodeBase64, decodeJwt, detectEscapeDirection, encodeBase64, escapeJsonString, unescapeJsonString } from "./strings";
import type { WorkerJob, WorkerOk, WorkerReply } from "./worker-protocol";
import type { JsonErrorPosition } from "./types";

const scope = self as unknown as DedicatedWorkerGlobalScope;

function reply(message: WorkerReply) {
    scope.postMessage(message);
}

type Loaded =
    | { ok: true; value: unknown; repaired: string | null }
    | { ok: false; error: string; position?: JsonErrorPosition };

/** repair-then-parse, shared by every op that needs a parsed document */
function load(text: string, repair = false): Loaded {
    const first = parseJson(text);
    if (first.ok) return { ok: true, value: first.value, repaired: null };
    if (!repair) return { ok: false, error: first.error ?? "Invalid JSON", position: first.position };
    const fixed = repairJson(text);
    const second = parseJson(fixed);
    if (second.ok) return { ok: true, value: second.value, repaired: fixed };
    return { ok: false, error: second.error ?? "Invalid JSON", position: second.position };
}

scope.addEventListener("message", async (event: MessageEvent<WorkerJob>) => {
    const job = event.data;
    const fail = (error: string, position?: JsonErrorPosition) =>
        reply({ id: job.id, ok: false, op: job.op, error, position });
    const done = (result: WorkerOk) => reply({ id: job.id, ok: true, op: job.op, result });

    try {
        switch (job.op) {
            case "parse": {
                const doc = load(job.text);
                if (!doc.ok) return fail(doc.error, doc.position);
                return done({ value: doc.value, stats: computeStats(doc.value, job.text.length) });
            }

            case "stats": {
                const doc = load(job.text);
                if (!doc.ok) return fail(doc.error, doc.position);
                return done({ stats: computeStats(doc.value, job.text.length) });
            }

            case "validate": {
                const parsed = parseJson(job.text);
                if (!parsed.ok) return fail(parsed.error ?? "Invalid JSON", parsed.position);
                return done({
                    stats: computeStats(parsed.value, job.text.length),
                    suggestions: validationSuggestions(job.text, parsed.value),
                });
            }

            case "format": {
                const doc = load(job.text, job.options.repair);
                if (!doc.ok) return fail(doc.error, doc.position);
                const value = job.options.sortKeys ? sortObjectKeys(doc.value) : doc.value;
                return done({ text: JSON.stringify(value, null, job.options.indent), value });
            }

            case "minify": {
                const doc = load(job.text, job.options.repair);
                if (!doc.ok) return fail(doc.error, doc.position);
                const minified = JSON.stringify(doc.value);
                return done({ text: minified, originalSize: job.text.length, minifiedSize: minified.length });
            }

            case "types": {
                const doc = load(job.text);
                if (!doc.ok) return fail(doc.error, doc.position);
                const { language, style } = job.options;
                const text =
                    language === "go" ? jsonToGo(doc.value)
                        : language === "typescript" ? jsonToTypeScript(doc.value)
                            : language === "schema" ? jsonToSchema(doc.value)
                                : language === "python" ? jsonToPython(doc.value, style === "typeddict" ? "typeddict" : "dataclass")
                                    : language === "rust" ? jsonToRust(doc.value)
                                        : language === "java" ? jsonToJava(doc.value, style === "class" ? "class" : "record")
                                            : language === "csharp" ? jsonToCSharp(doc.value)
                                                : language === "kotlin" ? jsonToKotlin(doc.value)
                                                    : jsonToZod(doc.value);
                return done({ text });
            }

            case "jsonpath": {
                const doc = load(job.text);
                if (!doc.ok) return fail(doc.error, doc.position);
                // dynamic import keeps jsonpath (esprima + static-eval) out of the page bundle
                const jp = await import("jsonpath");
                const matches = jp.query(doc.value as object, job.options.query);
                return done({ text: JSON.stringify(matches, null, 2), matchCount: matches.length });
            }

            case "convert": {
                const doc = load(job.text);
                if (!doc.ok) return fail(doc.error, doc.position);
                const { target } = job.options;
                const text = target === "csv" ? toCsv(doc.value) : target === "yaml" ? toYaml(doc.value) : toXml(doc.value);
                return done({ text });
            }

            case "escape": {
                const direction = job.options.direction === "auto" ? detectEscapeDirection(job.text) : job.options.direction;
                const text = direction === "escape" ? escapeJsonString(job.text) : unescapeJsonString(job.text);
                return done({ text, resolvedDirection: direction });
            }

            case "base64": {
                const text = job.options.direction === "encode"
                    ? encodeBase64(job.text, job.options.urlSafe)
                    : decodeBase64(job.text);
                return done({ text, resolvedDirection: job.options.direction });
            }

            case "jwt": {
                return done({ jwt: decodeJwt(job.text) });
            }

            case "flatten": {
                if (job.options.direction === "flatten") {
                    const doc = load(job.text);
                    if (!doc.ok) return fail(doc.error, doc.position);
                    const flat = flattenObject(doc.value, job.options.config);
                    return done({ text: JSON.stringify(flat, null, job.options.indent), value: flat });
                }
                const doc = load(job.text);
                if (!doc.ok) return fail(doc.error, doc.position);
                if (typeof doc.value !== "object" || doc.value === null || Array.isArray(doc.value)) {
                    return fail("Unflatten expects a flat object of path -> value pairs.");
                }
                const nested = unflattenObject(doc.value as Record<string, unknown>, job.options.config);
                return done({ text: JSON.stringify(nested, null, job.options.indent), value: nested });
            }

            case "sort": {
                const doc = load(job.text);
                if (!doc.ok) return fail(doc.error, doc.position);
                const sorted = sortJson(doc.value, job.options.config);
                return done({ text: JSON.stringify(sorted, null, job.options.indent), value: sorted });
            }

            case "size": {
                const doc = load(job.text);
                if (!doc.ok) return fail(doc.error, doc.position);
                return done({
                    sizeReport: analyseSize(doc.value),
                    stats: computeStats(doc.value, job.text.length),
                });
            }

            case "merge": {
                const left = load(job.text);
                if (!left.ok) return fail(`Left document: ${left.error}`, left.position);
                const right = load(job.text2 ?? "");
                if (!right.ok) return fail(`Right document: ${right.error}`, right.position);
                const { mode, indent } = job.options;
                const output = mode === "merge" ? deepMerge(left.value, right.value)
                    : mode === "mergePatch" ? mergePatch(left.value, right.value)
                        : jsonPatch(left.value, right.value);
                return done({ text: JSON.stringify(output, null, indent), value: output });
            }

            case "csvToJson": {
                const records = csvToJson(job.text, job.options.config);
                return done({ text: JSON.stringify(records, null, job.options.indent), value: records });
            }

            case "ndjson": {
                if (job.options.direction === "toNdjson") {
                    const doc = load(job.text);
                    if (!doc.ok) return fail(doc.error, doc.position);
                    return done({ text: jsonToNdjson(doc.value) });
                }
                return done({ text: ndjsonToJson(job.text, job.options.indent) });
            }

            case "sql": {
                const doc = load(job.text);
                if (!doc.ok) return fail(doc.error, doc.position);
                return done({ text: jsonToSql(doc.value, job.options.options) });
            }
        }
    } catch (error) {
        fail(error instanceof Error ? error.message : "Worker failed");
    }
});
