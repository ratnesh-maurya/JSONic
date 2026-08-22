"use client";

import { useCallback } from "react";

/**
 * One delegated pointermove for the whole grid instead of a listener per card.
 * The handler only writes two CSS custom properties, so the gradient is
 * composited by CSS — no React state, no re-render while the pointer moves.
 */
export function SpotlightGrid({ children, className }: { children: React.ReactNode; className?: string }) {
    const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        const card = (event.target as HTMLElement).closest<HTMLElement>(".spotlight-card");
        if (!card) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    }, []);

    return (
        <div onPointerMove={onPointerMove} className={className}>
            {children}
        </div>
    );
}
