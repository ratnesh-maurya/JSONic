"use client";

import { useState, useEffect, useRef } from "react";

import { BackgroundBeamsWithCollision } from "./components/ui/aurora-background";
import { ThemeToggle } from "./components/theme-toggle";
import { JSONHighlighter } from "./components/ui/json-highlighter";
import { JSONTreeViewer } from "./components/ui/json-tree-viewer";
import { JSONComparer } from "./components/ui/json-comparer";
import { TextareaWithLineNumbers } from "./components/ui/textarea-with-line-numbers";
import { Footer } from "./components/footer";
import { StructuredData } from "./components/structured-data";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "./components/ui/toast-provider";
import {
  trackJsonFormat,
  trackJsonValidation,
  trackTreeAnalysis,
  trackCopyToClipboard,
  trackSampleLoaded,
  trackToolSwitch,
  trackError,
} from "@/lib/analytics";

export default function Home() {
  const { showToast } = useToast();
  const [jsonInput, setJsonInput] = useState("");

  // Helper function for copying with toast notification
  const copyToClipboard = async (text: string, message: string = "Copied to clipboard!", contentType: string = "text") => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(message, 'success', 2500);
      trackCopyToClipboard(contentType);
    } catch (_error) {
      showToast("Failed to copy to clipboard", 'error', 3000);
      trackError("copy_to_clipboard_error", _error instanceof Error ? _error.message : "Unknown error");
    }
  };
  const [formattedJson, setFormattedJson] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("treeview");
  const [indentSize, setIndentSize] = useState(2);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorPosition, setErrorPosition] = useState<{ line: number; column: number } | null>(null);
  const [viewMode, setViewMode] = useState<"text" | "tree">("tree");
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [sortKeys, setSortKeys] = useState(false);
  const [jsonPathQuery, setJsonPathQuery] = useState("$..*");
  const [jsonPathResult, setJsonPathResult] = useState("");

  const [typesResult, setTypesResult] = useState("");
  const [typeLanguage, setTypeLanguage] = useState<"go" | "typescript">("go");
  const [compressionRatio, setCompressionRatio] = useState(0);

  // Persist type language preference
  useEffect(() => {
    const savedTypeLang = localStorage.getItem("jsonicTypeLanguage");
    if (savedTypeLang === "go" || savedTypeLang === "typescript") {
      setTypeLanguage(savedTypeLang);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("jsonicTypeLanguage", typeLanguage);
  }, [typeLanguage]);
  const [treeStats, setTreeStats] = useState<{
    nodes: number; depth: number; size: number;
    types: { strings: number; numbers: number; booleans: number; nulls: number; objects: number; arrays: number };
  }>({ nodes: 0, depth: 0, size: 0, types: { strings: 0, numbers: 0, booleans: 0, nulls: 0, objects: 0, arrays: 0 } });
  const [treeInputCollapsed, setTreeInputCollapsed] = useState(false);
  const [validationSuggestions, setValidationSuggestions] = useState<string[]>([]);
  const toolInputRef = useRef<HTMLDivElement>(null);

  // Settings Persistence
  useEffect(() => {
    const savedSettings = localStorage.getItem("jsonicSettings");
    if (savedSettings) {
      const { activeTab, indentSize, sortKeys } = JSON.parse(savedSettings);
      setActiveTab(activeTab || "treeview");
      setIndentSize(indentSize || 2);
      setSortKeys(sortKeys || false);
    }
  }, []);

  useEffect(() => {
    const settings = { activeTab, indentSize, sortKeys };
    localStorage.setItem("jsonicSettings", JSON.stringify(settings));
  }, [activeTab, indentSize, sortKeys]);

  // JSON Comparison states
  const [json1, setJson1] = useState("");
  const [json2, setJson2] = useState("");

  const formatJson = () => {
    try {
      // Auto-fix common JSON issues
      const fixedInput = jsonInput
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3') // Add quotes to unquoted keys
        .replace(/:\s*'([^']*)'/g, ': "$1"') // Replace single quotes with double quotes
        .replace(/,\s*}/g, '}') // Remove trailing commas in objects
        .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays

      let parsed = JSON.parse(fixedInput);

      if (sortKeys) {
        parsed = sortObjectKeys(parsed);
      }

      const formatted = JSON.stringify(parsed, null, indentSize);
      setFormattedJson(formatted);
      setIsValid(true);
      setErrorMessage("");
      setErrorPosition(null);
      setIsErrorVisible(false);

      // Track the formatting action
      trackJsonFormat(jsonInput.length, formatted.length);

      // Update input if auto-fix was applied
      if (fixedInput !== jsonInput) {
        setJsonInput(fixedInput);
      }
    } catch (_error) {
      setIsValid(false);
      setFormattedJson("");
      const errorMsg = _error instanceof Error ? _error.message : "Invalid JSON";
      setErrorMessage(errorMsg);
      setIsErrorVisible(true);
      // Find error position
      const position = findErrorPosition(jsonInput);
      setErrorPosition(position);

      // Track the error
      trackError("json_format_error", errorMsg);
    }
  };

  const sortObjectKeys = (obj: unknown): unknown => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sortObjectKeys);
    }

    return Object.keys(obj as Record<string, unknown>)
      .sort()
      .reduce((result, key) => {
        (result as Record<string, unknown>)[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
        return result;
      }, {} as Record<string, unknown>);
  };

  const compressJson = () => {
    try {
      const originalSize = jsonInput.length;
      const parsed = JSON.parse(jsonInput);
      const compressed = JSON.stringify(parsed);
      const compressedSize = compressed.length;
      setFormattedJson(compressed);
      setIsValid(true);
      setErrorMessage("");
      setErrorPosition(null);
      setIsErrorVisible(false);
      setCompressionRatio(originalSize > 0 ? ((originalSize - compressedSize) / originalSize) * 100 : 0);
    } catch (error) {
      setIsValid(false);
      setFormattedJson("");
      setErrorMessage(error instanceof Error ? error.message : "Invalid JSON");
      setIsErrorVisible(true);
      const position = findErrorPosition(jsonInput);
      setErrorPosition(position);
    }
  };

  const validateJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setIsValid(true);
      setFormattedJson("✅ Valid JSON");
      setErrorMessage("");
      setErrorPosition(null);
      setIsErrorVisible(false);

      // Generate intelligent suggestions
      const suggestions = generateValidationSuggestions(jsonInput, parsed);
      setValidationSuggestions(suggestions);

      // Track successful validation
      trackJsonValidation(true);
    } catch (error) {
      setIsValid(false);
      setFormattedJson("❌ Invalid JSON");
      const errorMsg = error instanceof Error ? error.message : "Invalid JSON";
      setErrorMessage(errorMsg);
      const position = findErrorPosition(jsonInput);
      setErrorPosition(position);
      setIsErrorVisible(true);

      // Generate fix suggestions
      const fixSuggestions = generateFixSuggestions(jsonInput, errorMsg);
      setValidationSuggestions(fixSuggestions);

      // Track validation failure
      trackJsonValidation(false, errorMsg);
    }
  };

  const generateValidationSuggestions = (jsonString: string, parsed: unknown): string[] => {
    const suggestions = [];

    // Check for potential improvements
    if (jsonString.includes('null')) {
      suggestions.push("💡 Consider using meaningful default values instead of null");
    }

    if (typeof parsed === 'object' && parsed !== null) {
      const keys = Object.keys(parsed);
      if (keys.some(key => key.includes(' '))) {
        suggestions.push("⚠️ Some keys contain spaces - consider using camelCase or snake_case");
      }

      if (keys.length > 20) {
        suggestions.push("📊 Large object detected - consider breaking into smaller structures");
      }
    }

    if (Array.isArray(parsed) && parsed.length > 1000) {
      suggestions.push("🚀 Large array detected - consider pagination for better performance");
    }

    if (jsonString.length > 10000) {
      suggestions.push("📦 Large JSON detected - consider compression or chunking");
    }

    return suggestions;
  };

  const generateFixSuggestions = (jsonString: string, errorMsg: string): string[] => {
    const suggestions = [];

    if (errorMsg.includes("trailing comma")) {
      suggestions.push("🔧 Remove trailing commas after the last item in objects/arrays");
    }

    if (errorMsg.includes("Unexpected token")) {
      suggestions.push("🔧 Check for unescaped quotes or special characters");
      suggestions.push("🔧 Ensure all strings are properly quoted");
    }

    if (errorMsg.includes("Unexpected end")) {
      suggestions.push("🔧 Check for missing closing brackets ] or braces }");
    }

    if (jsonString.includes("'")) {
      suggestions.push("🔧 Replace single quotes with double quotes");
    }

    if (jsonString.match(/[a-zA-Z_][a-zA-Z0-9_]*\s*:/)) {
      suggestions.push("🔧 Wrap property names in double quotes");
    }

    return suggestions;
  };

  const countJsonTypes = (obj: unknown) => {
    const counts = { strings: 0, numbers: 0, booleans: 0, nulls: 0, objects: 0, arrays: 0 };
    const traverse = (val: unknown) => {
      if (val === null) { counts.nulls++; }
      else if (typeof val === "string") { counts.strings++; }
      else if (typeof val === "number") { counts.numbers++; }
      else if (typeof val === "boolean") { counts.booleans++; }
      else if (Array.isArray(val)) { counts.arrays++; val.forEach(traverse); }
      else if (typeof val === "object") { counts.objects++; Object.values(val as object).forEach(traverse); }
    };
    traverse(obj);
    return counts;
  };

  const analyzeJsonTree = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      const stats = calculateTreeStats(parsed);
      const types = countJsonTypes(parsed);
      setTreeStats({ ...stats, types });

      // Track tree analysis
      trackTreeAnalysis(stats.nodes, stats.depth, stats.size);
    } catch (error) {
      setTreeStats({ nodes: 0, depth: 0, size: 0, types: { strings: 0, numbers: 0, booleans: 0, nulls: 0, objects: 0, arrays: 0 } });
      trackError("tree_analysis_error", error instanceof Error ? error.message : "Unknown error");
    }
  };

  const calculateTreeStats = (obj: unknown, depth = 0): { nodes: number; depth: number; size: number } => {
    let nodes = 1;
    let maxDepth = depth;
    const size = JSON.stringify(obj).length;

    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        obj.forEach(item => {
          const childStats = calculateTreeStats(item, depth + 1);
          nodes += childStats.nodes;
          maxDepth = Math.max(maxDepth, childStats.depth);
        });
      } else {
        Object.values(obj).forEach(value => {
          const childStats = calculateTreeStats(value, depth + 1);
          nodes += childStats.nodes;
          maxDepth = Math.max(maxDepth, childStats.depth);
        });
      }
    }

    return { nodes, depth: maxDepth, size };
  };

  const evaluateJsonPath = async () => {
    try {
      const jp = await import('jsonpath');
      const parsed = JSON.parse(jsonInput);
      const result = jp.query(parsed, jsonPathQuery);
      setJsonPathResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setJsonPathResult(error instanceof Error ? error.message : "Invalid JSON or JSONPath Query");
    }
  };



  const convertToTypes = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (typeLanguage === "go") {
        const type = jsonToGoTypes(parsed, "Root");
        setTypesResult(type);
      } else {
        const type = jsonToTypeScriptTypes(parsed, "Root");
        setTypesResult(type);
      }
    } catch (error) {
      setTypesResult(error instanceof Error ? error.message : "Error generating types.");
    }
  };

  // Auto-generate types when JSON input changes
  useEffect(() => {
    if (jsonInput.trim() && activeTab === "types") {
      // Add small delay to debounce rapid input
      const timeoutId = setTimeout(() => {
        try {
          const parsed = JSON.parse(jsonInput);
          if (typeLanguage === "go") {
            const type = jsonToGoTypes(parsed, "Root");
            setTypesResult(type);
          } else {
            const type = jsonToTypeScriptTypes(parsed, "Root");
            setTypesResult(type);
          }
        } catch {
          // Invalid JSON - show error message
          if (jsonInput.trim().length > 0) {
            setTypesResult(typeLanguage === "go"
              ? "// Invalid JSON - please check your input"
              : "// Invalid JSON - please check your input");
          } else {
            setTypesResult("");
          }
        }
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    } else if (activeTab !== "types") {
      setTypesResult("");
    } else if (!jsonInput.trim()) {
      setTypesResult("");
    }
  }, [jsonInput, typeLanguage, activeTab]);

  const jsonToGoTypes = (obj: unknown, name: string): string => {
    const toCamelCase = (str: string) => {
      return str.charAt(0).toUpperCase() + str.slice(1).replace(/[-_](.)/g, (_, c) => c.toUpperCase());
    };

    const goTypeName = toCamelCase(name);

    if (typeof obj !== 'object' || obj === null) {
      const goType = typeof obj === 'string' ? 'string' :
        typeof obj === 'number' ? (Number.isInteger(obj) ? 'int' : 'float64') :
          typeof obj === 'boolean' ? 'bool' : 'interface{}';
      return `type ${goTypeName} ${goType}`;
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return `type ${goTypeName} []interface{}`;
      }

      const firstItem = obj[0];

      // If the array contains objects, emit both the slice type and the item struct type
      if (typeof firstItem === 'object' && firstItem !== null) {
        const itemName = `${goTypeName}Item`;
        const itemDef = jsonToGoTypes(firstItem, itemName);
        return `type ${goTypeName} []${itemName}\n\n${itemDef}`;
      }

      // For primitive arrays, infer the element type directly
      const itemType = getGoTypeForValue(firstItem, `${goTypeName}Item`);
      return `type ${goTypeName} []${itemType}`;
    }

    const keys = Object.keys(obj as Record<string, unknown>);
    if (keys.length === 0) {
      return `type ${goTypeName} struct {}`;
    }

    const fields = keys.map(key => {
      const fieldName = toCamelCase(key);
      // Always add json tag for consistency and to handle edge cases
      const jsonTag = ` \`json:"${key}"\``;
      const value = (obj as Record<string, unknown>)[key];
      const fieldType = getGoTypeForValue(value, fieldName);
      return `\t${fieldName} ${fieldType}${jsonTag}`;
    }).join('\n');

    const nestedTypes = keys
      .map(key => {
        const value = (obj as Record<string, unknown>)[key];
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return jsonToGoTypes(value, key);
        } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
          return jsonToGoTypes(value[0], `${key}Item`);
        }
        return '';
      })
      .filter(Boolean)
      .join('\n\n');

    return `type ${goTypeName} struct {\n${fields}\n}${nestedTypes ? '\n\n' + nestedTypes : ''}`;
  };

  const getGoTypeForValue = (value: unknown, name: string): string => {
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'float64';
    if (typeof value === 'boolean') return 'bool';
    if (value === null) return 'interface{}';

    if (Array.isArray(value)) {
      if (value.length === 0) return '[]interface{}';
      const itemType = getGoTypeForValue(value[0], `${name}Item`);
      return `[]${itemType}`;
    }

    if (typeof value === 'object' && value !== null) {
      const toCamelCase = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).replace(/[-_](.)/g, (_, c) => c.toUpperCase());
      return toCamelCase(name);
    }

    return 'interface{}';
  };

  const jsonToTypeScriptTypes = (obj: unknown, name: string): string => {
    if (typeof obj !== 'object' || obj === null) {
      return `type ${name} = ${typeof obj};`;
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return `type ${name} = any[];`;
      }
      return `type ${name} = ${jsonToTypeScriptTypes(obj[0], name + "Item")}[];`;
    }

    const keys = Object.keys(obj as Record<string, unknown>);

    return `interface ${name} {\n${keys.map(key => `  ${key}: ${capitalize(key)};`).join('\n')}\n}\n\n${keys.map(key => jsonToTypeScriptTypes((obj as Record<string, unknown>)[key], capitalize(key))).join('\n')}`;
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const findErrorPosition = (jsonString: string): { line: number; column: number } => {
    try {
      JSON.parse(jsonString);
      return { line: 0, column: 0 };
    } catch {
      const lines = jsonString.split('\n');
      let currentPos = 0;

      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];
        try {
          JSON.parse(jsonString.substring(0, currentPos + line.length));
          currentPos += line.length + 1; // +1 for newline
        } catch {
          // Found the problematic line, now find the column
          const lineContent = jsonString.substring(currentPos, currentPos + line.length);
          for (let col = 0; col < lineContent.length; col++) {
            try {
              JSON.parse(jsonString.substring(0, currentPos + col));
            } catch {
              return { line: lineNum + 1, column: col + 1 };
            }
          }
          return { line: lineNum + 1, column: line.length + 1 };
        }
      }
      return { line: lines.length, column: 1 };
    }
  };

  const clearAll = () => {
    setJsonInput("");
    setFormattedJson("");
    setIsValid(null);
    setErrorMessage("");
    setErrorPosition(null);
    setIsErrorVisible(false);
    setTypesResult("");
  };

  const clearComparison = () => {
    setJson1("");
    setJson2("");
  };

  const loadSampleJson = (onLoaded?: (sampleStr: string) => void) => {
    const sample = {
      "name": "John Doe",
      "age": 30,
      "email": "john@example.com",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "country": "USA"
      },
      "hobbies": ["reading", "swimming", "coding"],
      "active": true
    };
    const sampleStr = JSON.stringify(sample, null, 2);
    setJsonInput(sampleStr);
    setErrorMessage("");
    setErrorPosition(null);
    setIsErrorVisible(false);
    onLoaded?.(sampleStr);

    // Scroll to show loaded content
    requestAnimationFrame(() => {
      toolInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    trackSampleLoaded("user_profile");
  };

  const loadSampleComparison = () => {
    const sample1 = {
      "name": "John Doe",
      "age": 30,
      "email": "john@example.com",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "country": "USA"
      },
      "hobbies": ["reading", "swimming"],
      "active": true
    };

    const sample2 = {
      "name": "John Doe",
      "age": 31,
      "email": "john@example.com",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "country": "USA"
      },
      "hobbies": ["reading", "swimming", "coding"],
      "active": true,
      "newField": "added"
    };

    setJson1(JSON.stringify(sample1, null, 2));
    setJson2(JSON.stringify(sample2, null, 2));

    requestAnimationFrame(() => {
      toolInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    trackSampleLoaded("comparison");
  };

  const tabs = [
    { id: "treeview", name: "Tree View", icon: "🌳", description: "Interactive JSON tree explorer" },
    { id: "comparer", name: "Comparer", icon: "🔍", description: "Compare JSON differences" },
    { id: "validator", name: "Validator", icon: "✅", description: "Validate JSON syntax" },
    { id: "formatter", name: "Formatter", icon: "✨", description: "Format and beautify JSON" },
    { id: "compressor", name: "Compressor", icon: "🗜️", description: "Compress JSON size" },
    { id: "jsonpath", name: "JSONPath", icon: "🔎", description: "Query JSON with JSONPath" },
    { id: "types", name: "To Types", icon: "📜", description: "JSON to Go/TypeScript" },
  ];

  const renderToolContent = () => {
    return (
      <>
        {isErrorVisible && (
          <div className="relative flex items-center justify-between p-4 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 shadow-sm">
            <div>
              <p className="font-semibold">❌ Invalid JSON</p>
              <p className="text-sm mt-1 text-red-600">{errorMessage}</p>
              {errorPosition && (
                <div className="mt-1 text-xs text-red-500">
                  Error near line {errorPosition.line}, column {errorPosition.column}
                </div>
              )}
            </div>
            <button
              onClick={() => setIsErrorVisible(false)}
              className="absolute top-2 right-2 text-red-600 hover:text-red-700 transition-colors cursor-pointer text-lg leading-none"
            >
              &#x2715;
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {(() => {
          switch (activeTab) {
            case "treeview":
              return (
                <motion.div
                  key="treeview"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="space-y-4"
                >
                  {/* Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => loadSampleJson((s) => analyzeJsonTree(s))}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-xl text-sm transition-all duration-200 border border-gray-200 dark:border-gray-600 cursor-pointer font-medium"
                      >
                        Load Sample
                      </button>
                      <button
                        onClick={() => analyzeJsonTree(jsonInput)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm transition-all duration-200 border border-emerald-300 cursor-pointer"
                      >
                        Analyze Tree
                      </button>
                    </div>
                    {treeStats.nodes > 0 && (
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-medium">
                          {treeStats.nodes} nodes
                        </span>
                        <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-1 rounded text-xs font-medium">
                          {treeStats.depth} levels
                        </span>
                        <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded text-xs font-medium">
                          {(treeStats.size / 1024).toFixed(1)}KB
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Main panels */}
                  <div className="h-[580px] md:h-[640px] lg:h-[720px] w-full">
                    {/* Mobile: stacked layout */}
                    <div className="flex flex-col md:hidden h-full gap-3 overflow-auto overflow-x-hidden min-h-0">
                      <div className="space-y-1.5 flex-shrink-0">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Input JSON</label>
                        <textarea
                          value={jsonInput}
                          onChange={(e) => {
                            setJsonInput(e.target.value);
                            if (e.target.value) {
                              analyzeJsonTree(e.target.value);
                            }
                          }}
                          placeholder="Paste your JSON here to explore its structure..."
                          className="w-full h-[200px] min-h-[100px] p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 font-mono shadow-sm text-xs resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                      </div>
                      <div className="space-y-1.5 flex-1 min-h-[220px] flex flex-col">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Interactive Tree View</label>
                          {jsonInput && (
                            <button
                              onClick={() => copyToClipboard(jsonInput, "JSON copied!")}
                              className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 transition-colors cursor-pointer"
                              title="Copy full JSON"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                              Copy JSON
                            </button>
                          )}
                        </div>
                        <div className="flex-1 min-h-[200px] p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm overflow-auto overflow-x-auto">
                          {jsonInput ? (
                            <JSONTreeViewer json={jsonInput} />
                          ) : (
                            <div className="text-gray-600 dark:text-gray-400 text-center py-12">
                              <div className="text-5xl mb-3">🌳</div>
                              <p className="text-sm">Enter JSON above to explore its tree structure</p>
                              <p className="text-xs mt-1 opacity-80">Tap nodes to expand/collapse</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Desktop: side-by-side resizable with collapsible input */}
                    <div className="hidden md:flex h-full gap-3">
                      {/* Collapsible Input Panel */}
                      <AnimatePresence initial={false}>
                        {!treeInputCollapsed && (
                          <motion.div
                            key="tree-input-panel"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "50%" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="flex flex-col min-w-0 overflow-hidden"
                          >
                            <div className="space-y-1.5 h-full flex flex-col">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Input JSON</label>
                                <button
                                  onClick={() => setTreeInputCollapsed(true)}
                                  title="Collapse input"
                                  className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 transition-colors cursor-pointer"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                                  Collapse
                                </button>
                              </div>
                              <textarea
                                value={jsonInput}
                                onChange={(e) => {
                                  setJsonInput(e.target.value);
                                  if (e.target.value) {
                                    analyzeJsonTree(e.target.value);
                                  }
                                }}
                                placeholder="Paste your JSON here to explore its structure..."
                                className="flex-1 p-3 md:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 font-mono shadow-sm text-xs md:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Tree View Panel */}
                      <div className="flex-1 min-w-0 flex flex-col space-y-1.5 h-full">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {treeInputCollapsed && (
                              <button
                                onClick={() => setTreeInputCollapsed(false)}
                                title="Show input panel"
                                className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 transition-colors cursor-pointer"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                                Input
                              </button>
                            )}
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Interactive Tree View</label>
                          </div>
                          {jsonInput && (
                            <button
                              onClick={() => copyToClipboard(jsonInput, "JSON copied!")}
                              title="Copy full JSON"
                              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 transition-colors cursor-pointer font-medium"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                              Copy JSON
                            </button>
                          )}
                        </div>
                        <div className="flex-1 p-3 md:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm overflow-auto transition-colors duration-200">
                          {jsonInput ? (
                            <JSONTreeViewer json={jsonInput} />
                          ) : (
                            <div className="text-gray-600 dark:text-gray-400 text-center mt-20">
                              <div className="text-6xl mb-4">🌳</div>
                              <p>Enter JSON to explore its tree structure</p>
                              <p className="text-sm mt-2 opacity-70">Click nodes to expand/collapse · Hover to copy values or paths</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Type Distribution Chart */}
                  {treeStats.nodes > 0 && (() => {
                    const { types } = treeStats;
                    const typeEntries: { label: string; count: number; color: string; bg: string }[] = [
                      { label: "Objects", count: types.objects, color: "bg-indigo-500", bg: "bg-indigo-100 dark:bg-indigo-900/40" },
                      { label: "Arrays", count: types.arrays, color: "bg-purple-500", bg: "bg-purple-100 dark:bg-purple-900/40" },
                      { label: "Strings", count: types.strings, color: "bg-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/40" },
                      { label: "Numbers", count: types.numbers, color: "bg-violet-500", bg: "bg-violet-100 dark:bg-violet-900/40" },
                      { label: "Booleans", count: types.booleans, color: "bg-orange-500", bg: "bg-orange-100 dark:bg-orange-900/40" },
                      { label: "Nulls", count: types.nulls, color: "bg-gray-400", bg: "bg-gray-100 dark:bg-gray-700/60" },
                    ].filter(e => e.count > 0);
                    const total = typeEntries.reduce((s, e) => s + e.count, 0);
                    return (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Value Type Distribution</h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{total} values total</span>
                        </div>
                        {/* Stacked bar */}
                        <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-4">
                          {typeEntries.map(e => (
                            <div
                              key={e.label}
                              className={`${e.color} transition-all duration-500`}
                              style={{ width: `${(e.count / total) * 100}%` }}
                              title={`${e.label}: ${e.count}`}
                            />
                          ))}
                        </div>
                        {/* Legend + bars */}
                        <div className="space-y-2">
                          {typeEntries.map(e => (
                            <div key={e.label} className="flex items-center gap-3">
                              <span className={`text-xs font-medium w-16 shrink-0 text-right px-1.5 py-0.5 rounded ${e.bg} text-gray-700 dark:text-gray-300`}>{e.label}</span>
                              <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                <motion.div
                                  className={`${e.color} h-full rounded-full`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(e.count / total) * 100}%` }}
                                  transition={{ duration: 0.6, ease: "easeOut" }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right shrink-0">
                                {e.count} <span className="opacity-60">({((e.count / total) * 100).toFixed(0)}%)</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              );

            case "formatter":
              return (
                <motion.div
                  key="formatter"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="space-y-6"
                >
                  {/* View Mode Buttons at Top */}
                  {formattedJson && (
                    <div className="flex justify-center space-x-2 mb-4">
                      <button
                        onClick={() => setViewMode("text")}
                        className={`px-4 py-2 rounded-xl text-sm transition-all duration-200 border cursor-pointer ${viewMode === "text"
                          ? "bg-blue-600/50 text-gray-900 border-indigo-300"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600"
                          }`}
                      >
                        📝 Text View
                      </button>
                      <button
                        onClick={() => setViewMode("tree")}
                        className={`px-4 py-2 rounded-xl text-sm transition-all duration-200 border cursor-pointer ${viewMode === "tree"
                          ? "bg-blue-600/50 text-gray-900 border-indigo-300"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600"
                          }`}
                      >
                        🌳 Tree View
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Indent Size:</label>
                      <select
                        value={indentSize}
                        onChange={(e) => setIndentSize(Number(e.target.value))}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                      >
                        <option value={2}>2 spaces</option>
                        <option value={4}>4 spaces</option>
                        <option value={8}>8 spaces</option>
                      </select>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="sortKeys"
                          checked={sortKeys}
                          onChange={(e) => setSortKeys(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-indigo-500 bg-gray-100"
                        />
                        <label htmlFor="sortKeys" className="text-sm text-gray-700">Sort Keys</label>
                      </div>
                      <span className="text-sm text-gray-600">
                        {jsonInput.length} characters
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => loadSampleJson()}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-xl text-sm transition-all duration-200 border border-gray-200 dark:border-gray-600 cursor-pointer font-medium"
                      >
                        Load Sample
                      </button>
                      <button
                        onClick={formatJson}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm transition-all duration-200 border border-indigo-300 cursor-pointer"
                      >
                        Format JSON
                      </button>
                      <button
                        onClick={clearAll}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm transition-all duration-200 border border-red-300 cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Input JSON</label>
                      <textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        onPaste={(e) => {
                          const pasted = e.clipboardData.getData("text");
                          try {
                            const parsed = JSON.parse(pasted);
                            e.preventDefault();
                            setJsonInput(JSON.stringify(parsed, null, indentSize));
                          } catch { /* fall through to default paste */ }
                        }}
                        placeholder="Paste your JSON here — auto-formats on paste..."
                        className="w-full h-[300px] md:h-[500px] lg:h-[600px] p-3 md:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 font-mono shadow-sm text-xs md:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 backdrop-blur-sm transition-colors duration-200"
                        spellCheck={false}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Formatted Output</label>
                        <div className="flex items-center space-x-2">
                          {formattedJson && (
                            <>
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {formattedJson.split("\n").length} lines
                              </span>
                              <button
                                onClick={() => {
                                  const blob = new Blob([formattedJson], { type: "application/json" });
                                  const a = document.createElement("a");
                                  a.href = URL.createObjectURL(blob);
                                  a.download = "formatted.json";
                                  a.click();
                                  URL.revokeObjectURL(a.href);
                                }}
                                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-xs transition-all duration-200 border border-gray-200 dark:border-gray-600 cursor-pointer"
                              >
                                Download
                              </button>
                              <button
                                onClick={() => copyToClipboard(formattedJson, "Formatted JSON copied!")}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs transition-all duration-200 border border-emerald-300 cursor-pointer"
                              >
                                Copy
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="w-full h-[300px] md:h-[500px] lg:h-[600px] p-3 md:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm overflow-auto backdrop-blur-sm transition-colors duration-200">
                        {formattedJson ? (
                          viewMode === "text" ? (
                            <JSONHighlighter
                              json={formattedJson}
                              className="text-gray-900 dark:text-gray-100 font-mono text-sm whitespace-pre-wrap"
                            />
                          ) : (
                            <JSONTreeViewer
                              json={formattedJson}
                              className="text-gray-900 dark:text-gray-100"
                            />
                          )
                        ) : (
                          <pre className="text-gray-600 dark:text-gray-400 font-mono text-sm">
                            Formatted JSON will appear here...
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );

            case "validator":
              return (
                <motion.div
                  key="validator"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">
                        {jsonInput.length} characters
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => loadSampleJson()}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-xl text-sm transition-all duration-200 border border-gray-200 dark:border-gray-600 cursor-pointer font-medium"
                      >
                        Load Sample
                      </button>
                      <button
                        onClick={validateJson}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm transition-all duration-200 border border-emerald-300 cursor-pointer"
                      >
                        Validate JSON
                      </button>
                      <button
                        onClick={clearAll}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm transition-all duration-200 border border-red-300 cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Input JSON</label>
                      <div className="w-full h-[300px] md:h-[500px] lg:h-[600px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm backdrop-blur-sm overflow-hidden transition-colors duration-200">
                        <TextareaWithLineNumbers
                          value={jsonInput}
                          onChange={setJsonInput}
                          placeholder="Paste your JSON here..."
                          errorLine={errorPosition?.line}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Validation Result & Suggestions</label>
                        {isValid && (
                          <button
                            onClick={() => copyToClipboard("✅ Valid JSON", "Validation result copied!")}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs transition-all duration-200 border border-emerald-300 cursor-pointer"
                          >
                            Copy Result
                          </button>
                        )}
                      </div>
                      <div className="w-full h-[300px] md:h-[500px] lg:h-[600px] p-3 md:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm overflow-auto backdrop-blur-sm transition-colors duration-200">
                        <div className={`text-center text-lg mb-6 ${isValid === true ? 'text-emerald-600' : isValid === false ? 'text-red-600' : 'text-gray-600'}`}>
                          {formattedJson || "Validation result will appear here..."}
                        </div>

                        {validationSuggestions.length > 0 && (
                          <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-2">
                              {isValid ? "💡 Optimization Suggestions" : "🔧 Fix Suggestions"}
                            </h3>
                            {validationSuggestions.map((suggestion, index) => (
                              <div key={index} className="bg-gray-100/80 dark:bg-gray-800/80 p-3 rounded-xl border border-gray-200 dark:border-gray-600/50">
                                <p className="text-sm text-gray-700 dark:text-gray-300">{suggestion}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {errorPosition && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-sm text-red-700">
                              <strong>Error Location:</strong> Line {errorPosition.line}, Column {errorPosition.column}
                            </p>
                          </div>
                        )}

                        {!jsonInput && (
                          <div className="text-gray-600 dark:text-gray-400 text-center mt-20">
                            <div className="text-6xl mb-4">✅</div>
                            <p>Enter JSON to validate and get intelligent suggestions</p>
                            <p className="text-sm mt-2">Get fix recommendations • Performance tips • Best practices</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );

            case "compressor":
              return (
                <motion.div
                  key="compressor"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">
                        {jsonInput.length} characters
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => loadSampleJson()}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-xl text-sm transition-all duration-200 border border-gray-200 dark:border-gray-600 cursor-pointer font-medium"
                      >
                        Load Sample
                      </button>
                      <button
                        onClick={compressJson}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm transition-all duration-200 border border-purple-300 cursor-pointer"
                      >
                        Compress JSON
                      </button>
                      <button
                        onClick={clearAll}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm transition-all duration-200 border border-red-300 cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Input JSON</label>
                      <textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder="Paste your JSON here..."
                        className="w-full h-[300px] md:h-[500px] lg:h-[600px] p-3 md:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 font-mono shadow-sm text-xs md:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 backdrop-blur-sm transition-colors duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Compressed Output</label>
                          <div className="flex items-center gap-2">
                            {formattedJson && (
                              <>
                                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{formattedJson.length} chars</span>
                                <button
                                  onClick={() => {
                                    const blob = new Blob([formattedJson], { type: "application/json" });
                                    const a = document.createElement("a");
                                    a.href = URL.createObjectURL(blob);
                                    a.download = "compressed.json";
                                    a.click();
                                    URL.revokeObjectURL(a.href);
                                  }}
                                  className="px-2 py-0.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 cursor-pointer transition-colors"
                                >
                                  Download
                                </button>
                                <button
                                  onClick={() => copyToClipboard(formattedJson, "Compressed JSON copied!")}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs transition-all duration-200 border border-emerald-300 cursor-pointer"
                                >
                                  Copy
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {compressionRatio > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                                style={{ width: `${Math.min(compressionRatio, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 w-16 shrink-0">
                              {compressionRatio.toFixed(1)}% saved
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="w-full h-[300px] md:h-[500px] lg:h-[600px] p-3 md:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm overflow-auto backdrop-blur-sm transition-colors duration-200">
                        {formattedJson ? (
                          <JSONHighlighter
                            json={formattedJson}
                            className="text-gray-900 dark:text-gray-100 font-mono text-sm whitespace-pre-wrap"
                          />
                        ) : (
                          <pre className="text-gray-600 dark:text-gray-400 font-mono text-sm">
                            Compressed JSON will appear here...
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );

            case "comparer":
              return (
                <motion.div
                  key="comparer"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="space-y-4"
                >
                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={loadSampleComparison}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-xl text-sm transition-all duration-200 border border-gray-200 dark:border-gray-600 cursor-pointer font-medium"
                      >
                        Load Sample
                      </button>
                      {/* Swap JSON 1 ⇄ JSON 2 */}
                      {(json1 || json2) && (
                        <button
                          onClick={() => { const tmp = json1; setJson1(json2); setJson2(tmp); }}
                          title="Swap JSON 1 and JSON 2"
                          className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm transition-all duration-200 border border-gray-200 dark:border-gray-600 cursor-pointer font-medium"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" /></svg>
                          Swap
                        </button>
                      )}
                    </div>
                    <button
                      onClick={clearComparison}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm transition-all duration-200 border border-red-300 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Input panels */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">JSON 1</label>
                          {json1 && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                              {json1.split("\n").length} lines · {(json1.length / 1024).toFixed(1)}KB
                            </span>
                          )}
                        </div>
                        {json1 && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => { try { setJson1(JSON.stringify(JSON.parse(json1), null, 2)); } catch { showToast("Invalid JSON", "error"); } }}
                              className="px-2 py-0.5 text-xs rounded-lg bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 cursor-pointer transition-colors"
                            >
                              Format
                            </button>
                            <button
                              onClick={() => copyToClipboard(json1, "JSON 1 copied!")}
                              className="px-2 py-0.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 cursor-pointer transition-colors"
                            >
                              Copy
                            </button>
                          </div>
                        )}
                      </div>
                      <textarea
                        value={json1}
                        onChange={(e) => setJson1(e.target.value)}
                        onPaste={(e) => {
                          const pasted = e.clipboardData.getData("text");
                          try {
                            const formatted = JSON.stringify(JSON.parse(pasted), null, 2);
                            e.preventDefault();
                            setJson1(formatted);
                          } catch { /* let default paste happen */ }
                        }}
                        placeholder="Paste first JSON here — auto-formats on paste..."
                        className="w-full h-[220px] md:h-[300px] lg:h-[380px] p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 font-mono shadow-sm text-xs resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors duration-200"
                        spellCheck={false}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">JSON 2</label>
                          {json2 && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                              {json2.split("\n").length} lines · {(json2.length / 1024).toFixed(1)}KB
                            </span>
                          )}
                        </div>
                        {json2 && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => { try { setJson2(JSON.stringify(JSON.parse(json2), null, 2)); } catch { showToast("Invalid JSON", "error"); } }}
                              className="px-2 py-0.5 text-xs rounded-lg bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 cursor-pointer transition-colors"
                            >
                              Format
                            </button>
                            <button
                              onClick={() => copyToClipboard(json2, "JSON 2 copied!")}
                              className="px-2 py-0.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 cursor-pointer transition-colors"
                            >
                              Copy
                            </button>
                          </div>
                        )}
                      </div>
                      <textarea
                        value={json2}
                        onChange={(e) => setJson2(e.target.value)}
                        onPaste={(e) => {
                          const pasted = e.clipboardData.getData("text");
                          try {
                            const formatted = JSON.stringify(JSON.parse(pasted), null, 2);
                            e.preventDefault();
                            setJson2(formatted);
                          } catch { /* let default paste happen */ }
                        }}
                        placeholder="Paste second JSON here — auto-formats on paste..."
                        className="w-full h-[220px] md:h-[300px] lg:h-[380px] p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 font-mono shadow-sm text-xs resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors duration-200"
                        spellCheck={false}
                      />
                    </div>
                  </div>

                  {/* Comparison Result — JSONComparer handles its own height/scroll */}
                  <JSONComparer
                    json1={json1}
                    json2={json2}
                    className="text-gray-900 dark:text-gray-100"
                  />
                </motion.div>
              );

            case "jsonpath":
              return (
                <motion.div
                  key="jsonpath"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="space-y-4"
                >
                  {/* Query bar */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={jsonPathQuery}
                      onChange={(e) => setJsonPathQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") evaluateJsonPath(); }}
                      placeholder="Enter JSONPath query (e.g., $.store.book[*].author)"
                      className="flex-grow p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={evaluateJsonPath}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm transition-all duration-200 border border-indigo-300 cursor-pointer font-medium shrink-0"
                    >
                      Evaluate
                    </button>
                  </div>
                  {/* Quick reference */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "All values", expr: "$..*" },
                      { label: "Root keys", expr: "$.*" },
                      { label: "Array items", expr: "$[*]" },
                      { label: "First item", expr: "$[0]" },
                    ].map(({ label, expr }) => (
                      <button
                        key={expr}
                        onClick={() => setJsonPathQuery(expr)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-gray-600 dark:text-gray-400 hover:text-indigo-700 dark:hover:text-indigo-300 border border-gray-200 dark:border-gray-600 cursor-pointer transition-colors font-mono"
                      >
                        {expr} <span className="opacity-60 font-sans">({label})</span>
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Input JSON</label>
                      <textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder="Paste your JSON here..."
                        className="w-full h-[300px] md:h-[500px] lg:h-[600px] p-3 md:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 font-mono shadow-sm text-xs md:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 backdrop-blur-sm transition-colors duration-200"
                        spellCheck={false}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Result</label>
                          {jsonPathResult && (() => {
                            try {
                              const count = JSON.parse(jsonPathResult)?.length;
                              return typeof count === "number"
                                ? <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">{count} match{count !== 1 ? "es" : ""}</span>
                                : null;
                            } catch { return null; }
                          })()}
                        </div>
                        {jsonPathResult && (
                          <button
                            onClick={() => copyToClipboard(jsonPathResult, "JSONPath result copied!")}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs transition-all duration-200 border border-emerald-300 cursor-pointer"
                          >
                            Copy Result
                          </button>
                        )}
                      </div>
                      <div className="w-full h-[300px] md:h-[500px] lg:h-[600px] p-3 md:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm overflow-auto backdrop-blur-sm transition-colors duration-200">
                        {jsonPathResult ? (
                          <pre className="text-gray-900 dark:text-gray-100 font-mono text-sm whitespace-pre-wrap">
                            {jsonPathResult}
                          </pre>
                        ) : (
                          <div className="text-gray-500 dark:text-gray-400 text-center mt-20">
                            <div className="text-5xl mb-3">🔎</div>
                            <p className="text-sm font-medium">Enter a JSONPath expression and hit Evaluate</p>
                            <p className="text-xs mt-1 opacity-70">Press Enter in the query box to evaluate quickly</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );

            case "types":
              return (
                <motion.div
                  key="types"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Language:</span>
                      <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-600">
                        <button
                          onClick={() => setTypeLanguage("go")}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${typeLanguage === "go"
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                            }`}
                        >
                          Go
                        </button>
                        <button
                          onClick={() => setTypeLanguage("typescript")}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${typeLanguage === "typescript"
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                            }`}
                        >
                          TypeScript
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={convertToTypes}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm transition-all duration-200 border border-indigo-300 font-medium shadow-sm"
                      >
                        Regenerate
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Input JSON</label>
                        {jsonInput && (
                          <button
                            onClick={() => {
                              setJsonInput("");
                              setTypesResult("");
                            }}
                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder="Paste your JSON here... Types will be generated automatically"
                        className="w-full h-[300px] md:h-[500px] lg:h-[600px] p-3 md:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 font-mono shadow-sm text-xs md:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {typeLanguage === "go" ? "Go Structs" : "TypeScript Interfaces"}
                          </label>
                          {typesResult && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              ({typesResult.split('\n').length} lines)
                            </span>
                          )}
                        </div>
                        {typesResult && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                const ext = typeLanguage === "go" ? "go" : "ts";
                                const blob = new Blob([typesResult], { type: "text/plain" });
                                const a = document.createElement("a");
                                a.href = URL.createObjectURL(blob);
                                a.download = `types.${ext}`;
                                a.click();
                                URL.revokeObjectURL(a.href);
                              }}
                              className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 rounded-xl text-xs transition-all duration-200 border border-gray-200 dark:border-gray-600 cursor-pointer"
                            >
                              Download
                            </button>
                            <button
                              onClick={() => copyToClipboard(typesResult, `${typeLanguage === "go" ? "Go" : "TypeScript"} types copied!`)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs transition-all duration-200 border border-emerald-300 cursor-pointer font-medium shadow-sm"
                            >
                              Copy
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="w-full h-[300px] md:h-[500px] lg:h-[600px] p-3 md:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm overflow-auto transition-colors duration-200">
                        {typesResult ? (
                          <pre className="text-gray-900 dark:text-gray-100 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                            <code className={typeLanguage === "go" ? "language-go" : "language-typescript"}>
                              {typesResult}
                            </code>
                          </pre>
                        ) : (
                          <div className="text-gray-400 dark:text-gray-500 text-center mt-20">
                            <div className="text-4xl mb-3">{typeLanguage === "go" ? "🦫" : "📜"}</div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Enter JSON to generate {typeLanguage === "go" ? "Go" : "TypeScript"} types</p>
                            <p className="text-xs mt-2 text-gray-500 dark:text-gray-500">Types are generated automatically as you type</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );

            default:
              return null;
          }
        })()}
        </AnimatePresence>
      </>
    );
  };

  return (
    <>
      <StructuredData />
      <div className="min-h-screen relative">
        <BackgroundBeamsWithCollision className="absolute inset-0">
          <div></div>
        </BackgroundBeamsWithCollision>
        <div className="relative z-10 min-h-screen flex flex-col w-full">
          {/* Header */}
          <header className="py-4 md:py-6 px-4 relative safe-area-inset-top">
            {/* Theme Toggle & GitHub - Top Right */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2 min-h-[44px]">
              <ThemeToggle />
              <a
                href="https://github.com/ratnesh-maurya/JSONic"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] bg-gray-200/80 hover:bg-gray-300/80 dark:bg-gray-700/80 dark:hover:bg-gray-600/80 border border-gray-200 dark:border-gray-600 rounded-full transition-all duration-200 backdrop-blur-sm group cursor-pointer"
                title="View on GitHub"
              >
                <svg
                  className="w-5 h-5 text-gray-700 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-gray-100 transition-colors duration-200"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.300 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>

            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col items-center justify-center mb-4">
                <div className="flex items-center space-x-3 mb-4 cursor-pointer">
                  <span className="text-2xl md:text-3xl">🔮</span>
                  <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600">
                    JSONic
                  </h1>
                </div>
                <nav className="hidden md:flex items-center space-x-2 bg-white dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700/60 p-2 rounded-full shadow-sm shadow-gray-200/60 dark:shadow-none">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        trackToolSwitch(activeTab, tab.id);
                        setActiveTab(tab.id);
                      }}
                        className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${activeTab === tab.id
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                      {activeTab === tab.id && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                          layoutId="activeTab"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center space-x-2">
                        <span>{tab.icon}</span>
                        <span>{tab.name}</span>
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
              <div className="text-center">
                <motion.p
                  className="text-gray-600 dark:text-gray-400 text-sm md:text-base font-medium max-w-3xl mx-auto px-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  A lightweight and powerful utility designed to simplify working with JSON data.
                  <span className="hidden md:inline"> Format, validate, compare, and transform JSON with ease.</span>
                </motion.p>
              </div>
            </div>
          </header>

          {/* Mobile Navigation */}
          <div className="md:hidden px-4 pb-4">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700/60 rounded-xl p-2 shadow-sm shadow-gray-200/50 dark:shadow-none">
                <div className="grid grid-cols-2 gap-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        trackToolSwitch(activeTab, tab.id);
                        setActiveTab(tab.id);
                      }}
                        className={`relative px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${activeTab === tab.id
                        ? 'text-white bg-gradient-to-r from-indigo-600 to-purple-600'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 bg-white/50 dark:bg-gray-800/50'
                        }`}
                    >
                      <span className="flex items-center justify-center space-x-1">
                        <span className="text-sm">{tab.icon}</span>
                        <span className="truncate">{tab.name}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-grow py-4 md:py-8 px-4">
            <div className="max-w-7xl mx-auto">
              <div
                ref={toolInputRef}
                className="bg-white dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700/60 rounded-xl md:rounded-3xl p-4 md:p-8 shadow-xl transition-colors duration-300 shadow-gray-200/50 dark:shadow-none scroll-mt-4"
              >
                {/* Tool Content */}
                {renderToolContent()}
              </div>
            </div>
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </>

  );
}
