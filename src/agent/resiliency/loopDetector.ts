import { ToolCallSignature } from "./types.js";

/**
 * @file agent/resiliency/loopDetector.ts
 * @description Pure functional state signature checker for detecting infinite tool invocation loops.
 */

/**
 * Computes a unique deterministic signature string for a tool call.
 */
function getToolSignature(toolCall: ToolCallSignature): string {
    return `${toolCall.toolName}:${JSON.stringify(toolCall.args || {})}`;
}

/**
 * Detects whether an upcoming tool call represents an infinite, repeated loop.
 * 
 * Tracks consecutive identical tool name and argument signatures at the end of execution history.
 * 
 * @param history List of previously executed tool call signatures.
 * @param nextToolCall The tool call attempting execution.
 * @param threshold Maximum allowed consecutive repetitions (default 3).
 * @throws Actionable 3-part diagnostic error if threshold is exceeded.
 * 
 * @example
 * ```typescript
 * detectToolLoop(history, { toolName: "get_weather", args: { city: "Surat" } }, 3);
 * ```
 */
export function detectToolLoop(
    history: ToolCallSignature[],
    nextToolCall: ToolCallSignature,
    threshold: number = 3
): void {
    if (!history || history.length === 0) {
        return;
    }

    const targetSignature = getToolSignature(nextToolCall);
    let consecutiveCount = 0;

    // Count consecutive identical signatures from tail of history
    for (let i = history.length - 1; i >= 0; i--) {
        const pastSignature = getToolSignature(history[i]);
        if (pastSignature === targetSignature) {
            consecutiveCount++;
        } else {
            break;
        }
    }

    if (consecutiveCount + 1 >= threshold) {
        throw new Error(
            `[AgentSDK Tool Loop Error] Detected infinite tool execution loop for "${nextToolCall.toolName}()".\n\n` +
            `What Happened: The tool "${nextToolCall.toolName}()" was invoked ${consecutiveCount + 1} consecutive times with identical arguments: ${JSON.stringify(nextToolCall.args)}.\n` +
            `Why: The model is stuck in an infinite tool invocation cycle without making progress.\n` +
            `How to Fix: Provide more specific prompt context, refine tool return values, or increase maxToolLoopThreshold.`
        );
    }
}
