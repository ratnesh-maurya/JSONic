import {
    AlignJustify, ArrowDownAZ, Binary, Blocks, Boxes, Braces, ChartPie, Code2, Coffee,
    Database, FileCode2, FileInput, FileJson2, Gem, GitCompareArrows, GitMerge, Hash,
    KeyRound, Layers, ListTree, Minimize2, Quote, Search, Shapes, ShieldCheck, Sparkles, Table,
    type LucideIcon,
} from "lucide-react";
import type { IconName } from "./tools";

/**
 * Named imports only — a barrel import of lucide-react would pull the whole
 * 1,500-icon set. Next rewrites these to deep imports via optimizePackageImports,
 * which lucide-react is on the default list for.
 */
export const TOOL_ICONS: Record<IconName, LucideIcon> = {
    ListTree, ShieldCheck, GitCompareArrows, Search, ChartPie,
    Sparkles, Minimize2, ArrowDownAZ, Quote,
    Layers, GitMerge, Binary, KeyRound,
    Table, FileCode2, Code2, FileInput, AlignJustify, Database,
    Braces, Blocks, Coffee, Hash, Boxes, Shapes, FileJson2, Gem,
};

export function ToolIcon({ name, className }: { name: IconName; className?: string }) {
    const Icon = TOOL_ICONS[name];
    return <Icon className={className} aria-hidden strokeWidth={1.75} />;
}
