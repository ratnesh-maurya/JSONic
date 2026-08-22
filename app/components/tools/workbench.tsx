"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Download, Eraser, FileText, Loader2, Play } from "lucide-react";
import { JsonEditor } from "../json/json-editor";
import { VirtualCodeView } from "../json/virtual-code-view";
import { VirtualJsonTree, type VirtualJsonTreeHandle } from "../json/virtual-json-tree";
import { ValidatorReport } from "./panels/validator-report";
import { SizeReportPanel } from "./panels/size-report";
import { JwtPanel } from "./panels/jwt-panel";
import { ToolbarControls, BUTTON, PRIMARY } from "./toolbar-controls";
import { useToast } from "../ui/toast-provider";
import { useJsonWorker, type JobFailure } from "@/lib/json/use-json-worker";
import { useDebounced } from "@/lib/use-debounced";
import { EMPTY_STATS, formatBytes, sizeTier, type JsonErrorPosition, type JsonStats } from "@/lib/json/types";
import { MODES, convertTargetFor, typeLanguageFor, type WorkbenchMode } from "@/lib/json/modes";
import { usePrefs, type Prefs } from "@/lib/prefs";
import { loadDraft, saveDraft } from "@/lib/storage/documents";
import { SAMPLES } from "@/lib/json/samples";
import type { SizeReport } from "@/lib/json/structure";
import type { JwtParts } from "@/lib/json/strings";
import type { WorkerJob } from "@/lib/json/worker-protocol";

const PANEL_HEIGHT = 540;

export type { WorkbenchMode };

