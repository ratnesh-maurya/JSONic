"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { FixedSizeList, type ListChildComponentProps } from "react-window";
import { TOKEN_CLASS, lineAt, lineIndex, tokenizeLine } from "@/lib/json/tokenize";

const ROW_HEIGHT = 20;

interface RowData {
    text: string;
    starts: number[];
    gutterWidth: number;
    errorLine?: number;
    highlight: boolean;
}

const Line = memo(function Line({ index, style, data }: ListChildComponentProps<RowData>) {
    const raw = lineAt(data.text, data.starts, index);
    const isError = data.errorLine === index + 1;

    return (
        <div style={style} className={`flex font-mono text-[12.5px] leading-[20px] ${isError ? "bg-red-50 dark:bg-red-500/15" : ""}`}>
            <span
                className="sticky left-0 shrink-0 select-none border-r border-gray-200 bg-gray-50 pr-2 text-right text-[11px] text-gray-400 dark:border-gray-700 dark:bg-gray-900/70 dark:text-gray-500"
                style={{ width: data.gutterWidth }}
            >
                {index + 1}
            </span>
            <code className="whitespace-pre pl-3">
                {data.highlight
                    ? tokenizeLine(raw).map((token, i) => (
                        <span key={i} className={TOKEN_CLASS[token.type]}>{token.value}</span>
                    ))
                    : raw}
            </code>
        </div>
    );
});

interface VirtualCodeViewProps {
    text: string;
    height: number;
    className?: string;
    errorLine?: number;
    /** syntax highlighting is skipped above the size tier where it stops paying off */
    highlight?: boolean;
}

/** Read-only code pane. Renders only the visible lines, tokenizing each on demand. */
export function VirtualCodeView({ text, height, className, errorLine, highlight = true }: VirtualCodeViewProps) {
    const listRef = useRef<FixedSizeList>(null);
    const starts = useMemo(() => lineIndex(text), [text]);
    const gutterWidth = Math.max(40, String(starts.length).length * 9 + 16);

    useEffect(() => {
        if (errorLine && errorLine > 0) listRef.current?.scrollToItem(errorLine - 1, "center");
    }, [errorLine]);

    const itemData = useMemo<RowData>(() => ({ text, starts, gutterWidth, errorLine, highlight }), [text, starts, gutterWidth, errorLine, highlight]);

    if (!text) return null;

    return (
        <FixedSizeList
            ref={listRef}
            height={height}
            itemCount={starts.length}
            itemSize={ROW_HEIGHT}
            width="100%"
            itemData={itemData}
            overscanCount={16}
            className={className}
        >
            {Line}
        </FixedSizeList>
    );
}
