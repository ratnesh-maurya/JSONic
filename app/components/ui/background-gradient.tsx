"use client";

import { cn } from "@/lib/utils";

export const BackgroundGradient = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <div
            className={cn(
                "relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto rounded-xl p-6 border",
                className
            )}
        >
            <div className="relative z-10">{children}</div>
        </div>
    );
};
