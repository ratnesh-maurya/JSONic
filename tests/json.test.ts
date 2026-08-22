import { computeStats, errorPositionFromMessage, parseJson, repairJson, sortObjectKeys } from "../lib/json/core";
import { flatten, pathsToDepth, pathsMatching } from "../lib/json/flatten";
import { jsonToGo, jsonToSchema, jsonToTypeScript } from "../lib/json/codegen";
import { toCsv, toXml, toYaml } from "../lib/json/convert";
import { tokenizeLine, lineIndex, lineAt } from "../lib/json/tokenize";

let failures = 0;
function check(name: string, cond: boolean, extra = "") {
    if (cond) console.log(`  ok   ${name}`);
    else { failures++; console.log(`  FAIL ${name} ${extra}`); }
}

console.log("\n— repair —");
check("trailing comma", parseJson(repairJson('{"a":1,}')).ok);
check("single quotes", parseJson(repairJson("{'a':'b'}")).ok);
check("unquoted keys", parseJson(repairJson("{a:1,b:2}")).ok);
check("line comments", parseJson(repairJson('{"a":1} // note')).ok);
check("block comments", parseJson(repairJson('{/* x */"a":1}')).ok);
const preserved = parseJson(repairJson('{"a":"keep, this: {x} intact"}'));
check("string contents untouched", preserved.ok && (preserved.value as any).a === "keep, this: {x} intact");
const apos = parseJson(repairJson(`{'msg':'it\\'s fine'}`));
check("escaped apostrophe in single-quoted", apos.ok, JSON.stringify(apos));

console.log("\n— error position —");
const bad = '{\n  "a": 1,\n  "b": oops\n}';
const err = parseJson(bad);
check("reports invalid", !err.ok);
check("line 3 reported", err.position?.line === 3, `got line ${err.position?.line} col ${err.position?.column}`);
check("offset->linecol", errorPositionFromMessage("a\nbb\nccc", "at position 5").line === 3);

console.log("\n— codegen —");
const sample = { id: 1, name: "a", nested: { x: 1.5, y: null }, list: [{ p: 1 }, { p: 2, q: "z" }] };
const go = jsonToGo(sample);
check("go root struct", go.includes("type Root struct"));
check("go int64", go.includes("int64"));
check("go float64", go.includes("float64"));
check("go json tags", go.includes('`json:"name"`'));
check("go merges array shapes (q present)", go.includes("Q "), go);
check("go optional -> pointer+omitempty", go.includes("omitempty"), go);
const ts = jsonToTypeScript(sample);
check("ts interface", ts.includes("export interface Root"));
check("ts optional key", ts.includes("q?:"), ts);
check("ts array type", ts.includes("[]"));
const schema = jsonToSchema(sample);
check("schema draft", schema.includes("2020-12"));
check("schema integer vs number", schema.includes('"integer"') && schema.includes('"number"'));

console.log("\n— convert —");
const rows = [{ a: 1, b: { c: "x,y" } }, { a: 2, d: true }];
const csv = toCsv(rows);
check("csv header union", csv.split("\n")[0] === "a,b.c,d", csv.split("\n")[0]);
check("csv quotes commas", csv.includes('"x,y"'), csv);
const yaml = toYaml({ on: "yes", n: 1, list: [1, 2], empty: [] });
check("yaml quotes ambiguous string", yaml.includes('"yes"'), yaml);
check("yaml empty array", yaml.includes("empty: []"), yaml);
const xml = toXml({ "bad name": "<x>" });
check("xml escapes", xml.includes("&lt;x&gt;"), xml);
check("xml sanitises tag", xml.includes("<bad_name>"), xml);

console.log("\n— tokenize —");
const toks = tokenizeLine('  "key": "va:lue",');
check("key detected", toks.some(t => t.type === "key" && t.value === '"key"'));
check("string not key", toks.some(t => t.type === "string" && t.value === '"va:lue"'), JSON.stringify(toks));
const text = "a\nbb\nccc";
const starts = lineIndex(text);
check("lineAt", lineAt(text, starts, 1) === "bb");

console.log("\n— big document —");
const N = 120_000;
const big = { meta: { generated: true }, records: Array.from({ length: N }, (_, i) => ({
    id: i, name: `user_${i}`, email: `u${i}@example.com`, active: i % 3 === 0,
    score: i % 7 === 0 ? i / 3 : i, tags: ["a", "b"], profile: { city: "London", zip: `E${i % 99}` },
})) };
const bigText = JSON.stringify(big);
console.log(`  fixture: ${(bigText.length / 1024 / 1024).toFixed(1)} MB, ${N} records`);

