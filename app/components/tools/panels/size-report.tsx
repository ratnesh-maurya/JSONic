"use client";

import { formatBytes } from "@/lib/json/types";
import type { SizeReport } from "@/lib/json/structure";

/** Biggest-branch-first breakdown with a share-of-total bar per row. */
export function SizeReportPanel({ report, hasInput }: { report: SizeReport | null; hasInput: boolean }) {
    if (!report) {
        return (
            <div className="grid h-full place-items-center px-6 text-center text-[13px] text-gray-500 dark:text-gray-400">
                {hasInput ? "Press Run to analyse this document." : "Paste JSON on the left to see where its bytes go."}
            </div>
        );
    }

    const keyShare = report.total > 0 ? (report.keyBytes / report.total) * 100 : 0;

    return (
        <div className="h-full overflow-y-auto p-3">
            <dl className="grid grid-cols-3 gap-2">
                <Stat label="Total" value={formatBytes(report.total)} />
                <Stat label="Key names" value={`${formatBytes(report.keyBytes)} · ${keyShare.toFixed(0)}%`} />
                <Stat
                    label="Largest string"
                    value={report.largestString ? formatBytes(report.largestString.bytes) : "—"}
                    hint={report.largestString?.path}
                />
            </dl>

            <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-500">
                Heaviest branches
            </p>
            <ul className="mt-1.5 space-y-1">
                {report.entries.map((entry) => (
                    <li key={entry.path} className="relative overflow-hidden rounded-md border border-gray-200 px-2 py-1.5 dark:border-gray-800">
                        {/* the bar is a background layer so the text stays readable over it */}
                        <span
                            className="absolute inset-y-0 left-0 bg-indigo-500/10 dark:bg-indigo-400/15"
                            style={{ width: `${Math.max(entry.share * 100, 0.5)}%` }}
                            aria-hidden
                        />
                        <span className="relative flex items-baseline justify-between gap-3">
                            <span className="truncate font-mono text-[11.5px] text-gray-700 dark:text-gray-300" title={entry.path}>
                                {entry.path}
                                {entry.count > 0 && (
                                    <span className="ml-1.5 text-gray-400 dark:text-gray-600">
                                        {entry.count} {entry.kind === "array" ? "items" : "keys"}
                                    </span>
                                )}
                            </span>
                            <span className="shrink-0 text-[11px] tabular-nums text-gray-500 dark:text-gray-400">
                                {formatBytes(entry.bytes)} · {(entry.share * 100).toFixed(1)}%
                            </span>
                        </span>
                    </li>
                ))}
            </ul>

            <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-600">
                Uncompressed serialized bytes. Gzip compresses repeated key names heavily, so the key-name figure is an
                upper bound on what renaming them would save.
            </p>
        </div>
    );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
    return (
        <div className="rounded-lg border border-gray-200 p-2 dark:border-gray-800">
            <dt className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-500">{label}</dt>
            <dd className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{value}</dd>
            {hint && <p className="truncate font-mono text-[10px] text-gray-400 dark:text-gray-600" title={hint}>{hint}</p>}
        </div>
    );
}
