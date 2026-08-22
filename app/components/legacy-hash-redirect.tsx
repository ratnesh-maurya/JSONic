"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LEGACY_HASH_MAP } from "@/lib/tools";

/**
 * The previous version addressed tools with #treeview, #formatter and so on.
 * Those links exist in the wild, so send them to the real route rather than
 * dropping people on the landing page.
 */
export function LegacyHashRedirect() {
    const router = useRouter();

    useEffect(() => {
        const hash = window.location.hash.replace(/^#/, "");
        const target = LEGACY_HASH_MAP[hash];
        if (target) router.replace(target);
    }, [router]);

    return null;
}
