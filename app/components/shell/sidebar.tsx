"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { ToolIcon } from "@/lib/tool-icons";
import { TOOLS, TOOL_GROUPS, toolsInGroup, type Tool } from "@/lib/tools";

interface SidebarProps {
    collapsed: boolean;
    onToggleCollapsed: () => void;
    collapsedGroups: string[];
    onToggleGroup: (group: string) => void;
    open: boolean;
    onClose: () => void;
}

/**
 * Tool navigation for 28 tools: five collapsible groups plus a filter.
 * Collapses to a 64px icon rail on desktop; becomes an off-canvas drawer below md.
 * Every item is a real <Link> to a real route — that is what makes each tool
 * individually indexable.
 */
export function Sidebar({ collapsed, onToggleCollapsed, collapsedGroups, onToggleGroup, open, onClose }: SidebarProps) {
    const pathname = usePathname();
    const [filter, setFilter] = useState("");
    const filterRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const typing = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);

            if (event.key === "Escape") {
                if (open) onClose();
                if (typing && target === filterRef.current) filterRef.current?.blur();
                return;
            }
            if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
            // "/" focuses the filter, "[" toggles the rail — both conventional
            if (event.key === "/") { event.preventDefault(); filterRef.current?.focus(); }
            if (event.key === "[") { event.preventDefault(); onToggleCollapsed(); }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose, onToggleCollapsed]);

    const matches = useMemo(() => {
        const needle = filter.trim().toLowerCase();
        if (!needle) return null;
        return TOOLS.filter((tool) =>
            tool.name.toLowerCase().includes(needle) ||
            tool.slug.includes(needle) ||
            tool.keywords.some((keyword) => keyword.includes(needle)),
        );
    }, [filter]);

    const width = collapsed ? "md:w-16" : "md:w-[248px]";

    return (
        <>
            {open && <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden" onClick={onClose} aria-hidden />}

            <aside
                aria-label="Tools"
                className={`fixed inset-y-0 left-0 z-40 flex w-[248px] shrink-0 flex-col border-r border-gray-200 bg-white
                    transition-[width,transform] duration-200 ease-out dark:border-gray-800/80 dark:bg-[#0d1117]
                    ${open ? "translate-x-0" : "-translate-x-full"} md:static md:translate-x-0 ${width}`}
            >
                <div className={`flex h-14 shrink-0 items-center border-b border-gray-200 dark:border-gray-800/80 ${collapsed ? "md:justify-center md:px-0" : "px-3"}`}>
                    <Link href="/" onClick={onClose} className="flex items-center gap-2 overflow-hidden">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-[13px] font-bold text-white">
                            J
                        </span>
                        <span className={`text-[15px] font-semibold tracking-tight text-gray-900 dark:text-gray-100 ${collapsed ? "md:hidden" : ""}`}>
                            JSONic
                        </span>
                    </Link>
                </div>

                {!collapsed && (
                    <div className="px-2 pt-2 md:block">
                        <label className="relative flex items-center">
                            <Search className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-gray-400" aria-hidden />
                            <input
                                ref={filterRef}
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                placeholder="Filter tools"
                                aria-label="Filter tools"
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-7 pr-7 text-xs text-gray-800 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-200"
                            />
                            <kbd className="pointer-events-none absolute right-2 rounded border border-gray-200 px-1 text-[9px] text-gray-400 dark:border-gray-700 dark:text-gray-600">
                                /
                            </kbd>
                        </label>
                    </div>
                )}

                <nav className="flex-1 overflow-y-auto px-1.5 py-2">
                    {matches ? (
                        matches.length === 0 ? (
                            <p className="px-2 py-4 text-center text-xs text-gray-400 dark:text-gray-600">No tool matches that.</p>
                        ) : (
                            <ul>{matches.map((tool) => <Item key={tool.id} tool={tool} pathname={pathname} collapsed={collapsed} onClose={onClose} />)}</ul>
                        )
                    ) : (
                        TOOL_GROUPS.map((group) => {
                            const tools = toolsInGroup(group);
                            // the active group stays open regardless of the stored state
                            const hasActive = tools.some((tool) => pathname === `/${tool.slug}`);
                            const isCollapsed = collapsedGroups.includes(group) && !hasActive;

                            return (
                                <div key={group} className="mb-1">
                                    {collapsed ? (
                                        <div className="mx-2 my-1.5 border-t border-gray-200 first:border-0 dark:border-gray-800" aria-hidden />
                                    ) : (
                                        <button
                                            onClick={() => onToggleGroup(group)}
                                            aria-expanded={!isCollapsed}
                                            className="flex w-full items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                        >
                                            <ChevronDown className={`h-3 w-3 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} aria-hidden />
                                            {group}
                                            <span className="ml-auto font-normal tabular-nums opacity-60">{tools.length}</span>
                                        </button>
                                    )}
                                    {!isCollapsed && (
                                        <ul>{tools.map((tool) => <Item key={tool.id} tool={tool} pathname={pathname} collapsed={collapsed} onClose={onClose} />)}</ul>
                                    )}
                                </div>
                            );
                        })
                    )}
                </nav>

                <div className="shrink-0 border-t border-gray-200 p-1.5 dark:border-gray-800/80">
                    <button
                        onClick={onToggleCollapsed}
                        title={`${collapsed ? "Expand" : "Collapse"} sidebar  ·  [`}
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        className={`hidden w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100 md:flex dark:text-gray-400 dark:hover:bg-gray-800/70 ${collapsed ? "md:justify-center" : ""}`}
                    >
                        {collapsed
                            ? <PanelLeftOpen className="h-4 w-4" aria-hidden />
                            : <PanelLeftClose className="h-4 w-4" aria-hidden />}
                        <span className={collapsed ? "md:hidden" : ""}>Collapse</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

function Item({ tool, pathname, collapsed, onClose }: {
    tool: Tool; pathname: string; collapsed: boolean; onClose: () => void;
}) {
    const href = `/${tool.slug}`;
    const active = pathname === href;

    return (
        <li>
            <Link
                href={href}
                onClick={onClose}
                title={collapsed ? tool.name : undefined}
                aria-current={active ? "page" : undefined}
                className={`group flex items-center gap-2.5 rounded-lg px-2 py-[7px] text-[13px] transition-colors
                    ${collapsed ? "md:justify-center md:px-0" : ""}
                    ${active
                        ? "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800/60"}`}
            >
                <ToolIcon
                    name={tool.icon}
                    className={`h-4 w-4 shrink-0 ${active ? "" : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300"}`}
                />
                <span className={`truncate ${collapsed ? "md:hidden" : ""}`}>{tool.name}</span>
            </Link>
        </li>
    );
}
