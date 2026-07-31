import { ToolDefinition, ToolInspectionResult } from "./types.js";
import { formatDetailedTime } from "./timeline.js";

/**
 * toolInspector.ts
 * 
 * WHY THIS FILE EXISTS:
 * This module acts as the AI Tool Call Inspector & Execution Debugger.
 * 
 * RESPONSIBILITIES:
 * 1. Executes tool functions with high-precision millisecond timing.
 * 2. Provides an Error Boundary: Catches runtime tool errors without crashing the SDK.
 * 3. Formats and renders the rich 🛠 Tool Inspector diagnostic report to stdout.
 */

/**
 * Safely parses raw JSON arguments string into an object.
 */
function parseToolArguments(rawArgsJson: string): Record<string, any> {
    try {
        return rawArgsJson ? JSON.parse(rawArgsJson) : {};
    } catch {
        return { raw: rawArgsJson };
    }
}

/**
 * Formats argument key-value pairs into a clean string representation.
 */
function formatArguments(args: Record<string, any>): string {
    const keys = Object.keys(args);
    if (keys.length === 0) return "None";

    return keys
        .map(key => `${key}: ${typeof args[key] === "object" ? JSON.stringify(args[key]) : args[key]}`)
        .join("\n");
}

/**
 * Intercepts, times, and executes a tool function, capturing detailed telemetry.
 * 
 * @param tool The target ToolDefinition to execute.
 * @param rawArgsJson Raw JSON arguments string passed by the LLM.
 * @param reason Optional reasoning context for why the model invoked this tool.
 * @returns Promise resolving to ToolInspectionResult.
 */
export async function inspectAndExecuteTool(
    tool: ToolDefinition,
    rawArgsJson: string,
    reason: string = "Model selected tool to fulfill request."
): Promise<ToolInspectionResult> {
    const args = parseToolArguments(rawArgsJson);
    const startDate = new Date();
    const startTimeFormatted = formatDetailedTime(startDate);
    const startMs = performance.now();

    let success = false;
    let resultOutput = "";
    let errorMessage = "";

    try {
        // Execute the registered tool function
        const rawResult = await tool.execute(args);
        
        success = true;
        resultOutput = typeof rawResult === "string" 
            ? rawResult 
            : JSON.stringify(rawResult, null, 2);
    } catch (err: any) {
        success = false;
        errorMessage = err instanceof Error ? err.message : String(err);
        resultOutput = `Tool Execution Error: ${errorMessage}`;
    }

    const endDate = new Date();
    const endTimeFormatted = formatDetailedTime(endDate);
    const endMs = performance.now();
    const durationMs = Math.round(endMs - startMs);

    return {
        toolName: tool.name,
        reason: reason,
        args: args,
        startTimeFormatted: startTimeFormatted,
        endTimeFormatted: endTimeFormatted,
        durationMs: durationMs,
        success: success,
        result: resultOutput,
        error: errorMessage || undefined
    };
}

/**
 * Formats a ToolInspectionResult into the rich 🛠 Tool Inspector terminal report.
 * 
 * @param inspection ToolInspectionResult telemetry object.
 * @returns Formatted multi-line report string.
 */
export function formatToolInspectorReport(inspection: ToolInspectionResult): string {
    const statusText = inspection.success ? "Success" : "Failed";
    const returnedText = inspection.success ? inspection.result : (inspection.error || inspection.result);

    return [
        "",
        "🛠 Tool Inspector",
        "────────────────────────────",
        "Model decided to call:",
        `${inspection.toolName}()`,
        "",
        "Reason:",
        inspection.reason || "Model selected tool to fulfill request.",
        "────────────────────────────",
        "Arguments:",
        formatArguments(inspection.args),
        "────────────────────────────",
        "Execution:",
        "Started",
        inspection.startTimeFormatted,
        "",
        "Finished",
        inspection.endTimeFormatted,
        "",
        "Duration",
        `${inspection.durationMs} ms`,
        "",
        "Result",
        statusText,
        "────────────────────────────",
        "Returned:",
        returnedText,
        "────────────────────────────",
        ""
    ].join("\n");
}
