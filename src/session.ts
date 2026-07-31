import { fsWriteFile } from "./logger.js";
import { ChatOptions, SessionRecord, TimelineState, TokenUsage } from "./types.js";
import { writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * @file session.ts
 * @description Pure functional module for Session Recording ("flight recorder for AI requests") and optional JSON export.
 * 
 * WHY THIS FILE EXISTS:
 * This module creates, updates, and finalizes structured `SessionRecord` objects.
 * A session acts as a complete "flight recorder" capturing everything that occurred during a single request lifecycle.
 */

/** Package version identifier for ExplainSDK. */
export const EXPLAIN_SDK_VERSION = "1.0.0";

/**
 * Generates a unique, readable session identifier string.
 */
function generateSessionId(): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `sess_${timestamp}_${randomSuffix}`;
}

/**
 * Creates and initializes a fresh `SessionRecord` object at the start of a request.
 * 
 * @param provider Target AI provider identifier.
 * @param model Selected model identifier.
 * @param options User options passed to the request.
 * @param isStreaming Whether this request is running in streaming mode.
 * @returns Initialized SessionRecord flight recorder object.
 */
export function createSession(
    provider: string,
    model: string,
    options: ChatOptions,
    isStreaming: boolean
): SessionRecord {
    const now = new Date();
    return {
        id: generateSessionId(),
        sdkVersion: EXPLAIN_SDK_VERSION,
        timestamp: now.toISOString(),
        provider: provider,
        model: model,
        request: {
            input: options.input,
            model: model,
            streamSpeed: options.streamSpeed,
            streamDelayMs: options.streamDelayMs,
            providerOptions: options.providerOptions
        },
        response: {
            output_text: ""
        },
        timelineEvents: [],
        performanceMetrics: undefined,
        tokenUsage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0
        },
        cost: {
            rawCost: 0,
            formattedCost: "$0.00000"
        },
        toolCalls: [],
        streamingMetadata: {
            isStreaming: isStreaming,
            totalChunks: isStreaming ? 0 : undefined,
            chunks: isStreaming ? [] : undefined
        }
    };
}

/**
 * Finalizes a `SessionRecord` object at the conclusion of a request.
 * 
 * @param session The active SessionRecord object.
 * @param responseText Final generated text output.
 * @param timeline TimelineState object holding events, latency, and performance metrics.
 * @param usage Normalized TokenUsage statistics.
 * @param rawCost Numerical dollar cost.
 * @param formattedCost Formatted currency string.
 * @param chunks Optional retained token chunks array (for streaming mode).
 * @returns Finalized, immutable SessionRecord object.
 */
export function finalizeSession(
    session: SessionRecord,
    responseText: string,
    timeline: TimelineState,
    usage: TokenUsage,
    rawCost: number,
    formattedCost: string,
    chunks?: string[]
): SessionRecord {
    session.response.output_text = responseText;
    session.timelineEvents = timeline.events;
    session.performanceMetrics = timeline.metrics;
    session.tokenUsage = usage;
    session.cost = {
        rawCost: rawCost,
        formattedCost: formattedCost
    };
    session.toolCalls = timeline.toolInspections || [];

    if (session.streamingMetadata.isStreaming && chunks) {
        session.streamingMetadata.totalChunks = chunks.length;
        session.streamingMetadata.chunks = chunks;
    }

    return session;
}

/**
 * Optional helper function that exports a SessionRecord object to a formatted JSON file on disk.
 * 
 * @param session The SessionRecord object to export.
 * @param filePath Optional target file path (defaults to `./session_<id>.json`).
 * @returns Promise resolving to the absolute or relative file path where the session JSON was saved.
 * @throws Actionable 3-part diagnostic error if writing to disk fails.
 * 
 * @example
 * ```typescript
 * const result = await sdk.chat({ input: "Hello" });
 * const savedPath = await exportSession(result.session, "./logs/my_request.json");
 * console.log(`Session saved to: ${savedPath}`);
 * ```
 */
export async function exportSession(session: SessionRecord, filePath?: string): Promise<string> {
    if (!session || !session.id) {
        throw new Error(
            `[ExplainSDK Error] Invalid session object passed to exportSession().\n\n` +
            `What Happened: You passed an undefined or invalid session object to exportSession().\n` +
            `Why: exportSession requires a valid SessionRecord object returned from sdk.chat() or sdk.stream().\n` +
            `How to Fix: Pass result.session to exportSession:\n\n` +
            `  const result = await sdk.chat({ input: "Hello" });\n` +
            `  await exportSession(result.session);`
        );
    }

    const targetPath = filePath || `./session_${session.id}.json`;
    const resolvedPath = path.resolve(targetPath);

    try {
        const jsonContent = JSON.stringify(session, null, 2);
        await writeFile(resolvedPath, jsonContent, "utf-8");
        return resolvedPath;
    } catch (err: any) {
        throw new Error(
            `[ExplainSDK Error] Failed to export session JSON file to "${resolvedPath}".\n\n` +
            `What Happened: An error occurred while writing the session JSON file to disk.\n` +
            `Why: ${err instanceof Error ? err.message : String(err)}\n` +
            `How to Fix: Check if the target directory exists and ensure your application has file write permissions.`
        );
    }
}
