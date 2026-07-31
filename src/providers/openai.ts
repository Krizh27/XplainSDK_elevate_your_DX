import OpenAI from "openai";
import { ProviderChatOptions, ProviderChatResponse, ProviderStreamResponse } from "./provider.js";
import { TokenUsage } from "../types.js";

/**
 * @file providers/openai.ts
 * @description OpenAI Provider Adapter handling pass-through execution to the official OpenAI SDK.
 * 
 * PHILOSOPHY:
 * Passes provider-specific options (`providerOptions`) directly through to `openai.chat.completions.create({...})`
 * so developers retain 100% of official OpenAI SDK capabilities (temperature, top_p, max_tokens, response_format, etc.).
 */

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/** Executes an initial non-streaming chat request using official OpenAI SDK. */
export async function callOpenAIAdapter(options: ProviderChatOptions): Promise<ProviderChatResponse> {
    const openai = new OpenAI({
        apiKey: options.apiKey
    });

    const completion = await openai.chat.completions.create({
        ...(options.providerOptions || {}), // Pass provider-specific options directly through
        model: options.model,
        messages: [
            {
                role: "user",
                content: options.input
            }
        ],
        tools: options.tools && options.tools.length > 0 ? options.tools : undefined
    });

    const message = completion.choices[0]?.message;
    const responseText = message?.content ?? "";
    
    const usage: TokenUsage = {
        prompt_tokens: completion.usage?.prompt_tokens ?? 0,
        completion_tokens: completion.usage?.completion_tokens ?? 0,
        total_tokens: completion.usage?.total_tokens ?? 0
    };

    return {
        output_text: responseText,
        usage: usage,
        tool_calls: message?.tool_calls,
        raw_message: message
    };
}

/** Executes a follow-up completion request passing message history. */
export async function callOpenAIFollowupAdapter(
    apiKey: string,
    model: string,
    messages: any[],
    tools?: any[],
    providerOptions?: Record<string, any>
): Promise<ProviderChatResponse> {
    const openai = new OpenAI({
        apiKey: apiKey
    });

    const completion = await openai.chat.completions.create({
        ...(providerOptions || {}), // Pass provider-specific options directly through
        model: model,
        messages: messages,
        tools: tools && tools.length > 0 ? tools : undefined
    });

    const message = completion.choices[0]?.message;
    const responseText = message?.content ?? "";

    const usage: TokenUsage = {
        prompt_tokens: completion.usage?.prompt_tokens ?? 0,
        completion_tokens: completion.usage?.completion_tokens ?? 0,
        total_tokens: completion.usage?.total_tokens ?? 0
    };

    return {
        output_text: responseText,
        usage: usage,
        tool_calls: message?.tool_calls,
        raw_message: message
    };
}

/**
 * Executes a real-time streaming chat request using official OpenAI SDK with pass-through options and speed pacing.
 */
export async function callOpenAIStreamAdapter(options: ProviderChatOptions): Promise<ProviderStreamResponse> {
    const openai = new OpenAI({
        apiKey: options.apiKey
    });

    const stream = await openai.chat.completions.create({
        ...(options.providerOptions || {}), // Pass provider-specific options directly through
        model: options.model,
        messages: [
            {
                role: "user",
                content: options.input
            }
        ],
        stream: true,
        stream_options: {
            include_usage: true
        }
    });

    const chunks: string[] = [];
    let chunkCount = 0;
    let finalUsage: TokenUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    for await (const chunk of stream) {
        const deltaContent = chunk.choices[0]?.delta?.content ?? "";

        if (deltaContent) {
            process.stdout.write(deltaContent);
            chunks.push(deltaContent);
            chunkCount++;

            if (options.streamDelayMs && options.streamDelayMs > 0) {
                await sleep(options.streamDelayMs);
            }
        }

        if (chunk.usage) {
            finalUsage = {
                prompt_tokens: chunk.usage.prompt_tokens ?? 0,
                completion_tokens: chunk.usage.completion_tokens ?? 0,
                total_tokens: chunk.usage.total_tokens ?? 0
            };
        }
    }

    console.log("");

    const fullResponseText = chunks.join("");

    if (finalUsage.completion_tokens === 0 && chunkCount > 0) {
        finalUsage.completion_tokens = chunkCount;
        finalUsage.total_tokens = finalUsage.prompt_tokens + chunkCount;
    }

    return {
        output_text: fullResponseText,
        usage: finalUsage,
        chunk_count: chunkCount,
        chunks: chunks
    };
}
