import { ChatOptions, ChatResponse, PerformanceMetrics, StreamSpeedPreset, StreamRenderingOptions, STREAM_SPEED_PRESETS } from "./types.js";
import { createTimeline, recordEvent, recordToolInspection, startTimer, stopTimer, getLatencyMs, recordMetrics, printTimeline } from "./timeline.js";
import { getProviderAdapter } from "./providers/provider.js";
import { formatToolsForOpenAI, getToolFromRegistry, ToolRegistry } from "./tools.js";
import { inspectAndExecuteTool, formatToolInspectorReport } from "./toolInspector.js";
import { calculateCost, formatCost } from "./cost.js";
import { callOpenAIFollowupAdapter } from "./providers/openai.js";
import { log } from "./logger.js";
import { createSession, finalizeSession } from "./session.js";

/**
 * @file chat.ts
 * @description Request lifecycle orchestrator for non-streaming and streaming requests with Session Recording support.
 */

function countWords(text: string): number {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
}

/** Resolves final stream rendering delay in milliseconds. */
export function resolveStreamRenderingDelay(
    options?: ChatOptions,
    defaults?: { streamSpeed?: StreamSpeedPreset; streamDelayMs?: number; rendering?: StreamRenderingOptions }
): number {
    if (options?.streamDelayMs !== undefined) return options.streamDelayMs;
    if (options?.rendering?.delayMs !== undefined) return options.rendering.delayMs;

    if (options?.streamSpeed && STREAM_SPEED_PRESETS[options.streamSpeed] !== undefined) {
        return STREAM_SPEED_PRESETS[options.streamSpeed];
    }
    if (options?.rendering?.speed && STREAM_SPEED_PRESETS[options.rendering.speed] !== undefined) {
        return STREAM_SPEED_PRESETS[options.rendering.speed];
    }

    if (defaults?.streamDelayMs !== undefined) return defaults.streamDelayMs;
    if (defaults?.rendering?.delayMs !== undefined) return defaults.rendering.delayMs;
    if (defaults?.streamSpeed && STREAM_SPEED_PRESETS[defaults.streamSpeed] !== undefined) {
        return STREAM_SPEED_PRESETS[defaults.streamSpeed];
    }
    if (defaults?.rendering?.speed && STREAM_SPEED_PRESETS[defaults.rendering.speed] !== undefined) {
        return STREAM_SPEED_PRESETS[defaults.rendering.speed];
    }

    return 0;
}

/** Handles a non-streaming chat request lifecycle with Session Recording. */
export async function handleChat(
    providerName: string,
    apiKey: string,
    defaultModel: string,
    options: ChatOptions,
    toolRegistry?: ToolRegistry
): Promise<ChatResponse> {
    const selectedModel = options.model || defaultModel;

    // 1. Create a fresh SessionRecord flight recorder object
    const session = createSession(providerName, selectedModel, options, false);
    const timeline = createTimeline();

    recordEvent(timeline, "Request Started");

    const displayProvider = providerName.toLowerCase() === "openai" ? "OpenAI" : providerName;
    recordEvent(timeline, `Provider: ${displayProvider}`);

    const displayModelName = selectedModel.toUpperCase().startsWith("GPT")
        ? selectedModel.toUpperCase()
        : selectedModel;

    recordEvent(timeline, `Model: ${displayModelName}`);

    startTimer(timeline);
    recordEvent(timeline, "Sending Request");

    let finalOutputText = "";
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let rawResponse: any;

    try {
        const adapter = getProviderAdapter(providerName);
        const formattedTools = toolRegistry ? formatToolsForOpenAI(toolRegistry) : undefined;

        const initialResponse = await adapter.chat({
            apiKey: apiKey,
            model: selectedModel,
            input: options.input,
            tools: formattedTools,
            providerOptions: options.providerOptions
        });

        totalPromptTokens += initialResponse.usage.prompt_tokens;
        totalCompletionTokens += initialResponse.usage.completion_tokens;
        rawResponse = initialResponse.raw_message;

        if (initialResponse.tool_calls && initialResponse.tool_calls.length > 0 && toolRegistry) {
            recordEvent(timeline, "Tool Selected");

            const messages: any[] = [
                { role: "user", content: options.input },
                initialResponse.raw_message
            ];

            for (const toolCall of initialResponse.tool_calls) {
                const toolName = toolCall.function.name;
                const rawArgs = toolCall.function.arguments;
                const registeredTool = getToolFromRegistry(toolRegistry, toolName);

                if (registeredTool) {
                    const inspection = await inspectAndExecuteTool(
                        registeredTool,
                        rawArgs,
                        `Model decided to execute ${toolName}() to answer user prompt.`
                    );

                    recordToolInspection(timeline, inspection);
                    recordEvent(timeline, `Tool Executed: ${toolName}`);
                    log(formatToolInspectorReport(inspection));

                    messages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: inspection.success ? (inspection.result || "") : `Error: ${inspection.error}`
                    });
                } else {
                    recordEvent(timeline, `Tool Failed: ${toolName} (Not registered)`);
                    messages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: `Error: Tool '${toolName}' is not registered.`
                    });
                }
            }

            recordEvent(timeline, "Sending Tool Results to Model");
            const followupResponse = await callOpenAIFollowupAdapter(
                apiKey,
                selectedModel,
                messages,
                formattedTools,
                options.providerOptions
            );

            totalPromptTokens += followupResponse.usage.prompt_tokens;
            totalCompletionTokens += followupResponse.usage.completion_tokens;
            finalOutputText = followupResponse.output_text;
            rawResponse = followupResponse.raw_message;
        } else {
            finalOutputText = initialResponse.output_text;
        }
    } finally {
        stopTimer(timeline);
        recordEvent(timeline, "Response Received");

        const charCount = finalOutputText.length;
        const wordCount = countWords(finalOutputText);

        const totalTokens = totalPromptTokens + totalCompletionTokens;
        const rawCost = calculateCost(
            selectedModel,
            totalPromptTokens,
            totalCompletionTokens
        );
        const formattedCost = formatCost(rawCost);

        const metrics: PerformanceMetrics = {
            startTimeFormatted: timeline.startTimeFormatted,
            endTimeFormatted: timeline.endTimeFormatted,
            latencyMs: getLatencyMs(timeline),
            charactersReturned: charCount,
            wordsReturned: wordCount,
            promptTokens: totalPromptTokens,
            completionTokens: totalCompletionTokens,
            totalTokens: totalTokens,
            estimatedCostFormatted: formattedCost
        };

        recordMetrics(timeline, metrics);
        printTimeline(timeline);

        // Finalize SessionRecord object
        finalizeSession(
            session,
            finalOutputText,
            timeline,
            { prompt_tokens: totalPromptTokens, completion_tokens: totalCompletionTokens, total_tokens: totalTokens },
            rawCost,
            formattedCost
        );
    }

    return {
        output_text: finalOutputText,
        session: session,
        raw_response: rawResponse
    };
}

