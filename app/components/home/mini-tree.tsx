/**
 * A static preview of the viewer, server-rendered with no JavaScript.
 * It shows what the product looks like before anything hydrates.
 */

const ROWS: Array<{ depth: number; key?: string; value?: string; kind?: string; open?: string; meta?: string }> = [
    { depth: 0, open: "{" },
    { depth: 1, key: "orderId", value: '"ord_9f2a41"', kind: "string" },
    { depth: 1, key: "status", value: '"shipped"', kind: "string" },
    { depth: 1, key: "customer", open: "{" },
    { depth: 2, key: "name", value: '"Ada Lovelace"', kind: "string" },
    { depth: 2, key: "tier", value: '"pro"', kind: "string" },
    { depth: 2, key: "verified", value: "true", kind: "boolean" },
    { depth: 1, key: "items", meta: "[ 128 items ]" },
    { depth: 1, key: "totals", open: "{" },
    { depth: 2, key: "grandTotal", value: "1309.19", kind: "number" },
    { depth: 2, key: "currency", value: '"GBP"', kind: "string" },
    { depth: 1, key: "notes", value: "null", kind: "null" },
];

const KIND_CLASS: Record<string, string> = {
    string: "text-emerald-600 dark:text-emerald-300",
    number: "text-violet-600 dark:text-violet-300",
    boolean: "text-rose-600 dark:text-rose-300",
    null: "text-gray-400 dark:text-gray-500 italic",
};

export function MiniTree() {
    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white/80 shadow-xl shadow-indigo-500/5 backdrop-blur dark:border-gray-700/70 dark:bg-[#0f1620]/80">
            <div className="flex items-center gap-1.5 border-b border-gray-200 px-3 py-2 dark:border-gray-800">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                <span className="ml-2 font-mono text-[10.5px] text-gray-400 dark:text-gray-500">orders.json · 42.6 MB</span>
            </div>
            <div className="p-2.5 font-mono text-[11.5px] leading-[19px]">
                {ROWS.map((row, i) => (
                    <div key={i} className="flex items-center whitespace-nowrap" style={{ paddingLeft: row.depth * 14 }}>
                        <span className="mr-1.5 w-2 text-[8px] text-indigo-500 dark:text-indigo-400">
                            {row.open ? "▼" : row.meta ? "▶" : ""}
                        </span>
                        {row.key && (
                            <>
                                <span className="text-sky-700 dark:text-sky-300">&quot;{row.key}&quot;</span>
                                <span className="text-gray-400 dark:text-gray-600">:&nbsp;</span>
                            </>
                        )}
                        {row.open && <span className="text-gray-400 dark:text-gray-500">{row.open}</span>}
                        {row.meta && <span className="text-gray-400 dark:text-gray-500">{row.meta}</span>}
                        {row.value && <span className={KIND_CLASS[row.kind ?? ""]}>{row.value}</span>}
                    </div>
                ))}
                <div className="pl-[14px] text-gray-400 dark:text-gray-600">{"}"}</div>
            </div>
        </div>
    );
}
