"use client";

import { useEffect } from "react";

/** Route-level boundary: a crash in one tool must not blank the whole app. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error("JSONic route error:", error);
    }, [error]);

    return (
        <div className="mx-auto grid min-h-[60vh] max-w-lg place-items-center px-4 text-center">
            <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Something broke in this tool</h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Your document is still saved in this browser. Retrying usually recovers; if it does not, the input may be
                    hitting a limit worth reporting.
                </p>
                <p className="mt-2 break-words font-mono text-xs text-gray-500 dark:text-gray-500">{error.message}</p>
                <div className="mt-5 flex justify-center gap-2">
                    <button onClick={reset} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                        Try again
                    </button>
                    <a
                        href="https://github.com/ratnesh-maurya/JSONic/issues/new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                        Report it
                    </a>
                </div>
            </div>
        </div>
    );
}
