"use client";

import { useState, useEffect } from "react";

import { BackgroundBeamsWithCollision } from "./components/ui/aurora-background";
import { JSONHighlighter } from "./components/ui/json-highlighter";
import { JSONTreeViewer } from "./components/ui/json-tree-viewer";
import { JSONComparer } from "./components/ui/json-comparer";
import { TextareaWithLineNumbers } from "./components/ui/textarea-with-line-numbers";
import { Footer } from "./components/footer";
import { StructuredData } from "./components/structured-data";
import { motion } from "framer-motion";
import { useToast } from "./components/ui/toast-provider";
import { ResizableContainer } from "./components/ui/resizable-panel";
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
  const [compressionRatio, setCompressionRatio] = useState(0);
  const [treeStats, setTreeStats] = useState({ nodes: 0, depth: 0, size: 0 });
  const [validationSuggestions, setValidationSuggestions] = useState<string[]>([]);

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

  const analyzeJsonTree = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      const stats = calculateTreeStats(parsed);
      setTreeStats(stats);

      // Track tree analysis
      trackTreeAnalysis(stats.nodes, stats.depth, stats.size);
    } catch (error) {
      setTreeStats({ nodes: 0, depth: 0, size: 0 });
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
      const type = jsonToTypes(parsed, "Root");
      setTypesResult(type);
    } catch (error) {
      setTypesResult(error instanceof Error ? error.message : "Error generating types.");
    }
  };

  const jsonToTypes = (obj: unknown, name: string): string => {
    if (typeof obj !== 'object' || obj === null) {
      return `type ${name} = ${typeof obj};`;
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return `type ${name} = any[];`;
      }
      return `type ${name} = ${jsonToTypes(obj[0], name + "Item")}[];`;
    }

    const keys = Object.keys(obj as Record<string, unknown>);

    return `interface ${name} {\n${keys.map(key => `  ${key}: ${capitalize(key)};`).join('\n')}\n}\n\n${keys.map(key => jsonToTypes((obj as Record<string, unknown>)[key], capitalize(key))).join('\n')}`;
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
  };

  const clearComparison = () => {
    setJson1("");
    setJson2("");
  };

  const loadSampleJson = () => {
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
    setJsonInput(JSON.stringify(sample, null, 2));
    setErrorMessage("");
    setErrorPosition(null);
    setIsErrorVisible(false);

    // Track sample loaded
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

    // Track sample loaded
    trackSampleLoaded("comparison");
  };

  const tabs = [
    { id: "treeview", name: "Tree View", icon: "🌳", description: "Interactive JSON tree explorer" },
    { id: "comparer", name: "Comparer", icon: "🔍", description: "Compare JSON differences" },
    { id: "validator", name: "Validator", icon: "✅", description: "Validate JSON syntax" },
    { id: "formatter", name: "Formatter", icon: "✨", description: "Format and beautify JSON" },
    { id: "compressor", name: "Compressor", icon: "🗜️", description: "Compress JSON size" },
    { id: "jsonpath", name: "JSONPath", icon: "🔎", description: "Query JSON with JSONPath" },
    { id: "types", name: "To Types", icon: "📜", description: "JSON to TypeScript" },
  ];

  const renderToolContent = () => {
    return (
      <>
        {isErrorVisible && (
          <div className="relative flex items-center justify-between p-4 mb-6 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 shadow-lg shadow-red-500/10">
            <div>
              <p className="font-semibold">❌ Invalid JSON</p>
              <p className="text-sm mt-1">{errorMessage}</p>
              {errorPosition && (
                <div className="mt-1 text-xs">
                  Error near line {errorPosition.line}, column {errorPosition.column}
                </div>
              )}
            </div>
            <button
              onClick={() => setIsErrorVisible(false)}
              className="absolute top-2 right-2 text-red-300 hover:text-white transition-colors cursor-pointer"
            >
              &#x2715;
            </button>
          </div>
        )}

        {(() => {
          switch (activeTab) {
            case "treeview":
              return (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setJsonInput('{"user":{"name":"John Doe","age":30,"address":{"street":"123 Main St","city":"New York"},"hobbies":["reading","swimming","coding"],"active":true}}');
                          analyzeJsonTree('{"user":{"name":"John Doe","age":30,"address":{"street":"123 Main St","city":"New York"},"hobbies":["reading","swimming","coding"],"active":true}}');
                        }}
                        className="px-4 py-2 bg-gray-600/50 hover:bg-gray-700/50 text-white rounded-lg text-sm transition-all duration-200 backdrop-blur-sm border border-gray-700/50 cursor-pointer"
                      >
                        Load Sample
                      </button>
                      <button
                        onClick={() => analyzeJsonTree(jsonInput)}
                        className="px-4 py-2 bg-green-600/50 hover:bg-green-700/50 text-white rounded-lg text-sm transition-all duration-200 backdrop-blur-sm border border-green-700/50 cursor-pointer"
                      >
                        Analyze Tree
                      </button>
                    </div>
                    {treeStats.nodes > 0 && (
                      <div className="flex items-center space-x-4 text-sm text-gray-300">
                        <span className="bg-blue-600/20 px-2 py-1 rounded">
                          📊 {treeStats.nodes} nodes
                        </span>
                        <span className="bg-purple-600/20 px-2 py-1 rounded">
                          📏 {treeStats.depth} levels deep
                        </span>
                        <span className="bg-green-600/20 px-2 py-1 rounded">
                          💾 {(treeStats.size / 1024).toFixed(1)}KB
                        </span>
                        <button
                          onClick={() => copyToClipboard(`Tree Analysis: ${treeStats.nodes} nodes, ${treeStats.depth} levels deep, ${(treeStats.size / 1024).toFixed(1)}KB`, "Tree stats copied!")}
                          className="px-3 py-1 bg-green-600/50 hover:bg-green-700/50 text-white rounded-lg text-xs transition-all duration-200 backdrop-blur-sm border border-green-700/50 cursor-pointer"
                        >
                          Copy Stats
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="h-[600px] md:h-[700px] lg:h-[800px] w-full">
                    <ResizableContainer
                      initialLeftWidth={50}
                      minWidth={25}
                      maxWidth={75}
                      leftChild={
                        <div className="space-y-2 h-full flex flex-col p-4">
                          <label className="text-sm font-medium text-gray-300">Input JSON</label>
                          <textarea
                            value={jsonInput}
                            onChange={(e) => {
                              setJsonInput(e.target.value);
                              if (e.target.value) {
                                analyzeJsonTree(e.target.value);
                              }
                            }}
                            placeholder="Paste your JSON here to explore its structure..."
                            className="flex-1 p-3 md:p-4 bg-gray-800/40 border border-gray-700/30 rounded-xl text-white font-mono text-xs md:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
                          />
                        </div>
                      }
                      rightChild={
                        <div className="space-y-2 h-full flex flex-col p-4">
                          <label className="text-sm font-medium text-gray-300">Interactive Tree View</label>
                          <div className="flex-1 p-3 md:p-4 bg-gray-800/40 border border-gray-700/30 rounded-xl overflow-auto backdrop-blur-sm">
                            {jsonInput ? (
                              <JSONTreeViewer json={jsonInput} />
                            ) : (
                              <div className="text-gray-400 text-center mt-20">
                                <div className="text-6xl mb-4">🌳</div>
                                <p>Enter JSON to explore its tree structure</p>
                                <p className="text-sm mt-2">Click nodes to expand/collapse • Hover to copy paths/values</p>
                              </div>
                            )}
                          </div>
                        </div>
                      }
                    />
                  </div>
                </div>
              );

            case "formatter":
              return (
                <div className="space-y-6">
                  {/* View Mode Buttons at Top */}
                  {formattedJson && (
                    <div className="flex justify-center space-x-2 mb-4">
                      <button
                        onClick={() => setViewMode("text")}
                        className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 backdrop-blur-sm border cursor-pointer ${viewMode === "text"
                          ? "bg-blue-600/50 text-white border-blue-700/50"
                          : "bg-gray-600/50 text-gray-300 border-gray-700/50"
                          }`}
                      >
                        📝 Text View
                      </button>
                      <button
                        onClick={() => setViewMode("tree")}
                        className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 backdrop-blur-sm border cursor-pointer ${viewMode === "tree"
                          ? "bg-blue-600/50 text-white border-blue-700/50"
                          : "bg-gray-600/50 text-gray-300 border-gray-700/50"
                          }`}
                      >
                        🌳 Tree View
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <label className="text-sm font-medium text-gray-300">Indent Size:</label>
                      <select
                        value={indentSize}
                        onChange={(e) => setIndentSize(Number(e.target.value))}
                        className="bg-gray-800/20 border border-gray-700/30 rounded-lg px-3 py-2 text-white text-sm backdrop-blur-none focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-700"
                        />
                        <label htmlFor="sortKeys" className="text-sm text-gray-300">Sort Keys</label>
                      </div>
                      <span className="text-sm text-gray-400">
                        {jsonInput.length} characters
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={loadSampleJson}
                        className="px-4 py-2 bg-gray-600/50 hover:bg-gray-700/50 text-white rounded-lg text-sm transition-all duration-200 backdrop-blur-sm border border-gray-700/50 cursor-pointer"
                      >
                        Load Sample
                      </button>
                      <button
                        onClick={formatJson}
                        className="px-4 py-2 bg-blue-600/50 hover:bg-blue-700/50 text-white rounded-lg text-sm transition-all duration-200 backdrop-blur-sm border border-blue-700/50 cursor-pointer"
                      >
                        Format JSON
                      </button>
                      <button
                        onClick={clearAll}
                        className="px-4 py-2 bg-red-600/50 hover:bg-red-700/50 text-white rounded-lg text-sm transition-all duration-200 backdrop-blur-sm border border-red-700/50 cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Input JSON</label>
                      <textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder="Paste your JSON here..."
                        className="w-full h-[300px] md:h-[500px] lg:h-[600px] p-3 md:p-4 bg-gray-800/40 border border-gray-700/30 rounded-xl text-white font-mono text-xs md:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-300">Formatted Output</label>
                        <div className="flex items-center space-x-2">
                          {formattedJson && (
                            <>
                              <span className="text-xs text-gray-400">
                                {formattedJson.length} characters
                              </span>
                              <button
                                onClick={() => copyToClipboard(formattedJson, "Formatted JSON copied!")}
                                className="px-3 py-1 bg-green-600/50 hover:bg-green-700/50 text-white rounded-lg text-xs transition-all duration-200 backdrop-blur-sm border border-green-700/50 cursor-pointer"
                              >
                                Copy
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="w-full h-[300px] md:h-[500px] lg:h-[600px] p-3 md:p-4 bg-gray-800/40 border border-gray-700/30 rounded-xl overflow-auto backdrop-blur-sm">
                        {formattedJson ? (
                          viewMode === "text" ? (
                            <JSONHighlighter
                              json={formattedJson}
                              className="text-white font-mono text-sm whitespace-pre-wrap"
                            />
                          ) : (
                            <JSONTreeViewer
                              json={formattedJson}
                              className="text-white"
                            />
                          )
                        ) : (
                          <pre className="text-gray-400 font-mono text-sm">
                            Formatted JSON will appear here...
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );

            case "validator":
              return (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-400">
                        {jsonInput.length} characters
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={loadSampleJson}
                        className="px-4 py-2 bg-gray-600/50 hover:bg-gray-700/50 text-white rounded-lg text-sm transition-all duration-200 backdrop-blur-sm border border-gray-700/50 cursor-pointer"
                      >
                        Load Sample
                      </button>
                      <button
                        onClick={validateJson}
                        className="px-4 py-2 bg-green-600/50 hover:bg-green-700/50 text-white rounded-lg text-sm transition-all duration-200 backdrop-blur-sm border border-green-700/50 cursor-pointer"
                      >
                        Validate JSON
                      </button>
                      <button
                        onClick={clearAll}
                        className="px-4 py-2 bg-red-600/50 hover:bg-red-700/50 text-white rounded-lg text-sm transition-all duration-200 backdrop-blur-sm border border-red-700/50 cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Input JSON</label>
                      <div className="w-full h-[300px] md:h-[500px] lg:h-[600px] bg-gray-800/40 border border-gray-700/30 rounded-xl backdrop-blur-sm overflow-hidden">
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
                        <label className="text-sm font-medium text-gray-300">Validation Result & Suggestions</label>
                        {isValid && (
                          <button
                            onClick={() => copyToClipboard("✅ Valid JSON", "Validation result copied!")}
                            className="px-3 py-1 bg-green-600/50 hover:bg-green-700/50 text-white rounded-lg text-xs transition-all duration-200 backdrop-blur-sm border border-green-700/50 cursor-pointer"
                          >
                            Copy Result
                          </button>
                        )}
                      </div>
                      <div className="w-full h-[300px] md:h-[500px] lg:h-[600px] p-3 md:p-4 bg-gray-800/40 border border-gray-700/30 rounded-xl overflow-auto backdrop-blur-sm">
                        <div className={`text-center text-lg mb-6 ${isValid === true ? 'text-green-400' : isValid === false ? 'text-red-400' : 'text-gray-400'}`}>
                          {formattedJson || "Validation result will appear here..."}
                        </div>

                        {validationSuggestions.length > 0 && (
                          <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-2">
                              {isValid ? "💡 Optimization Suggestions" : "🔧 Fix Suggestions"}
                            </h3>
                            {validationSuggestions.map((suggestion, index) => (
                              <div key={index} className="bg-gray-700/30 p-3 rounded-lg border border-gray-600/30">
                                <p className="text-sm text-gray-200">{suggestion}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {errorPosition && (
                          <div className="mt-4 p-3 bg-red-900/20 border border-red-700/30 rounded-lg">
                            <p className="text-sm text-red-300">
                              <strong>Error Location:</strong> Line {errorPosition.line}, Column {errorPosition.column}
                            </p>
                          </div>
                        )}

                        {!jsonInput && (
                          <div className="text-gray-400 text-center mt-20">
                            <div className="text-6xl mb-4">✅</div>
                            <p>Enter JSON to validate and get intelligent suggestions</p>
                            <p className="text-sm mt-2">Get fix recommendations • Performance tips • Best practices</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );

            case "compressor":
              return (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-400">
                        {jsonInput.length} characters
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={loadSampleJson}
                        className="px-4 py-2 bg-gray-600/50 hover:bg-gray-700/50 text-white rounded-lg text-sm transition-all duration-200 backdrop-blur-sm border border-gray-700/50 cursor-pointer"
                      >
                        Load Sample
                      </button>
                      <button
                        onClick={compressJson}
                        className="px-4 py-2 bg-purple-600/50 hover:bg-purple-700/50 text-white rounded-lg text-sm transition-all duration-200 backdrop-blur-sm border border-purple-700/50 cursor-pointer"
                      >
                        Compress JSON
                      </button>
                      <button
                        onClick={clearAll}
                        className="px-4 py-2 bg-red-600/50 hover:bg-red-700/50 text-white rounded-lg text-sm transition-all duration-200 backdrop-blur-sm border border-red-700/50 cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Input JSON</label>
                      <textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder="Paste your JSON here..."
                        className="w-full h-[300px] md:h-[500px] lg:h-[600px] p-3 md:p-4 bg-gray-800/40 border border-gray-700/30 rounded-xl text-white font-mono text-xs md:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-300">Compressed Output</label>
                        <div className="flex items-center space-x-2">
                          {formattedJson && (
                            <>
                              <span className="text-xs text-green-400 font-semibold">
                                {compressionRatio.toFixed(2)}% smaller
                              </span>
                              <span className="text-xs text-gray-400">
                                {formattedJson.length} characters
                              </span>
                              <button
                                onClick={() => copyToClipboard(formattedJson, "Compressed JSON copied!")}
                                className="px-3 py-1 bg-green-600/50 hover:bg-green-700/50 text-white rounded-lg text-xs transition-all duration-200 backdrop-blur-sm border border-green-700/50 cursor-pointer"
                              >
                                Copy
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="w-full h-[300px] md:h-[500px] lg:h-[600px] p-3 md:p-4 bg-gray-800/40 border border-gray-700/30 rounded-xl overflow-auto backdrop-blur-sm">
                        {formattedJson ? (
                          <JSONHighlighter
                            json={formattedJson}
                            className="text-white font-mono text-sm whitespace-pre-wrap"
                          />
                        ) : (
                          <pre className="text-gray-400 font-mono text-sm">
                            Compressed JSON will appear here...
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );

            case "comparer":
              return (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div></div>
                    <div className="flex space-x-2">
                      <button
                        onClick={loadSampleComparison}
                        className="px-4 py-2 bg-gray-600/50 hover:bg-gray-700/50 text-white rounded-lg text-sm transition-all duration-200 backdrop-blur-sm border border-gray-700/50 cursor-pointer"
                      >
                        Load Sample
                      </button>
                      <button
                        onClick={clearComparison}
                        className="px-4 py-2 bg-red-600/50 hover:bg-red-700/50 text-white rounded-lg text-sm transition-all duration-200 backdrop-blur-sm border border-red-700/50 cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  {/* Top Row - Input JSONs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-300">JSON 1</label>
                        {json1 && (
                          <button
                            onClick={() => copyToClipboard(json1, "JSON 1 copied!")}
                            className="px-3 py-1 bg-green-600/50 hover:bg-green-700/50 text-white rounded-lg text-xs transition-all duration-200 backdrop-blur-sm border border-green-700/50 cursor-pointer"
                          >
                            Copy
                          </button>
                        )}
                      </div>
                      <textarea
                        value={json1}
                        onChange={(e) => setJson1(e.target.value)}
                        placeholder="Paste first JSON here..."
                        className="w-full h-[200px] md:h-[300px] lg:h-[400px] p-3 md:p-4 bg-gray-800/40 border border-gray-700/30 rounded-xl text-white font-mono text-xs md:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-300">JSON 2</label>
                        {json2 && (
                          <button
                            onClick={() => copyToClipboard(json2, "JSON 2 copied!")}
                            className="px-3 py-1 bg-green-600/50 hover:bg-green-700/50 text-white rounded-lg text-xs transition-all duration-200 backdrop-blur-sm border border-green-700/50 cursor-pointer"
                          >
                            Copy
                          </button>
                        )}
                      </div>
                      <textarea
                        value={json2}
                        onChange={(e) => setJson2(e.target.value)}
                        placeholder="Paste second JSON here..."
                        className="w-full h-[200px] md:h-[300px] lg:h-[400px] p-3 md:p-4 bg-gray-800/40 border border-gray-700/30 rounded-xl text-white font-mono text-xs md:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  {/* Bottom Row - Comparison Result */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Comparison Result</label>
                    <div className="w-full h-[300px] md:h-[400px] lg:h-[500px] p-3 md:p-4 bg-gray-800/40 border border-gray-700/30 rounded-xl overflow-auto backdrop-blur-sm">
                      {json1 && json2 ? (
                        <JSONComparer
                          json1={json1}
                          json2={json2}
                          className="text-white"
                        />
                      ) : (
                        <div className="text-gray-400 text-center mt-20">
                          <div className="text-6xl mb-4">🔍</div>
                          <p>Enter JSON in both fields above to compare</p>
                          <p className="text-sm mt-2">Supports smart comparison • Visual diff • Tree structure comparison</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );

            case "jsonpath":
              return (
                <div className="space-y-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <input
                      type="text"
                      value={jsonPathQuery}
                      onChange={(e) => setJsonPathQuery(e.target.value)}
                      placeholder="Enter JSONPath query (e.g., $.store.book[*].author)"
                      className="flex-grow p-2 bg-gray-800/20 border border-gray-700/30 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={evaluateJsonPath}
                      className="px-4 py-2 bg-blue-600/50 hover:bg-blue-700/50 text-white rounded-lg text-sm transition-all duration-200 backdrop-blur-sm border border-blue-700/50 cursor-pointer"
                    >
                      Evaluate
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Input JSON</label>
                      <textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder="Paste your JSON here..."
                        className="w-full h-[300px] md:h-[500px] lg:h-[600px] p-3 md:p-4 bg-gray-800/40 border border-gray-700/30 rounded-xl text-white font-mono text-xs md:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-300">Result</label>
                        {jsonPathResult && (
                          <button
                            onClick={() => copyToClipboard(jsonPathResult, "JSONPath result copied!")}
                            className="px-3 py-1 bg-green-600/50 hover:bg-green-700/50 text-white rounded-lg text-xs transition-all duration-200 backdrop-blur-sm border border-green-700/50 cursor-pointer"
                          >
                            Copy Result
                          </button>
                        )}
                      </div>
                      <div className="w-full h-[300px] md:h-[500px] lg:h-[600px] p-3 md:p-4 bg-gray-800/40 border border-gray-700/30 rounded-xl overflow-auto backdrop-blur-sm">
                        <pre className="text-white font-mono text-sm whitespace-pre-wrap">
                          {jsonPathResult}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              );



            case "types":
              return (
                <div className="space-y-6">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={convertToTypes}
                      className="px-4 py-2 bg-yellow-600/50 hover:bg-yellow-700/50 text-white rounded-lg text-sm transition-all duration-200 backdrop-blur-sm border border-yellow-700/50"
                    >
                      Generate Types
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Input JSON</label>
                      <textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder="Paste your JSON here..."
                        className="w-full h-[300px] md:h-[500px] lg:h-[600px] p-3 md:p-4 bg-gray-800/40 border border-gray-700/30 rounded-xl text-white font-mono text-xs md:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-300">TypeScript Interfaces</label>
                        {typesResult && (
                          <button
                            onClick={() => copyToClipboard(typesResult, "TypeScript types copied!")}
                            className="px-3 py-1 bg-green-600/50 hover:bg-green-700/50 text-white rounded-lg text-xs transition-all duration-200 backdrop-blur-sm border border-green-700/50 cursor-pointer"
                          >
                            Copy Types
                          </button>
                        )}
                      </div>
                      <div className="w-full h-[300px] md:h-[500px] lg:h-[600px] p-3 md:p-4 bg-gray-800/40 border border-gray-700/30 rounded-xl overflow-auto backdrop-blur-sm">
                        <pre className="text-white font-mono text-sm whitespace-pre-wrap">
                          {typesResult}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              );

            default:
              return null;
          }
        })()}
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
          <header className="py-4 md:py-6 px-4 relative">
            {/* GitHub Icon - Top Right */}
            <div className="absolute top-4 right-4 z-10">
              <a
                href="https://github.com/ratnesh-maurya/JSONic"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 bg-gray-800/50 hover:bg-gray-700/70 border border-gray-700/50 rounded-full transition-all duration-200 backdrop-blur-sm group cursor-pointer"
                title="View on GitHub"
              >
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-200"
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
                  <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                    JSONic
                  </h1>
                </div>
                <nav className="hidden md:flex items-center space-x-2 bg-gray-800/0 border border-gray-700/10 p-2 rounded-full shadow-lg backdrop-blur-none">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        trackToolSwitch(activeTab, tab.id);
                        setActiveTab(tab.id);
                      }}
                      className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${activeTab === tab.id
                        ? 'text-white'
                        : 'text-gray-400 hover:text-gray-200'
                        }`}
                    >
                      {activeTab === tab.id && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-blue-600/50 to-purple-600/50 rounded-full"
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
                  className="text-gray-400 text-sm md:text-base font-medium max-w-3xl mx-auto px-2"
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
              <div className="bg-gray-800/0 border border-gray-700/10 rounded-xl p-2 backdrop-blur-none">
                <div className="grid grid-cols-2 gap-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        trackToolSwitch(activeTab, tab.id);
                        setActiveTab(tab.id);
                      }}
                      className={`relative px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${activeTab === tab.id
                        ? 'text-white bg-gradient-to-r from-blue-600/50 to-purple-600/50'
                        : 'text-gray-400 hover:text-gray-200'
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
              <div className="bg-gray-900/0 border border-gray-700/10 rounded-xl md:rounded-3xl p-4 md:p-8 backdrop-blur-none shadow-2xl">
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
