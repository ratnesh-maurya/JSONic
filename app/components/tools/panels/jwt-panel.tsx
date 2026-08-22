"use client";

import { AlertTriangle, Clock, ShieldOff } from "lucide-react";
import type { JwtParts } from "@/lib/json/strings";

export function JwtPanel({ jwt, hasInput }: { jwt: JwtParts | null; hasInput: boolean }) {
    if (!jwt) {
        return (
            <div className="grid h-full place-items-center px-6 text-center text-[13px] text-gray-500 dark:text-gray-400">
                {hasInput ? "Press Run to decode this token." : "Paste a JWT on the left to read its claims."}
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-3">
            <div className="flex flex-wrap items-center gap-2">
                {jwt.algorithm && (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        alg {jwt.algorithm}
                    </span>
                )}
                {jwt.expired !== null && (
                    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] ${jwt.expired
                        ? "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"}`}>
                        <Clock className="h-3 w-3" aria-hidden />
                        {jwt.expired ? "Expired" : "Not expired"}
                    </span>
                )}
                <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                    <ShieldOff className="h-3 w-3" aria-hidden />
                    Signature not verified
                </span>
            </div>

            {jwt.timestamps.length > 0 && (
                <ul className="mt-3 space-y-1">
                    {jwt.timestamps.map((entry) => (
                        <li key={entry.claim} className="flex items-baseline justify-between gap-3 rounded-md border border-gray-200 px-2 py-1.5 dark:border-gray-800">
                            <span className="font-mono text-[11.5px] text-sky-700 dark:text-sky-300">{entry.claim}</span>
                            <span className="text-right text-[11px] text-gray-600 dark:text-gray-400">
                                {entry.iso}
                                <span className="ml-1.5 text-gray-400 dark:text-gray-600">{entry.relative}</span>
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            <Section title="Header" value={jwt.header} />
            <Section title="Payload" value={jwt.payload} />

            <p className="mt-3 flex items-start gap-1.5 text-[11px] text-gray-400 dark:text-gray-600">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                A JWT is a credential. Prefer test or expired tokens when debugging, and rotate anything you paste into a
                tool you did not write.
            </p>
        </div>
    );
}

function Section({ title, value }: { title: string; value: unknown }) {
    return (
        <div className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-500">{title}</p>
            <pre className="mt-1 overflow-x-auto rounded-lg border border-gray-200 p-2 font-mono text-[11.5px] text-gray-800 dark:border-gray-800 dark:text-gray-200">
                {JSON.stringify(value, null, 2)}
            </pre>
        </div>
    );
}