let t = Date.now();
const parsedBig = JSON.parse(bigText);
const parseMs = Date.now() - t;

t = Date.now();
const stats = computeStats(parsedBig, bigText.length);
const statsMs = Date.now() - t;
check(`computeStats single pass (${statsMs}ms)`, statsMs < 3000, `${statsMs}ms`);
check("node count", stats.nodes > N * 5, `${stats.nodes}`);

t = Date.now();
const collapsed = flatten(parsedBig, { expanded: new Set(["$"]) });
const collapsedMs = Date.now() - t;
check(`flatten collapsed is O(visible) (${collapsedMs}ms, ${collapsed.rows.length} rows)`, collapsed.rows.length < 10 && collapsedMs < 50, `${collapsed.rows.length} rows / ${collapsedMs}ms`);

t = Date.now();
const oneLevel = flatten(parsedBig, { expanded: new Set(["$", "$.records"]) });
const oneMs = Date.now() - t;
check(`flatten 1 level of ${N} (${oneMs}ms)`, oneMs < 1500, `${oneMs}ms`);
check("row count matches children", oneLevel.rows.length === N + 5, `${oneLevel.rows.length} vs ${N+5}`);

t = Date.now();
const depth = pathsToDepth(parsedBig, 2);
check(`pathsToDepth bounded (${Date.now() - t}ms, ${depth.size} paths)`, depth.size <= 50_000);

t = Date.now();
const found = pathsMatching(parsedBig, "user_99999");
const searchMs = Date.now() - t;
check(`search finds match (${searchMs}ms, ${found.matches.length} hits)`, found.matches.length >= 1);

t = Date.now();
jsonToTypeScript(parsedBig);
check(`codegen on big doc (${Date.now() - t}ms)`, true);

t = Date.now();
sortObjectKeys(parsedBig);
check(`sortObjectKeys on big doc (${Date.now() - t}ms)`, true);

console.log(`\n  (raw JSON.parse of fixture: ${parseMs}ms)`);
console.log(failures === 0 ? "\ncore suite ok" : `\n${failures} FAILURES so far`);

// ─────────────────────────────────────────────────────────── v2 tools

import { detectEscapeDirection, decodeBase64, decodeJwt, encodeBase64, escapeJsonString, unescapeJsonString } from "../lib/json/strings";
import { analyseSize, deepMerge, flattenObject, jsonPatch, mergePatch, sortJson, unflattenObject, DEFAULT_FLATTEN, DEFAULT_SORT } from "../lib/json/structure";
import { csvToJson, jsonToNdjson, ndjsonToJson, parseCsv, DEFAULT_CSV } from "../lib/json/csv";
import { jsonToSql, DEFAULT_SQL } from "../lib/json/sql";
import { jsonToCSharp, jsonToJava, jsonToKotlin, jsonToPython, jsonToRust, jsonToZod } from "../lib/json/codegen-langs";

console.log("\n— escape —");
const raw = 'He said "hi"\nand left\tquickly';
check("escape round trip", unescapeJsonString(escapeJsonString(raw)) === raw);
check("escape produces no raw newline", !escapeJsonString(raw).includes("\n"));
check("unescape strips wrapping quotes", unescapeJsonString('"a\\nb"') === "a\nb");
check("direction: escaped input -> unescape", detectEscapeDirection('{\\"a\\":1}') === "unescape");
check("direction: raw input -> escape", detectEscapeDirection('{\n  "a": 1\n}') === "escape");

console.log("\n— base64 —");
const unicode = '{"name":"Ada ✨","emoji":"🔮","accent":"café"}';
check("base64 round trip with unicode", decodeBase64(encodeBase64(unicode)) === unicode);
check("url-safe has no + / =", !/[+/=]/.test(encodeBase64("????????", true)));
check("decodes url-safe without padding", decodeBase64(encodeBase64(unicode, true)) === unicode);

