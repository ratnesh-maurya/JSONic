"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { formatBytes, type JsonStats } from "@/lib/json/types";
import type { JobFailure } from "@/lib/json/use-json-worker";

export function ValidatorReport({
    failure, stats, suggestions, hasInput,
}: {
    failure: JobFailure | null;
    stats: JsonStats;
    suggestions: string[];
    hasInput: boolean;
}) {
    if (!hasInput) {
        return (
            <div className="grid h-full place-items-center px-6 text-center text-[13px] text-gray-500 dark:text-gray-400">
                Paste JSON on the left to validate it.
            </div>
        );
    }

    const valid = !failure;

    return (
        <div className="h-full overflow-y-auto p-4">
            <div className={`flex items-start gap-2.5 rounded-xl border p-3 ${valid
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                : "border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10"}`}>
                {valid
                    ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                    : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden />}
                <div className="min-w-0">
                    <p className={`text-[13px] font-semibold ${valid ? "text-emerald-800 dark:text-emerald-300" : "text-red-800 dark:text-red-300"}`}>
                        {valid ? "Valid JSON" : "Invalid JSON"}
                    </p>
                    {valid ? (
                        <p className="mt-0.5 text-[12px] text-emerald-700 dark:text-emerald-400">
                            {stats.nodes.toLocaleString()} nodes · depth {stats.depth} · {formatBytes(stats.size)}
                        </p>
                    ) : (
                        <p className="mt-0.5 break-words font-mono text-[11.5px] text-red-700 dark:text-red-300">{failure.error}</p>
                    )}
                </div>
            </div>

            {valid && (
                <dl className="mt-4 grid grid-cols-3 gap-2">
                    {Object.entries(stats.types).map(([label, count]) => (
                        <div key={label} className="rounded-lg border border-gray-200 p-2 text-center dark:border-gray-800">
                            <dt className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-500">{label}</dt>
                            <dd className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{count.toLocaleString()}</dd>
                        </div>
                    ))}
                </dl>
            )}

            {suggestions.length > 0 && (
                <div className="mt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-500">
                        {valid ? "Notes" : "Likely fixes"}
                    </p>
                    <ul className="mt-2 space-y-1.5">
                        {suggestions.map((line) => (
                            <li key={line} className="flex gap-2 text-[12.5px] text-gray-600 dark:text-gray-400">
                                <span className="text-gray-400" aria-hidden>—</span>
                                <span>{line}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
