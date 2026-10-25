"use client";

import { useState } from "react";
import { JsonEditor } from "../json/json-editor";
import { JSONComparer } from "../ui/json-comparer";
import { SplitPanes } from "../ui/split-panes";
import { COMPARE_SAMPLES } from "@/lib/json/samples";
import { usePrefs } from "@/lib/prefs";
import { sortObjectKeys } from "@/lib/json/core";

const PANEL_HEIGHT = 320;

/** Two editors plus the diff view. Sorting normalises both sides before diffing. */
export function CompareWorkbench() {
    const { prefs, update } = usePrefs();
    const [left, setLeft] = useState("");
    const [right, setRight] = useState("");

    const normalise = (text: string) => {
        if (!prefs.sortKeys || !text.trim()) return text;
        try {
            return JSON.stringify(sortObjectKeys(JSON.parse(text)), null, 2);
        } catch {
            return text; // invalid input is the comparer's problem to report
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white/70 p-2 dark:border-gray-800 dark:bg-gray-900/50">
                <button
                    onClick={() => { setLeft(COMPARE_SAMPLES.left); setRight(COMPARE_SAMPLES.right); }}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                >
                    Load sample pair
                </button>
                <button
                    onClick={() => { setLeft(""); setRight(""); }}
                    className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                    Clear
                </button>
                <button
                    onClick={() => { setLeft(right); setRight(left); }}
                    className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                    Swap sides
                </button>
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <input
                        type="checkbox"
                        checked={prefs.sortKeys}
                        onChange={(e) => update({ sortKeys: e.target.checked })}
                        className="h-3.5 w-3.5 rounded accent-indigo-600"
                    />
                    Sort keys before diffing
                </label>
            </div>

            <SplitPanes
                id="compare"
                left={<JsonEditor value={left} onChange={setLeft} height={PANEL_HEIGHT} label="Original" />}
                right={<JsonEditor value={right} onChange={setRight} height={PANEL_HEIGHT} label="Changed" />}
            />

            {left.trim() && right.trim() ? (
                <JSONComparer json1={normalise(left)} json2={normalise(right)} />
            ) : (
                <div className="grid h-40 place-items-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    Paste JSON on both sides to see the diff.
                </div>
            )}
        </div>
    );
}
