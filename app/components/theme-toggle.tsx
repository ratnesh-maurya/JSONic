"use client";

import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

export const ThemeToggle = ({ className }: { className?: string }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
      className={cn(
        "flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-full transition-all duration-300",
        "bg-gray-200/80 hover:bg-gray-300/80 dark:bg-gray-700/80 dark:hover:bg-gray-600/80",
        "border border-gray-200 dark:border-gray-600",
        "backdrop-blur-sm cursor-pointer",
        className
      )}
    >
      {theme === "light" ? (
        <svg
          className="w-5 h-5 text-amber-600 dark:text-amber-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5 text-indigo-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
};