/** Handles a real-time streaming chat request lifecycle with Session Recording. */
export async function handleStream(
    providerName: string,
    apiKey: string,
    defaultModel: string,
    options: ChatOptions,
    defaultRenderingSettings?: { streamSpeed?: StreamSpeedPreset; streamDelayMs?: number; rendering?: StreamRenderingOptions },
    toolRegistry?: ToolRegistry
): Promise<ChatResponse> {
    const selectedModel = options.model || defaultModel;

    // 1. Create a fresh SessionRecord flight recorder object
    const session = createSession(providerName, selectedModel, options, true);
    const timeline = createTimeline();

    recordEvent(timeline, "Request Started");

    const displayProvider = providerName.toLowerCase() === "openai" ? "OpenAI" : providerName;
    recordEvent(timeline, `Provider: ${displayProvider}`);

    const displayModelName = selectedModel.toUpperCase().startsWith("GPT")
        ? selectedModel.toUpperCase()
        : selectedModel;

    recordEvent(timeline, `Model: ${displayModelName}`);

    startTimer(timeline);
    recordEvent(timeline, "Streaming Started");

    let streamResponse = {
        output_text: "",
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        chunk_count: 0,
        chunks: [] as string[]
    };

    const activeStreamDelay = resolveStreamRenderingDelay(options, defaultRenderingSettings);

    try {
        const adapter = getProviderAdapter(providerName);
        streamResponse = await adapter.stream({
            apiKey: apiKey,
            model: selectedModel,
            input: options.input,
            streamDelayMs: activeStreamDelay,
            providerOptions: options.providerOptions
        });
    } finally {
        stopTimer(timeline);
        recordEvent(timeline, "Streaming Finished");

        const charCount = streamResponse.output_text.length;
        const wordCount = countWords(streamResponse.output_text);

        const rawCost = calculateCost(
            selectedModel,
            streamResponse.usage.prompt_tokens,
            streamResponse.usage.completion_tokens
        );
        const formattedCost = formatCost(rawCost);

        const metrics: PerformanceMetrics = {
            startTimeFormatted: timeline.startTimeFormatted,
            endTimeFormatted: timeline.endTimeFormatted,
            latencyMs: getLatencyMs(timeline),
            totalChunks: streamResponse.chunk_count,
            charactersReturned: charCount,
            wordsReturned: wordCount,
            promptTokens: streamResponse.usage.prompt_tokens,
            completionTokens: streamResponse.usage.completion_tokens,
            totalTokens: streamResponse.usage.total_tokens,
            estimatedCostFormatted: formattedCost
        };

        recordMetrics(timeline, metrics);
        printTimeline(timeline);

        // Finalize SessionRecord object
        finalizeSession(
            session,
            streamResponse.output_text,
            timeline,
            streamResponse.usage,
            rawCost,
            formattedCost,
            streamResponse.chunks
        );
    }

    return {
        output_text: streamResponse.output_text,
        session: session
    };
}
