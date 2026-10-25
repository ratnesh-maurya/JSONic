"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Menu } from "lucide-react";
import { usePrefs } from "@/lib/prefs";
import { ThemeToggle } from "../theme-toggle";
import { Sidebar } from "./sidebar";

interface AppShellProps {
    children: React.ReactNode;
}

/**
 * Sidebar + top bar + content column. The whole shell is client-side because
 * the sidebar owns interactive state, but the page content passed as children
 * is server-rendered, so the indexable copy still ships in the HTML.
 */
/** lucide dropped brand marks, so the GitHub logo stays as inline path data. */
function GithubMark({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.5 11.5 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.652.242 2.873.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
        </svg>
    );
}

export function AppShell({ children }: AppShellProps) {
    const { prefs, update, hydrated } = usePrefs();
    const pathname = usePathname();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const toggleCollapsed = useCallback(() => {
        update({ sidebarCollapsed: !prefs.sidebarCollapsed });
    }, [prefs.sidebarCollapsed, update]);

    const toggleGroup = useCallback((group: string) => {
        const collapsedGroups = prefs.collapsedGroups.includes(group)
            ? prefs.collapsedGroups.filter((name) => name !== group)
            : [...prefs.collapsedGroups, group];
        update({ collapsedGroups });
    }, [prefs.collapsedGroups, update]);

    return (
        <div className="flex min-h-screen bg-[var(--background)]">
            <Sidebar
                collapsed={hydrated ? prefs.sidebarCollapsed : false}
                onToggleCollapsed={toggleCollapsed}
                collapsedGroups={hydrated ? prefs.collapsedGroups : []}
                onToggleGroup={toggleGroup}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
            />

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-gray-200 bg-white/85 px-3 backdrop-blur-md dark:border-gray-800 dark:bg-[#0d0d14]/85">
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden dark:text-gray-400 dark:hover:bg-gray-800"
                        aria-label="Open navigation"
                    >
                        <Menu className="h-5 w-5" aria-hidden />
                    </button>

                    <Link
                        href="/"
                        aria-label="Home"
                        aria-current={pathname === "/" ? "page" : undefined}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    >
                        <Home className="h-4 w-4" aria-hidden />
                        Home
                    </Link>

                    <div className="ml-auto flex items-center gap-1.5">
                        <ThemeToggle />
                        <a
                            href="https://github.com/ratnesh-maurya/JSONic"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="JSONic on GitHub"
                            className="grid h-9 w-9 place-items-center rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        >
                            <GithubMark className="h-[18px] w-[18px]" />
                        </a>
                    </div>
                </header>

                <main className="min-w-0 flex-1">{children}</main>
            </div>
        </div>
    );
}
