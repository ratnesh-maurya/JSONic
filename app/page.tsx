import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Cpu, HardDriveDownload, ShieldCheck, Zap } from "lucide-react";
import { LegacyHashRedirect } from "./components/legacy-hash-redirect";
import { MiniTree } from "./components/home/mini-tree";
import { SpotlightGrid } from "./components/home/spotlight-grid";
import { ToolIcon } from "@/lib/tool-icons";
import { toolListJsonLd } from "@/lib/seo";
import { SITE_URL, TOOLS, TOOL_GROUPS, toolsInGroup } from "@/lib/tools";

export const metadata: Metadata = {
    title: "JSONic — Fast JSON Viewer, Formatter & Converter for Large Files",
    description:
        "28 browser-based JSON tools: view, format, validate, diff, convert and generate types for 8 languages. Virtualized rendering and worker-based parsing keep multi-megabyte files responsive. Free, no sign-up, nothing uploaded.",
    alternates: { canonical: SITE_URL },
    openGraph: {
        type: "website",
        locale: "en_US",
        url: SITE_URL,
        siteName: "JSONic",
        title: "JSONic — JSON tools that survive large files",
        description:
            "View, format, validate, diff, convert and generate types from JSON. Everything runs in your browser — nothing is uploaded.",
    },
    twitter: {
        card: "summary_large_image",
        site: "@ratnesh_maurya_",
        creator: "@ratnesh_maurya_",
        title: "JSONic — JSON tools that survive large files",
        description:
            "28 free JSON tools that run entirely in your browser. Built for files that freeze other viewers.",
    },
};

/**
 * Short, self-contained answers to the questions people actually ask an answer
 * engine about a tool like this. Kept visible rather than collapsed, because the
 * home page is where the site's long-form content lives.
 */
const FAQ = [
    {
        q: "Is JSONic free?",
        a: `All ${TOOLS.length} tools are free, with no account, no sign-up and no usage limit. The site is open source and served as static files.`,
    },
    {
        q: "Is my JSON uploaded anywhere?",
        a: "No. Every operation runs in your browser inside a Web Worker. There is no upload step and no server-side processing, so your data never leaves your machine.",
    },
    {
        q: "How large a file can it open?",
        a: "Files in the tens of megabytes. Above 1 MB live processing pauses until you press Run; above 4 MB the editor becomes a read-only virtualized view, because no browser keeps an editable textarea that large responsive.",
    },
    {
        q: "Does my work survive a reload?",
        a: "Yes. Each tool autosaves its draft to IndexedDB on a debounce and when the tab is hidden, and restores it the next time you open that tool.",
    },
];

/** Real numbers from the fixture in tests/json.test.ts, so they are reproducible. */
const PROOF = [
    { value: "17 MB", label: "test fixture" },
    { value: "63 ms", label: "to analyse it" },
    { value: "85 ms", label: "to expand 120k rows" },
    { value: "0 bytes", label: "ever uploaded" },
];

