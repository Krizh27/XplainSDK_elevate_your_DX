import { SessionRecord } from "../../types.js";
import { inspectPerformance } from "../../inspectors/performance.js";
import { ReplayData, ReplayStep } from "./types.js";

/**
 * @file agent/replay/replay.ts
 * @description Pure deterministic Session Replay reconstruction engine consuming SessionRecord telemetry.
 * 
 * ARCHITECTURAL DESIGN PRINCIPLE:
 * Session Replay operates 100% deterministically on recorded SessionRecord telemetry.
 * It NEVER invokes network APIs, re-executes LLM providers, or reruns tool functions.
 */

/**
 * Reconstructs a step-by-step execution timeline array from a recorded SessionRecord object.
 * 
 * @param session SessionRecord flight recorder object.
 * @returns Strongly typed ReplayData object.
 */
export function reconstructReplay(session: SessionRecord): ReplayData {
    const perf = inspectPerformance(session);
    const steps: ReplayStep[] = [];
    let stepCount = 1;

    // Step 1: User Prompt Input
    const userPrompt = session.request?.input || "N/A";
    steps.push({
        stepNumber: stepCount++,
        type: "user_input",
        title: "User Prompt Input Received",
        detail: `Input: "${userPrompt}"`,
        status: "info",
        timestamp: session.timestamp
    });

    // Step 2..N: Process Recorded Tool Executions
    if (session.toolCalls && session.toolCalls.length > 0) {
        for (const tc of session.toolCalls) {
            const toolStatus = tc.success ? "success" : "failed";
            const argStr = JSON.stringify(tc.args || {});
            const resStr = typeof tc.result === "object" ? JSON.stringify(tc.result) : String(tc.result || tc.error || "");

            steps.push({
                stepNumber: stepCount++,
                type: "tool_execution",
                title: `Tool Called: ${tc.toolName}()`,
                detail: `Arguments: ${argStr}\nDuration:  ${tc.durationMs} ms\nResult:    ${resStr}`,
                status: toolStatus,
                timestamp: tc.startTimeFormatted
            });
        }
    } else {
        steps.push({
            stepNumber: stepCount++,
            type: "decision",
            title: "Model Decision: Direct Completion",
            detail: "Model evaluated prompt context and generated completion without invoking external tools.",
            status: "info"
        });
    }

    // Step Final: Assistant Response Output
    const finalOutput = session.response?.output_text || "";
    steps.push({
        stepNumber: stepCount++,
        type: "response",
        title: "Assistant Final Response Produced",
        detail: `Output: "${finalOutput.length > 150 ? finalOutput.substring(0, 150) + "..." : finalOutput}"\nTokens: ${session.tokenUsage.total_tokens} | Cost: ${session.cost.formattedCost}`,
        status: "success",
        timestamp: session.timestamp
    });

    return {
        sessionId: session.id,
        provider: session.provider,
        model: session.model,
        totalSteps: steps.length,
        steps: steps,
        finalOutput: finalOutput,
        durationMs: perf.latencyMs
    };
}