export function Workbench({ mode }: { mode: WorkbenchMode }) {
    const spec = MODES[mode];
    const { showToast } = useToast();
    const { prefs, update } = usePrefs();
    const { run, cancelAll, busy } = useJsonWorker();

    const [input, setInput] = useState("");
    const [second, setSecond] = useState("");
    const [output, setOutput] = useState("");
    const [parsed, setParsed] = useState<unknown>(undefined);
    const [stats, setStats] = useState<JsonStats>(EMPTY_STATS);
    const [failure, setFailure] = useState<(JobFailure & { position?: JsonErrorPosition }) | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [minified, setMinified] = useState<{ before: number; after: number } | null>(null);
    const [matchCount, setMatchCount] = useState<number | null>(null);
    const [sizeReport, setSizeReport] = useState<SizeReport | null>(null);
    const [jwt, setJwt] = useState<JwtParts | null>(null);
    const [resolvedDirection, setResolvedDirection] = useState<string | null>(null);
    const [restored, setRestored] = useState(false);

    const treeRef = useRef<VirtualJsonTreeHandle>(null);
    const debouncedInput = useDebounced(input, 300);
    const debouncedSecond = useDebounced(second, 300);
    const debouncedQuery = useDebounced(prefs.jsonPathQuery, 400);
    const tier = sizeTier(input.length);

    // restore the last draft once, so a reload does not lose work
    useEffect(() => {
        let cancelled = false;
        void loadDraft(mode).then((draft) => {
            if (cancelled || !draft) return;
            setInput(draft);
            setRestored(true);
        });
        return () => { cancelled = true; };
    }, [mode]);

    useEffect(() => {
        if (!debouncedInput) return;
        void saveDraft(debouncedInput, mode);
    }, [debouncedInput, mode]);

    // visibilitychange and pagehide are more reliable than beforeunload, especially on mobile
    useEffect(() => {
        const flush = () => { void saveDraft(input, mode); };
        const onVisibility = () => { if (document.visibilityState === "hidden") flush(); };
        document.addEventListener("visibilitychange", onVisibility);
        window.addEventListener("pagehide", flush);
        return () => {
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("pagehide", flush);
        };
    }, [input, mode]);

    const clearResults = useCallback(() => {
        setOutput(""); setParsed(undefined); setStats(EMPTY_STATS); setFailure(null);
        setSuggestions([]); setMinified(null); setMatchCount(null); setSizeReport(null);
        setJwt(null); setResolvedDirection(null);
    }, []);

    /** Builds the worker job for this mode from the current preferences. */
    const buildJob = useCallback((text: string, text2: string, current: Prefs): Omit<WorkerJob, "id"> => {
        switch (spec.op) {
            case "parse": return { op: "parse", text, options: {} };
            case "validate": return { op: "validate", text, options: {} };
            case "stats": return { op: "stats", text, options: {} };
            case "size": return { op: "size", text, options: {} };
            case "jwt": return { op: "jwt", text, options: {} };
            case "format":
                return { op: "format", text, options: { indent: current.indentSize, sortKeys: current.sortKeys, repair: current.autoFix } };
            case "minify":
                return { op: "minify", text, options: { repair: current.autoFix } };
            case "types":
                return { op: "types", text, options: { language: typeLanguageFor(mode)!, style: current.codegenStyle } };
            case "jsonpath":
                return { op: "jsonpath", text, options: { query: current.jsonPathQuery } };
            case "convert":
                return { op: "convert", text, options: { target: convertTargetFor(mode)! } };
            case "escape":
                return { op: "escape", text, options: { direction: current.escapeDirection } };
            case "base64":
                return { op: "base64", text, options: { direction: current.base64Direction, urlSafe: current.base64UrlSafe } };
            case "flatten":
                return { op: "flatten", text, options: { direction: current.flattenDirection, config: current.flattenConfig, indent: current.indentSize } };
            case "sort":
                return { op: "sort", text, options: { config: current.sortConfig, indent: current.indentSize } };
            case "merge":
                return { op: "merge", text, text2, options: { mode: current.mergeMode, indent: current.indentSize } };
            case "csvToJson":
                return { op: "csvToJson", text, options: { config: current.csvConfig, indent: current.indentSize } };
            case "ndjson":
                return { op: "ndjson", text, options: { direction: current.ndjsonDirection, indent: current.indentSize } };
            case "sql":
                return { op: "sql", text, options: { options: current.sqlOptions } };
        }
    }, [mode, spec.op]);

    const execute = useCallback(async (text: string, text2: string, current: Prefs) => {
        if (!text.trim() || (spec.dualInput && !text2.trim())) {
            clearResults();
            return;
        }
        cancelAll();
        try {
            const result = await run(buildJob(text, text2, current));
            setFailure(null);
            if (result.text !== undefined) setOutput(result.text);
            if (result.value !== undefined) setParsed(result.value);
            if (result.stats) setStats(result.stats);
            if (result.suggestions) setSuggestions(result.suggestions);
            if (result.sizeReport) setSizeReport(result.sizeReport);
            if (result.jwt) setJwt(result.jwt);
            if (result.resolvedDirection) setResolvedDirection(result.resolvedDirection);
            setMatchCount(result.matchCount ?? null);
            setMinified(
                result.originalSize !== undefined
                    ? { before: result.originalSize, after: result.minifiedSize ?? 0 }
                    : null,
            );
        } catch (error) {
            const jobFailure = error as JobFailure;
            setFailure(jobFailure);
            setOutput(""); setParsed(undefined); setMinified(null);
            setMatchCount(null); setSizeReport(null); setJwt(null);
            if (mode === "validator") {
                const { fixSuggestions } = await import("@/lib/json/core");
                setSuggestions(fixSuggestions(text, jobFailure.error));
            }
        }
    }, [buildJob, cancelAll, clearResults, mode, run, spec.dualInput]);

    // live mode only auto-runs while the document is small enough for it to be cheap
    const autoRun = prefs.liveMode && tier === "live";
    const prefsKey = JSON.stringify([
        prefs.indentSize, prefs.sortKeys, prefs.autoFix, prefs.codegenStyle, prefs.escapeDirection,
        prefs.base64Direction, prefs.base64UrlSafe, prefs.flattenDirection, prefs.flattenConfig,
        prefs.sortConfig, prefs.mergeMode, prefs.csvConfig, prefs.ndjsonDirection, prefs.sqlOptions,
    ]);

    useEffect(() => {
        if (!autoRun) return;
        void execute(debouncedInput, debouncedSecond, prefs);
        // prefs is intentionally tracked through prefsKey: a new object identity
        // every render would re-run the job on every keystroke
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoRun, debouncedInput, debouncedSecond, debouncedQuery, prefsKey, execute]);

    const copy = useCallback(async (text: string, message: string) => {
        try {
            await navigator.clipboard.writeText(text);
            showToast(message, "success", 2000);
        } catch {
            showToast("Clipboard blocked by the browser", "error", 2500);
        }
    }, [showToast]);

    const download = useCallback((text: string, filename: string) => {
        const blob = new Blob([text], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
    }, []);

    const badges = useMemo(() => {
        const items: Array<{ text: string; tone: "neutral" | "good" | "info" }> = [];
        if (stats.nodes > 0 && (spec.output === "tree" || spec.output === "size")) {
            items.push({ text: `${stats.nodes.toLocaleString()} nodes · depth ${stats.depth}`, tone: "neutral" });
        }
        if (minified && minified.before > 0) {
            const saved = ((minified.before - minified.after) / minified.before) * 100;
            items.push({ text: `${formatBytes(minified.before)} → ${formatBytes(minified.after)} · ${saved.toFixed(1)}% smaller`, tone: "good" });
        }
        if (matchCount !== null) items.push({ text: `${matchCount} ${matchCount === 1 ? "match" : "matches"}`, tone: "info" });
        if (resolvedDirection) items.push({ text: resolvedDirection, tone: "info" });
        return items;
    }, [stats, minified, matchCount, resolvedDirection, spec.output]);

    const hasOutput = Boolean(output) || spec.output !== "code";

    return (
        <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white/70 p-2 dark:border-gray-800 dark:bg-gray-900/40">
                <button onClick={() => void execute(input, second, prefs)} disabled={busy} className={PRIMARY}>
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}
                    {busy ? "Working" : "Run"}
                </button>
                <button onClick={() => { setInput(SAMPLES[mode] ?? SAMPLES.default); if (spec.dualInput) setSecond(SAMPLES.mergeRight ?? ""); }} className={BUTTON}>
                    <FileText className="h-3.5 w-3.5" aria-hidden /> Sample
                </button>
                <button onClick={() => { setInput(""); setSecond(""); clearResults(); void saveDraft("", mode); }} className={BUTTON}>
                    <Eraser className="h-3.5 w-3.5" aria-hidden /> Clear
                </button>

                <span className="mx-0.5 h-5 w-px bg-gray-200 dark:bg-gray-700" />

                <ToolbarControls
                    mode={mode}
                    prefs={prefs}
                    update={update}
                    onTreeSearch={(query) => {
                        const result = treeRef.current?.search(query);
                        if (result && query.trim()) {
                            showToast(
                                result.matches === 0 ? "No matches" : `${result.matches}${result.capped ? "+" : ""} matches`,
                                result.matches ? "success" : "info",
                                1600,
                            );
                        }
                    }}
                    onExpandDepth={(depth) => treeRef.current?.expandToDepth(depth)}
                    onCollapseAll={() => treeRef.current?.collapseAll()}
                />
            </div>

            {restored && (
                <Banner tone="info" onDismiss={() => setRestored(false)}>
                    Restored your last document from this browser. Nothing was uploaded.
                </Banner>
            )}

            {tier !== "live" && (
                <Banner tone="warn">
                    {formatBytes(input.length)} document — live processing is off. Press <strong>Run</strong> when ready.
                    {tier === "huge" && " Editing is disabled at this size; the view stays read-only."}
                </Banner>
            )}

            {failure && (
                <Banner tone="error">
                    <span className="font-medium">{failure.error}</span>
                    {failure.position && failure.position.line > 0 && (
                        <span className="ml-2 opacity-80">line {failure.position.line}, column {failure.position.column}</span>
                    )}
                </Banner>
            )}

            <div className="grid gap-2.5 lg:grid-cols-2">
                <div className={spec.dualInput ? "grid gap-2.5" : undefined}>
                    <JsonEditor
                        value={input}
                        onChange={setInput}
                        height={spec.dualInput ? PANEL_HEIGHT / 2 - 22 : PANEL_HEIGHT}
                        label={spec.dualInput ? "Original" : "Input"}
                        placeholder={spec.placeholder}
                        errorLine={failure?.position?.line}
                        accept={spec.freeformInput ? ".txt,.csv,.json,.jsonl" : undefined}
                        actions={
                            input ? (
                                <button onClick={() => void copy(input, "Input copied")} className={BUTTON}>
                                    <Copy className="h-3 w-3" aria-hidden />
                                </button>
                            ) : null
                        }
                    />
                    {spec.dualInput && (
                        <JsonEditor
                            value={second}
                            onChange={setSecond}
                            height={PANEL_HEIGHT / 2 - 22}
                            label="Changed"
                        />
                    )}
                </div>

                <div className="flex min-h-0 flex-col">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">{spec.outputLabel}</span>
                            {badges.map((badge) => (
                                <span
                                    key={badge.text}
                                    className={`rounded px-1.5 py-0.5 text-[11px] ${
                                        badge.tone === "good"
                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                                            : badge.tone === "info"
                                                ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300"
                                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                    }`}
                                >
                                    {badge.text}
                                </span>
                            ))}
                        </div>
                        {hasOutput && (
                            <div className="flex items-center gap-1.5">
                                <button onClick={() => void copy(output || input, "Copied")} className={BUTTON} title="Copy output">
                                    <Copy className="h-3 w-3" aria-hidden /> Copy
                                </button>
                                <button onClick={() => download(output || input, spec.filename)} className={BUTTON} title="Download output">
                                    <Download className="h-3 w-3" aria-hidden /> Save
                                </button>
                            </div>
                        )}
                    </div>

                    <div
                        style={{ height: PANEL_HEIGHT }}
                        className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700/80 dark:bg-gray-900/60"
                    >
                        {spec.output === "tree" && parsed !== undefined ? (
                            <VirtualJsonTree ref={treeRef} data={parsed} height={PANEL_HEIGHT} onCopy={(t, l) => void copy(t, l)} />
                        ) : spec.output === "report" ? (
                            <ValidatorReport failure={failure} stats={stats} suggestions={suggestions} hasInput={Boolean(input.trim())} />
                        ) : spec.output === "size" ? (
                            <SizeReportPanel report={sizeReport} hasInput={Boolean(input.trim())} />
                        ) : spec.output === "jwt" ? (
                            <JwtPanel jwt={jwt} hasInput={Boolean(input.trim())} />
                        ) : output ? (
                            <VirtualCodeView text={output} height={PANEL_HEIGHT} highlight={spec.highlightOutput ?? false} />
                        ) : (
                            <Empty label={spec.outputLabel} busy={busy} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Empty({ label, busy }: { label: string; busy: boolean }) {
    return (
        <div className="grid h-full place-items-center px-6 text-center">
            <div>
                <p className="text-[13px] text-gray-500 dark:text-gray-400">
                    {busy ? "Working…" : `Paste input on the left to see ${label.toLowerCase()}.`}
                </p>
                {!busy && (
                    <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                        Everything runs in your browser — nothing is uploaded.
                    </p>
                )}
            </div>
        </div>
    );
}

function Banner({ tone, children, onDismiss }: { tone: "info" | "warn" | "error"; children: React.ReactNode; onDismiss?: () => void }) {
    const classes = {
        info: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200",
        warn: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
        error: "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200",
    }[tone];

    return (
        <div className={`flex items-start justify-between gap-3 rounded-xl border px-3 py-2 text-[13px] ${classes}`}>
            <p>{children}</p>
            {onDismiss && (
                <button onClick={onDismiss} aria-label="Dismiss" className="shrink-0 text-lg leading-none opacity-60 hover:opacity-100">
                    ×
                </button>
            )}
        </div>
    );
}
