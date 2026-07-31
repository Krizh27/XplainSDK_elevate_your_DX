import { SessionRecord, ToolsInspectionData } from "../types.js";

/**
 * @file inspectors/tools.ts
 * @description Specialized pure-function inspector for tool call executions.
 * 
 * ARCHITECTURAL RULE: Data -> Formatter -> UI
 * Receives a SessionRecord object and returns pure, structured ToolsInspectionData.
 * Performs ZERO console.log calls and ZERO network requests.
 */

/**
 * Inspects tool executions, parameters, durations, and returned results captured during a request session.
 * 
 * @param session SessionRecord flight recorder object.
 * @returns Structured ToolsInspectionData object.
 */
export function inspectTools(session: SessionRecord): ToolsInspectionData {
    const toolCalls = session.toolCalls || [];

    const executions = toolCalls.map(tc => ({
        toolName: tc.toolName,
        args: tc.args,
        startTimeFormatted: tc.startTimeFormatted,
        endTimeFormatted: tc.endTimeFormatted,
        durationMs: tc.durationMs,
        status: (tc.success ? "Success" : "Failed") as "Success" | "Failed",
        returned: tc.success ? (tc.result || "") : (tc.error || tc.result || "")
    }));

    return {
        totalToolsExecuted: executions.length,
        executions: executions
    };
}
