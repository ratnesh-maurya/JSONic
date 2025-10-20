/**
 * Analytics utility for tracking user interactions with GA4
 * This module provides functions to track custom events in Google Analytics 4
 */

/**
 * Track a custom event in GA4
 * @param eventName - The name of the event to track
 * @param eventData - Optional data to send with the event
 */
export const trackEvent = (
  eventName: string,
  eventData?: Record<string, string | number | boolean>
) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, eventData);
  }
};

/**
 * Track JSON formatting operation
 */
export const trackJsonFormat = (inputSize: number, outputSize: number) => {
  trackEvent("json_format", {
    input_size: inputSize,
    output_size: outputSize,
  });
};

/**
 * Track JSON validation
 */
export const trackJsonValidation = (isValid: boolean, errorType?: string) => {
  trackEvent("json_validation", {
    is_valid: isValid,
    error_type: errorType || "none",
  });
};

/**
 * Track JSON comparison
 */
export const trackJsonComparison = (
  json1Size: number,
  json2Size: number,
  differencesFound: number
) => {
  trackEvent("json_comparison", {
    json1_size: json1Size,
    json2_size: json2Size,
    differences_found: differencesFound,
  });
};

/**
 * Track tree analysis
 */
export const trackTreeAnalysis = (
  nodeCount: number,
  depth: number,
  size: number
) => {
  trackEvent("tree_analysis", {
    node_count: nodeCount,
    depth: depth,
    size: size,
  });
};

/**
 * Track JSONPath query
 */
export const trackJsonPathQuery = (queryLength: number, resultsFound: number) => {
  trackEvent("jsonpath_query", {
    query_length: queryLength,
    results_found: resultsFound,
  });
};

/**
 * Track copy to clipboard action
 */
export const trackCopyToClipboard = (contentType: string) => {
  trackEvent("copy_to_clipboard", {
    content_type: contentType,
  });
};

/**
 * Track sample JSON loaded
 */
export const trackSampleLoaded = (sampleType: string) => {
  trackEvent("sample_loaded", {
    sample_type: sampleType,
  });
};

/**
 * Track tool tab switch
 */
export const trackToolSwitch = (fromTool: string, toTool: string) => {
  trackEvent("tool_switch", {
    from_tool: fromTool,
    to_tool: toTool,
  });
};

/**
 * Track file download
 */
export const trackFileDownload = (fileType: string, fileSize: number) => {
  trackEvent("file_download", {
    file_type: fileType,
    file_size: fileSize,
  });
};

/**
 * Track error occurrence
 */
export const trackError = (errorType: string, errorMessage?: string) => {
  trackEvent("error_occurred", {
    error_type: errorType,
    error_message: errorMessage || "unknown",
  });
};

// Extend window interface to include gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      eventName: string,
      eventData?: Record<string, string | number | boolean>
    ) => void;
  }
}

