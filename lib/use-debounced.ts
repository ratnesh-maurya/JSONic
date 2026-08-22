"use client";

import { useEffect, useState } from "react";

/** Value that settles `delay` ms after the last change. Keeps parse work off the keystroke path. */
export function useDebounced<T>(value: T, delay = 250): T {
    const [settled, setSettled] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setSettled(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return settled;
}