export default function Home() {
    return (
        <>
            <LegacyHashRedirect />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(toolListJsonLd()) }}
            />

            {/* ── Hero ───────────────────────────────────────────────── */}
            <section className="relative overflow-hidden border-b border-gray-200 dark:border-gray-800/70">
                <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                    <div className="aurora-a left-[8%] top-[-14%] h-[420px] w-[420px]" style={{ animation: "drift-a 19s ease-in-out infinite" }} />
                    <div className="aurora-b right-[4%] top-[6%] h-[380px] w-[380px]" style={{ animation: "drift-b 23s ease-in-out infinite" }} />
                </div>

                <div className="relative mx-auto grid w-full max-w-[1180px] items-center gap-10 px-5 py-16 md:py-24 lg:grid-cols-[1.05fr_0.95fr]">
                    <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-gray-600 backdrop-blur dark:border-gray-700/70 dark:bg-gray-900/60 dark:text-gray-400">
                            <Zap className="h-3 w-3 text-indigo-500" aria-hidden />
                            {TOOLS.length} tools · nothing leaves your browser
                        </span>

                        <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-[-0.03em] text-gray-900 md:text-[54px] dark:text-white">
                            JSON tools for files that are{" "}
                            <span className="word-slot bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                                <span>
                                    <span className="block">enormous</span>
                                    <span className="block">unreadable</span>
                                    <span className="block">malformed</span>
                                    <span className="block">enormous</span>
                                </span>
                            </span>
                        </h1>

                        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-gray-600 dark:text-gray-400">
                            View, format, validate, diff, convert and generate types from JSON — all running locally.
                            Parsing happens in a Web Worker and the tree renders only what is on screen, so document size
                            stops deciding whether the page survives.
                        </p>

                        <div className="mt-7 flex flex-wrap gap-2.5">
                            <Link
                                href="/json-viewer"
                                className="group inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-indigo-600/30"
                            >
                                Open the viewer
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                            </Link>
                            <Link
                                href="/json-formatter"
                                className="inline-flex items-center rounded-xl border border-gray-300 bg-white/60 px-5 py-2.5 text-sm font-medium text-gray-700 backdrop-blur transition-colors hover:bg-white dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300 dark:hover:bg-gray-900"
                            >
                                Format some JSON
                            </Link>
                        </div>
                    </div>

                    <div className="lg:pl-4">
                        <MiniTree />
                    </div>
                </div>
            </section>

            {/* ── Proof strip ────────────────────────────────────────── */}
            <section className="border-b border-gray-200 bg-gray-50/60 dark:border-gray-800/70 dark:bg-gray-900/30">
                <dl className="mx-auto grid w-full max-w-[1180px] grid-cols-2 gap-px px-5 py-7 md:grid-cols-4">
                    {PROOF.map((item) => (
                        <div key={item.label} className="px-2 text-center">
                            <dt className="text-2xl font-semibold tracking-tight text-gray-900 md:text-[26px] dark:text-white">{item.value}</dt>
                            <dd className="mt-0.5 text-[11.5px] text-gray-500 dark:text-gray-500">{item.label}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            {/* ── Bento ──────────────────────────────────────────────── */}
            <section className="mx-auto w-full max-w-[1180px] px-5 py-14">
                <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                    Why large JSON stalls other viewers
                </h2>
                <SpotlightGrid className="mt-6 grid gap-3 md:grid-cols-3">
                    <article className="spotlight-card overflow-hidden rounded-2xl border border-gray-200 p-5 md:col-span-2 dark:border-gray-800">
                        <h3 className="relative text-sm font-semibold text-gray-900 dark:text-gray-100">One DOM node per value</h3>
                        <p className="relative mt-1.5 max-w-lg text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">
                            The common approach builds an element for every key and value in the document. At 120,000
                            records that is well over a million elements before the browser has painted anything. JSONic
                            keeps a flat row model and mounts only the rows inside the viewport.
                        </p>
                        <div className="relative mt-5 space-y-2.5">
                            <Bar label="Typical viewer" detail="~1,080,000 nodes" width="100%" tone="bad" />
                            <Bar label="JSONic" detail="~40 nodes on screen" width="4%" tone="good" />
                        </div>
                    </article>

                    <Card
                        icon={<Cpu className="h-4 w-4" aria-hidden />}
                        title="Parsed off the main thread"
                        body="JSON.parse on a large string blocks every interaction until it finishes. Ours runs in a Web Worker, and superseded jobs are dropped by id so fast typing never renders a stale result."
                    />
                    <Card
                        icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
                        title="Nothing is uploaded"
                        body="There is no upload step and no server-side processing. That matters when the payload you are debugging contains production data."
                    />
                    <Card
                        icon={<HardDriveDownload className="h-4 w-4" aria-hidden />}
                        title="Survives a reload"
                        body="Drafts autosave to IndexedDB on a debounce and when the tab hides, so closing it by accident does not cost you the document you were working through."
                    />
                    <Card
                        icon={<Zap className="h-4 w-4" aria-hidden />}
                        title="Degrades on purpose"
                        body="Above 1 MB live processing switches off; above 4 MB the editor becomes a read-only virtualized view. Guessing that a 50 MB textarea will stay responsive is what breaks other tools."
                    />
                </SpotlightGrid>
            </section>

            {/* ── Tools ──────────────────────────────────────────────── */}
            <section className="border-t border-gray-200 bg-gray-50/50 dark:border-gray-800/70 dark:bg-gray-900/20">
                <div className="mx-auto w-full max-w-[1180px] px-5 py-14">
                    <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                        All {TOOLS.length} tools
                    </h2>
                    <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-500">
                        Each one is its own page, and each one runs entirely in your browser.
                    </p>

                    {TOOL_GROUPS.map((group) => (
                        <div key={group} className="mt-8">
                            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                {group}
                            </h3>
                            <SpotlightGrid className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                                {toolsInGroup(group).map((tool) => (
                                    <Link
                                        key={tool.id}
                                        href={`/${tool.slug}`}
                                        className="spotlight-card group rounded-xl border border-gray-200 bg-white p-3.5 transition-colors hover:border-indigo-300 dark:border-gray-800 dark:bg-gray-900/40 dark:hover:border-indigo-500/50"
                                    >
                                        <span className="relative flex items-center gap-2">
                                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gray-100 text-gray-500 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-gray-800 dark:text-gray-400 dark:group-hover:bg-indigo-500/15 dark:group-hover:text-indigo-400">
                                                <ToolIcon name={tool.icon} className="h-[15px] w-[15px]" />
                                            </span>
                                            <span className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">{tool.name}</span>
                                        </span>
                                        <span className="relative mt-2 block text-[12px] leading-relaxed text-gray-500 dark:text-gray-400">
                                            {tool.summary}
                                        </span>
                                    </Link>
                                ))}
                            </SpotlightGrid>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FAQ ────────────────────────────────────────────────── */}
            <section className="mx-auto w-full max-w-[760px] px-5 pt-16">
                <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                    Common questions
                </h2>
                <dl className="mt-5 divide-y divide-gray-200 border-y border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                    {FAQ.map((item) => (
                        <div key={item.q} className="py-4">
                            <dt className="text-[14px] font-medium text-gray-900 dark:text-gray-100">{item.q}</dt>
                            <dd className="mt-1.5 text-[13.5px] leading-relaxed text-gray-600 dark:text-gray-400">{item.a}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            {/* ── Long-form copy ─────────────────────────────────────── */}
            <section className="mx-auto w-full max-w-[760px] px-5 py-16">
                <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                    What makes a JSON viewer slow
                </h2>
                <div className="mt-4 space-y-4 text-[14px] leading-relaxed text-gray-600 dark:text-gray-400">
                    <p>
                        Three things decide whether a browser-based JSON tool survives a large file, and most online
                        viewers get all three wrong at once.
                    </p>
                    <p>
                        <strong className="font-medium text-gray-800 dark:text-gray-200">Parsing on the main thread.</strong>{" "}
                        Calling JSON.parse on a 40 MB string blocks the event loop for as long as it takes. Nothing
                        repaints, no button responds, and the browser eventually offers to kill the page. Moving the parse
                        into a Web Worker does not make it faster, but it keeps the interface alive while it runs — and
                        lets a newer request supersede one already in flight, which is what makes live-as-you-type
                        processing viable at all.
                    </p>
                    <p>
                        <strong className="font-medium text-gray-800 dark:text-gray-200">Rendering the whole document.</strong>{" "}
                        A tree view that creates a component per value scales with the file rather than with the screen.
                        Virtualization inverts that: keep the document as a flat list of rows, work out which slice of
                        rows the viewport covers, and mount only those. Expanding a node becomes adding a path to a set,
                        and collapsed branches are never walked at all — so a 40 MB document with everything collapsed
                        costs about as much as an empty one.
                    </p>
                    <p>
                        <strong className="font-medium text-gray-800 dark:text-gray-200">Re-serialising to measure.</strong>{" "}
                        Computing statistics by calling JSON.stringify at every node re-serialises the whole subtree once
                        per node. A single traversal that counts as it goes gives the same numbers without the quadratic
                        behaviour, and an explicit stack instead of recursion means a deeply nested document cannot
                        overflow the call stack.
                    </p>
                    <p>
                        Past a certain size, the honest answer is to change what the tool offers rather than pretend.
                        Above 1 MB, JSONic stops reprocessing on every keystroke and waits for you to press Run. Above
                        4 MB, the editor becomes a read-only virtualized view, because no browser keeps an editable
                        textarea that large responsive. Being explicit about those thresholds is more useful than a
                        spinner that never resolves.
                    </p>
                </div>
            </section>
        </>
    );
}

function Card({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
    return (
        <article className="spotlight-card rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
            <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                {icon}
            </span>
            <h3 className="relative mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="relative mt-1.5 text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">{body}</p>
        </article>
    );
}

function Bar({ label, detail, width, tone }: { label: string; detail: string; width: string; tone: "bad" | "good" }) {
    return (
        <div>
            <div className="flex items-baseline justify-between text-[11.5px]">
                <span className="text-gray-600 dark:text-gray-400">{label}</span>
                <span className="tabular-nums text-gray-400 dark:text-gray-600">{detail}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                    className={`h-full rounded-full ${tone === "bad" ? "bg-rose-400/70" : "bg-emerald-500"}`}
                    style={{ width }}
                />
            </div>
        </div>
    );
}