console.log("\n— jwt —");
const demoJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjQyNjIyfQ.abc";
const decoded = decodeJwt(demoJwt, Date.UTC(2026, 0, 1));
check("jwt algorithm", decoded.algorithm === "HS256");
check("jwt payload", (decoded.payload as any).name === "Ada");
check("jwt flags expiry", decoded.expired === true);
check("jwt renders timestamps", decoded.timestamps.length === 2, JSON.stringify(decoded.timestamps));
let jwtThrew = false;
try { decodeJwt("not-a-token"); } catch { jwtThrew = true; }
check("jwt rejects non-tokens", jwtThrew);

console.log("\n— flatten —");
const nested = { a: { b: [1, { c: "x" }] }, empty: {}, list: [] };
const flat = flattenObject(nested);
check("flatten produces dotted paths", "a.b.0" in flat && "a.b.1.c" in flat, JSON.stringify(flat));
check("flatten preserves empties", JSON.stringify(flat.empty) === "{}" && JSON.stringify(flat.list) === "[]");
check("flatten round trips", JSON.stringify(unflattenObject(flat)) === JSON.stringify(nested), JSON.stringify(unflattenObject(flat)));
const bracket = flattenObject(nested, { ...DEFAULT_FLATTEN, bracketArrays: true });
check("bracket notation", "a.b[0]" in bracket, JSON.stringify(bracket));
check("bracket round trips", JSON.stringify(unflattenObject(bracket)) === JSON.stringify(nested));
const custom = flattenObject({ "a.b": { c: 1 } }, { ...DEFAULT_FLATTEN, delimiter: "/" });
check("custom delimiter keeps dotted keys intact", "a.b/c" in custom, JSON.stringify(custom));

console.log("\n— merge & patch —");
const before = { a: 1, b: { c: 2, d: 3 }, list: [1, 2, 3] };
const after = { a: 1, b: { c: 9 }, list: [1, 2], added: true };
check("deep merge", JSON.stringify(deepMerge(before, { b: { c: 9 } })) === JSON.stringify({ a: 1, b: { c: 9, d: 3 }, list: [1, 2, 3] }));
const mp = mergePatch(before, after) as any;
check("merge patch marks deletion with null", mp.b.d === null, JSON.stringify(mp));
check("merge patch includes addition", mp.added === true);
check("merge patch omits unchanged", !("a" in mp), JSON.stringify(mp));
const ops = jsonPatch(before, after);
check("json patch has replace", ops.some(o => o.op === "replace" && o.path === "/b/c"), JSON.stringify(ops));
check("json patch has remove", ops.some(o => o.op === "remove" && o.path === "/b/d"));
check("json patch trims array", ops.some(o => o.op === "remove" && o.path === "/list/2"), JSON.stringify(ops));
const escaped = jsonPatch({ "a/b~c": 1 }, { "a/b~c": 2 });
check("json pointer escaping", escaped[0].path === "/a~1b~0c", escaped[0].path);

console.log("\n— sort —");
const messy = { zebra: 1, item10: "x", Alpha: 2, item2: "y" };
const naturalKeys = Object.keys(sortJson(messy, DEFAULT_SORT) as any);
check("natural order puts item2 before item10", naturalKeys.indexOf("item2") < naturalKeys.indexOf("item10"), naturalKeys.join(","));
const descKeys = Object.keys(sortJson(messy, { ...DEFAULT_SORT, direction: "desc" }) as any);
check("descending reverses", descKeys[0] === "zebra", descKeys.join(","));
const byField = sortJson({ rows: [{ n: 3 }, { n: 1 }, { n: 2 }] }, { ...DEFAULT_SORT, arrayKey: "n" }) as any;
check("sorts array by field", byField.rows.map((r: any) => r.n).join("") === "123");
const mixedArray = sortJson({ rows: [{ n: 2 }, { other: 1 }] }, { ...DEFAULT_SORT, arrayKey: "n" }) as any;
check("leaves array alone when key is missing", mixedArray.rows[0].n === 2);

console.log("\n— size analysis —");
const heavy = { small: "x", big: { blob: "y".repeat(5000) }, list: [1, 2, 3] };
const report = analyseSize(heavy);
check("total matches serialization", report.total === JSON.stringify(heavy).length);
check("heaviest branch first", report.entries[1].path === "$.big" || report.entries[0].path === "$", report.entries.slice(0, 3).map(e => e.path).join(","));
check("finds largest string", report.largestString?.bytes === 5000);
check("counts key bytes", report.keyBytes > 0);

