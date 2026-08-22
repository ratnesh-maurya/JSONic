import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ToolIcon } from "@/lib/tool-icons";
import { toolJsonLd } from "@/lib/seo";
import type { Tool } from "@/lib/tools";

/**
 * Shared chrome for every tool route.
 *
 * The visible copy is deliberately one line plus three chips. The long-form
 * paragraph and the FAQ still ship in the server-rendered HTML — inside
 * collapsed <details>, which Google crawls and indexes — they just do not take
 * up the screen the tool should be using.
 */
export function ToolPage({ tool, children }: { tool: Tool; children: React.ReactNode }) {
    return (
        <div className="mx-auto w-full max-w-[1600px] px-3 py-4 md:px-6 md:py-5">
            <nav aria-label="Breadcrumb" className="mb-2.5 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-500">
                <Link href="/" className="hover:text-gray-800 dark:hover:text-gray-300">JSONic</Link>
                <ChevronRight className="h-3 w-3" aria-hidden />
                <span className="text-gray-400 dark:text-gray-600">{tool.group}</span>
                <ChevronRight className="h-3 w-3" aria-hidden />
                <span className="text-gray-700 dark:text-gray-300">{tool.name}</span>
            </nav>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                    <ToolIcon name={tool.icon} className="h-[18px] w-[18px]" />
                </span>
                <h1 className="text-lg font-semibold tracking-tight text-gray-900 md:text-xl dark:text-gray-50">
                    {tool.heading}
                </h1>
                <ul className="flex flex-wrap items-center gap-1.5">
                    {tool.chips.map((chip) => (
                        <li
                            key={chip}
                            className="rounded-full border border-gray-200 px-2 py-0.5 text-[10.5px] font-medium text-gray-500 dark:border-gray-700/80 dark:text-gray-400"
                        >
                            {chip}
                        </li>
                    ))}
                </ul>
            </div>

            <p className="mt-1.5 text-[13px] text-gray-600 dark:text-gray-400">{tool.summary}</p>

            <div className="mt-4">{children}</div>

            <section className="mt-10 border-t border-gray-200 pt-5 dark:border-gray-800/80">
                <details className="group">
                    <summary className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-gray-700 marker:content-[''] hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" aria-hidden />
                        About {tool.name.toLowerCase()}
                    </summary>
                    <p className="mt-2.5 max-w-3xl text-[13px] leading-relaxed text-gray-700 dark:text-gray-300">
                        {tool.answer}
                    </p>
                    <p className="mt-2.5 max-w-3xl text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">
                        {tool.about}
                    </p>
                </details>

                <h2 className="mt-6 text-[13px] font-medium text-gray-700 dark:text-gray-300">Questions</h2>
                <div className="mt-2 max-w-3xl divide-y divide-gray-200 border-y border-gray-200 dark:divide-gray-800/80 dark:border-gray-800/80">
                    {tool.faq.map((entry) => (
                        <details key={entry.q} className="group py-2">
                            <summary className="flex cursor-pointer items-start gap-1.5 text-[13px] text-gray-700 marker:content-[''] hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">
                                <ChevronRight className="mt-[3px] h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-90" aria-hidden />
                                {entry.q}
                            </summary>
                            <p className="mt-1.5 pl-5 text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">{entry.a}</p>
                        </details>
                    ))}
                </div>
            </section>

            <ToolSchema tool={tool} />
        </div>
    );
}

function ToolSchema({ tool }: { tool: Tool }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd(tool)) }}
        />
    );
}
