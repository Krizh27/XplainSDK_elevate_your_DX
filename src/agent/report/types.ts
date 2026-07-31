/**
 * @file agent/report/types.ts
 * @description Type definitions and options for Agent SDK Interactive Standalone HTML Report Generator.
 */

/**
 * Configuration options for generating HTML reports.
 */
export interface ReportOptions {
    /** Output file path to write report HTML file. @default "./report.html" */
    outputPath?: string;

    /** Optional custom document title for the report. */
    title?: string;
}

/**
 * Callable function signature for `result.report()`, supporting `.html()` helper.
 */
export interface ReportFunction {
    /** Generates HTML report and optionally writes to disk at `options.outputPath`. */
    (options?: ReportOptions): Promise<string>;

    /** Returns raw HTML document string. */
    html(): string;
}