console.log("\n— csv —");
const csvText = 'id,name,note\n1,"Hopper, Grace","said ""hi"""\n2,Alan,"multi\nline"';
const csvRows = parseCsv(csvText);
check("csv quoted comma", csvRows[1][1] === "Hopper, Grace", JSON.stringify(csvRows[1]));
check("csv escaped quote", csvRows[1][2] === 'said "hi"', JSON.stringify(csvRows[1]));
check("csv embedded newline", csvRows[2][2] === "multi\nline", JSON.stringify(csvRows[2]));
const records = csvToJson("id,score,active,blank\n007,42,true,", DEFAULT_CSV) as any[];
check("csv type inference: number", records[0].score === 42);
check("csv type inference: boolean", records[0].active === true);
check("csv leading zeros stay a string", records[0].id === "007", JSON.stringify(records[0]));
check("csv empty cell -> null", records[0].blank === null);

console.log("\n— ndjson —");
const nd = jsonToNdjson([{ a: 1 }, { b: 2 }]);
check("ndjson one doc per line", nd.split("\n").length === 2);
check("ndjson round trip", JSON.parse(ndjsonToJson(nd)).length === 2);
let ndError = "";
try { ndjsonToJson('{"a":1}\nnot json'); } catch (e) { ndError = (e as Error).message; }
check("ndjson reports the failing line", ndError.startsWith("Line 2:"), ndError);

console.log("\n— sql —");
const sqlOut = jsonToSql([{ id: 1, name: "O'Brien", score: 1.5 }, { id: 2, name: "Ada" }], DEFAULT_SQL);
check("sql create table", sqlOut.includes("CREATE TABLE"));
check("sql escapes quotes", sqlOut.includes("'O''Brien'"), sqlOut);
check("sql widens int to float", sqlOut.includes("DOUBLE PRECISION"), sqlOut);
check("sql nullable column", sqlOut.includes('"score" DOUBLE PRECISION\n') || !sqlOut.includes('"score" DOUBLE PRECISION NOT NULL'), sqlOut);
const mysqlOut = jsonToSql([{ a: 1 }], { ...DEFAULT_SQL, dialect: "mysql" });
check("mysql backtick identifiers", mysqlOut.includes("`a`"), mysqlOut);

console.log("\n— language codegen —");
const codegenSample = { id: 1, userName: "a", user_id: 7, ratio: 1.5, nested: { x: 1 }, items: [{ p: 1 }, { p: 2, q: "z" }] };
const py = jsonToPython(codegenSample);
check("python dataclass", py.includes("@dataclass") && py.includes("class Root:"));
check("python snake_case with original key", py.includes("user_name: str") && py.includes("# userName"), py);
check("python optional gets None default", py.includes("Optional[str] = None"), py);
check("python typeddict mode", jsonToPython(codegenSample, "typeddict").includes("TypedDict"));
const rs = jsonToRust(codegenSample);
check("rust serde derive", rs.includes("#[derive(Debug, Clone, Serialize, Deserialize)]"));
check("rust rename for camelCase key", rs.includes('#[serde(rename = "userName")]'), rs);
check("rust Option for inconsistent key", rs.includes("Option<String>"), rs);
const jv = jsonToJava(codegenSample);
check("java record", jv.includes("public record Root("));
check("java JsonProperty", jv.includes('@JsonProperty("userName")'));
check("java boxed optional", jv.includes("String q") , jv);
check("java pojo mode", jsonToJava(codegenSample, "class").includes("public class Root"));
const cs = jsonToCSharp(codegenSample);
check("csharp JsonPropertyName", cs.includes('[JsonPropertyName("userName")]'));
check("csharp nullable optional", cs.includes("string? Q"), cs);
const kt = jsonToKotlin(codegenSample);
check("kotlin data class", kt.includes("data class Root("));
check("kotlin SerialName only when the identifier differs", kt.includes('@SerialName("user_id")') && !kt.includes('@SerialName("userName")'), kt);
check("kotlin nullable default", kt.includes("= null"), kt);
const zod = jsonToZod(codegenSample);
check("zod object schema", zod.includes("export const rootSchema = z.object("));
check("zod int detection", zod.includes("z.number().int()"), zod);
check("zod optional", zod.includes(".optional()"), zod);
check("zod infers type", zod.includes("z.infer<typeof rootSchema>"));

console.log(failures === 0 ? "\nV2 SUITE PASS\n" : `\n${failures} FAILURES\n`);
process.exit(failures === 0 ? 0 : 1);
