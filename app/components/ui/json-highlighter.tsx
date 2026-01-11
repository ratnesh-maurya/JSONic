"use client";

import { useMemo } from "react";

interface JSONToken {
    type: 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punctuation' | 'whitespace';
    value: string;
    indent?: number;
}

interface JSONHighlighterProps {
    json: string;
    className?: string;
}

export const JSONHighlighter = ({ json, className }: JSONHighlighterProps) => {
    const tokens = useMemo(() => {
        if (!json) return [];

        try {
            const parsed = JSON.parse(json);
            const formatted = JSON.stringify(parsed, null, 2);
            return tokenizeJSON(formatted);
        } catch {
            return [{ type: 'string' as const, value: json }];
        }
    }, [json]);

    const tokenizeJSON = (jsonString: string): JSONToken[] => {
        const tokens: JSONToken[] = [];
        const lines = jsonString.split('\n');

        lines.forEach((line, lineIndex) => {
            if (line.trim() === '') {
                tokens.push({ type: 'whitespace', value: '\n' });
                return;
            }

            const indentMatch = line.match(/^(\s*)/);
            const indent = indentMatch ? indentMatch[1].length : 0;
            const content = line.trim();

            // Add indentation
            if (indent > 0) {
                tokens.push({ type: 'whitespace', value: ' '.repeat(indent) });
            }

            // Parse the content
            let i = 0;
            while (i < content.length) {
                const char = content[i];

                if (char === '"') {
                    // Handle quoted strings (keys or values)
                    const quoteEnd = findClosingQuote(content, i);
                    const quotedContent = content.substring(i, quoteEnd + 1);

                    // Check if this is a key (followed by colon)
                    const afterQuote = content.substring(quoteEnd + 1).trim();
                    if (afterQuote.startsWith(':')) {
                        tokens.push({ type: 'key', value: quotedContent });
                    } else {
                        tokens.push({ type: 'string', value: quotedContent });
                    }
                    i = quoteEnd + 1;
                } else if (char === ':') {
                    tokens.push({ type: 'punctuation', value: ':' });
                    i++;
                } else if (char === ',' || char === '{' || char === '}' || char === '[' || char === ']') {
                    tokens.push({ type: 'punctuation', value: char });
                    i++;
                } else if (char === ' ') {
                    tokens.push({ type: 'whitespace', value: ' ' });
                    i++;
                } else {
                    // Handle numbers, booleans, null
                    const wordMatch = content.substring(i).match(/^(true|false|null|\d+\.?\d*)/);
                    if (wordMatch) {
                        const word = wordMatch[1];
                        if (word === 'true' || word === 'false') {
                            tokens.push({ type: 'boolean', value: word });
                        } else if (word === 'null') {
                            tokens.push({ type: 'null', value: word });
                        } else {
                            tokens.push({ type: 'number', value: word });
                        }
                        i += word.length;
                    } else {
                        i++;
                    }
                }
            }

            if (lineIndex < lines.length - 1) {
                tokens.push({ type: 'whitespace', value: '\n' });
            }
        });

        return tokens;
    };

    const findClosingQuote = (str: string, startIndex: number): number => {
        for (let i = startIndex + 1; i < str.length; i++) {
            if (str[i] === '"' && str[i - 1] !== '\\') {
                return i;
            }
        }
        return str.length - 1;
    };

    const getTokenStyle = (token: JSONToken) => {
        switch (token.type) {
            case 'key':
                return 'text-sky-600 font-medium';
            case 'string':
                return 'text-emerald-600';
            case 'number':
                return 'text-violet-600 font-medium';
            case 'boolean':
                return 'text-red-600 font-semibold';
            case 'null':
                return 'text-gray-500 font-semibold';
            case 'punctuation':
                return 'text-gray-700';
            default:
                return 'text-gray-900';
        }
    };

    return (
        <pre className={`${className} leading-relaxed`}>
            {tokens.map((token, index) => (
                <span
                    key={index}
                    className={getTokenStyle(token)}
                >
                    {token.value}
                </span>
            ))}
        </pre>
    );
};
