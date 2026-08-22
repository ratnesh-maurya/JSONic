"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatBytes } from "@/lib/json/types";
import { VirtualCodeView } from "./virtual-code-view";

/** Above this, a controlled <textarea> stops being usable — we switch to a read-only virtual view. */
const EDITABLE_LIMIT = 4_000_000;
/** Above this we stop rendering a line-number gutter next to the textarea. */
const GUTTER_LIMIT = 400_000;
const LINE_HEIGHT = 20;

interface JsonEditorProps {
    value: string;
    onChange: (value: string) => void;
    height: number;
    placeholder?: string;
    errorLine?: number;
    label?: string;
    /** file-picker accept list; defaults to JSON types */
    accept?: string;
    /** rendered top-right of the editor chrome */
    actions?: React.ReactNode;
}

/**
 * Input editor with three modes chosen by document size:
 *   < 400 KB  textarea + windowed line-number gutter
 *   < 4 MB    textarea, no gutter
 *   >= 4 MB   read-only virtualized view (editing a 50 MB textarea is not viable)
 */
export function JsonEditor({ value, onChange, height, placeholder, errorLine, label, accept, actions }: JsonEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const gutterRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [dragOver, setDragOver] = useState(false);
    const [loadingFile, setLoadingFile] = useState(false);

    const bytes = value.length;
    const readOnly = bytes >= EDITABLE_LIMIT;
    const showGutter = bytes < GUTTER_LIMIT;

    const lineCount = useMemo(() => {
        if (!showGutter) return 0;
        let count = 1;
        for (let i = 0; i < value.length; i++) if (value.charCodeAt(i) === 10) count++;
        return count;
    }, [value, showGutter]);

    // only the gutter numbers inside the viewport are rendered
    const visibleLines = useMemo(() => {
        if (!showGutter) return [];
        const first = Math.max(0, Math.floor(scrollTop / LINE_HEIGHT) - 5);
        const last = Math.min(lineCount, first + Math.ceil(height / LINE_HEIGHT) + 10);
        return Array.from({ length: Math.max(0, last - first) }, (_, i) => first + i + 1);
    }, [scrollTop, lineCount, height, showGutter]);

    const handleScroll = useCallback(() => {
        const top = textareaRef.current?.scrollTop ?? 0;
        setScrollTop(top);
        if (gutterRef.current) gutterRef.current.scrollTop = top;
    }, []);

    const readFile = useCallback(async (file: File) => {
        setLoadingFile(true);
        try {
            onChange(await file.text());
        } finally {
            setLoadingFile(false);
        }
    }, [onChange]);

    const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        setDragOver(false);
        const file = event.dataTransfer.files?.[0];
        if (file) void readFile(file);
    }, [readFile]);

    // Tab inserts indentation instead of moving focus out of the editor
    const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key !== "Tab") return;
        event.preventDefault();
        const el = event.currentTarget;
        const { selectionStart, selectionEnd } = el;
        const next = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
        onChange(next);
        requestAnimationFrame(() => el.setSelectionRange(selectionStart + 2, selectionStart + 2));
    }, [value, onChange]);

    useEffect(() => {
        if (!errorLine || !showGutter || !textareaRef.current) return;
        textareaRef.current.scrollTop = Math.max(0, (errorLine - 6) * LINE_HEIGHT);
    }, [errorLine, showGutter]);

    return (
        <div className="flex min-h-0 flex-col">
            <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    {label && <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>}
                    {bytes > 0 && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            {formatBytes(bytes)}
                        </span>
                    )}
                    {readOnly && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
                            read-only above {formatBytes(EDITABLE_LIMIT)}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    <label className="cursor-pointer rounded-lg border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
                        {loadingFile ? "Loading…" : "Open file"}
                        <input
                            type="file"
                            accept={accept ?? ".json,.jsonl,.ndjson,.txt,application/json"}
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void readFile(file);
                                e.target.value = "";
                            }}
                        />
                    </label>
                    {actions}
                </div>
            </div>

            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                style={{ height }}
                className={`relative flex overflow-hidden rounded-xl border bg-white dark:bg-gray-900/80
                    ${dragOver ? "border-indigo-500 ring-2 ring-indigo-500/30" : "border-gray-200 dark:border-gray-700"}`}
            >
                {readOnly ? (
                    <VirtualCodeView text={value} height={height} errorLine={errorLine} highlight={false} className="w-full" />
                ) : (
                    <>
                        {showGutter && (
                            <div
                                ref={gutterRef}
                                aria-hidden
                                className="relative shrink-0 select-none overflow-hidden border-r border-gray-200 bg-gray-50 text-right dark:border-gray-700 dark:bg-gray-900/60"
                                style={{ width: Math.max(40, String(lineCount).length * 9 + 14) }}
                            >
                                <div style={{ height: lineCount * LINE_HEIGHT, position: "relative" }}>
                                    {visibleLines.map((line) => (
                                        <div
                                            key={line}
                                            style={{ position: "absolute", top: (line - 1) * LINE_HEIGHT, right: 8, height: LINE_HEIGHT }}
                                            className={`font-mono text-[11px] leading-[20px] ${line === errorLine ? "font-bold text-red-600 dark:text-red-400" : "text-gray-400 dark:text-gray-500"}`}
                                        >
                                            {line}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onScroll={handleScroll}
                            onKeyDown={onKeyDown}
                            placeholder={placeholder ?? "Paste JSON, or drop a .json file here…"}
                            spellCheck={false}
                            autoCorrect="off"
                            autoCapitalize="off"
                            aria-label={label ?? "JSON input"}
                            className="flex-1 resize-none bg-transparent px-3 py-0 font-mono text-[12.5px] leading-[20px] text-gray-900 outline-none focus:ring-0 dark:text-gray-100"
                        />
                    </>
                )}

                {dragOver && (
                    <div className="pointer-events-none absolute inset-0 grid place-items-center bg-indigo-500/10 text-sm font-medium text-indigo-700 dark:text-indigo-300">
                        Drop JSON file
                    </div>
                )}
            </div>
        </div>
    );
}
