"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "jsonic:panes:v1";
/** dragging past this fraction of the width snaps the pane shut */
const SNAP = 0.12;
const MIN = 0.18;
const MAX = 1 - MIN;
const KEY_STEP = 0.03;

type Side = "left" | "right";

interface PaneState {
    ratio: number;
    collapsed: Side | null;
}

interface SplitPanesProps {
    /** persistence key, one per tool so each remembers its own split */
    id: string;
    left: React.ReactNode;
    right: React.ReactNode;
    /** share of the width the left pane gets on first visit */
    initialRatio?: number;
}

function readStored(id: string): PaneState | null {
    try {
        const all = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, PaneState>;
        const state = all[id];
        if (!state || typeof state.ratio !== "number") return null;
        return { ratio: Math.min(MAX, Math.max(MIN, state.ratio)), collapsed: state.collapsed === "left" || state.collapsed === "right" ? state.collapsed : null };
    } catch {
        return null;
    }
}

function writeStored(id: string, state: PaneState) {
    try {
        const all = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, PaneState>;
        all[id] = state;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
        // private mode or quota — the split is not worth failing a render over
    }
}

/**
 * Two panes with a draggable divider. Dragging past either edge collapses that
 * pane; the divider keeps a triangle notch to reopen it. Both panes stay mounted
 * while collapsed so editor text and tree expansion survive a close.
 *
 * Side by side from lg up; stacked below, where the notch toggles rows instead.
 */
export function SplitPanes({ id, left, right, initialRatio = 0.5 }: SplitPanesProps) {
    const [state, setState] = useState<PaneState>({ ratio: initialRatio, collapsed: null });
    const [dragging, setDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // reads happen after mount so the server and first client render agree
    useEffect(() => {
        const stored = readStored(id);
        if (stored) setState(stored);
    }, [id]);

    const commit = useCallback((next: PaneState) => {
        setState(next);
        writeStored(id, next);
    }, [id]);

    // a notch closes its own pane, or reopens it when that pane is the closed one
    const pressLeft = () => commit({ ratio: state.ratio, collapsed: state.collapsed === "left" ? null : "left" });
    const pressRight = () => commit({ ratio: state.ratio, collapsed: state.collapsed === "right" ? null : "right" });

    const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if ((event.target as HTMLElement).closest("button")) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
    }, []);

    const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if (!dragging || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const fraction = (event.clientX - rect.left) / rect.width;
        if (fraction < SNAP) setState((prev) => ({ ...prev, collapsed: "left" }));
        else if (fraction > 1 - SNAP) setState((prev) => ({ ...prev, collapsed: "right" }));
        else setState({ ratio: Math.min(MAX, Math.max(MIN, fraction)), collapsed: null });
    }, [dragging]);

    const endDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if (!dragging) return;
        event.currentTarget.releasePointerCapture(event.pointerId);
        setDragging(false);
        setState((prev) => {
            writeStored(id, prev);
            return prev;
        });
    }, [dragging, id]);

    const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        const step = event.key === "ArrowLeft" ? -KEY_STEP : event.key === "ArrowRight" ? KEY_STEP : 0;
        if (!step) return;
        event.preventDefault();
        const next = state.ratio + step;
        if (next < SNAP) commit({ ratio: state.ratio, collapsed: "left" });
        else if (next > 1 - SNAP) commit({ ratio: state.ratio, collapsed: "right" });
        else commit({ ratio: Math.min(MAX, Math.max(MIN, next)), collapsed: null });
    }, [commit, state]);

    // a collapsed pane gets 0fr; the surviving pane takes the rest
    // (scaled by 100: fr factors summing below 1 would leave part of the row unused)
    const leftFr = state.collapsed === "left" ? 0 : state.collapsed === "right" ? 100 : state.ratio * 100;
    const rightFr = state.collapsed === "right" ? 0 : state.collapsed === "left" ? 100 : (1 - state.ratio) * 100;

    const notch = "grid h-7 w-4 place-items-center rounded-md border border-gray-300 bg-white text-[9px] leading-none text-gray-600 shadow-sm hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-indigo-400 dark:hover:text-indigo-300";

    return (
        <div
            ref={containerRef}
            style={{ "--cols": `minmax(0,${leftFr}fr) 16px minmax(0,${rightFr}fr)` } as React.CSSProperties}
            className={`flex flex-col gap-2.5 lg:grid lg:gap-0 lg:[grid-template-columns:var(--cols)]
                ${dragging ? "select-none" : "lg:transition-[grid-template-columns] lg:duration-200"}`}
        >
            <div className={`min-w-0 overflow-hidden ${state.collapsed === "left" ? "hidden lg:block lg:invisible" : ""}`} aria-hidden={state.collapsed === "left"}>
                {left}
            </div>

            <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize panels"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(leftFr / (leftFr + rightFr) * 100)}
                tabIndex={0}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onKeyDown={onKeyDown}
                className={`group relative flex touch-none items-center justify-center outline-none
                    max-lg:h-6 max-lg:flex-row max-lg:gap-1
                    lg:cursor-col-resize lg:flex-col lg:gap-1.5`}
            >
                <span
                    aria-hidden
                    className={`absolute rounded-full bg-gray-200 transition-colors group-hover:bg-indigo-400 group-focus-visible:bg-indigo-500 dark:bg-gray-700
                        max-lg:inset-x-0 max-lg:top-1/2 max-lg:h-px
                        lg:inset-y-0 lg:left-1/2 lg:w-px ${dragging ? "!bg-indigo-500 lg:w-0.5" : ""}`}
                />

                {state.collapsed !== "right" && (
                    <button
                        onClick={pressLeft}
                        title={state.collapsed === "left" ? "Open left panel" : "Close left panel"}
                        aria-label={state.collapsed === "left" ? "Open left panel" : "Close left panel"}
                        className={`${notch} relative`}
                    >
                        <span className="hidden lg:inline">{state.collapsed === "left" ? "▶" : "◀"}</span>
                        <span className="lg:hidden">{state.collapsed === "left" ? "▼" : "▲"}</span>
                    </button>
                )}
                {state.collapsed !== "left" && (
                    <button
                        onClick={pressRight}
                        title={state.collapsed === "right" ? "Open right panel" : "Close right panel"}
                        aria-label={state.collapsed === "right" ? "Open right panel" : "Close right panel"}
                        className={`${notch} relative`}
                    >
                        <span className="hidden lg:inline">{state.collapsed === "right" ? "◀" : "▶"}</span>
                        <span className="lg:hidden">{state.collapsed === "right" ? "▲" : "▼"}</span>
                    </button>
                )}
            </div>

            <div className={`min-w-0 overflow-hidden ${state.collapsed === "right" ? "hidden lg:block lg:invisible" : ""}`} aria-hidden={state.collapsed === "right"}>
                {right}
            </div>
        </div>
    );
}
