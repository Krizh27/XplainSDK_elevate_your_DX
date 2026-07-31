import { TokenUsage } from "../types.js";
import { callOpenAIAdapter, callOpenAIStreamAdapter } from "./openai.js";

/**
 * @file providers/provider.ts
 * @description Universal Provider Interface contract and provider resolution logic.
 * 
 * CORE PHILOSOPHY:
 * ExplainSDK is a DX Layer. Provider adapters act as pass-through bridges to official SDKs.
 * Any provider-specific options (`providerOptions`) are passed directly through to the underlying SDK.
 */

/** Standardized input parameters required by provider adapters. */
export interface ProviderChatOptions {
    apiKey: string;
    model: string;
    input: string;
    tools?: any[];
    streamDelayMs?: number;
    /** Provider-specific parameters (e.g. temperature, max_tokens) passed directly to official SDK. */
    providerOptions?: Record<string, any>;
}

/** Standardized output payload returned by provider non-streaming completions. */
export interface ProviderChatResponse {
    output_text: string;
    usage: TokenUsage;
    tool_calls?: any[];
    raw_message?: any;
}

/** Standardized output payload returned by provider streaming completions. */
export interface ProviderStreamResponse {
    output_text: string;
    usage: TokenUsage;
    chunk_count: number;
    chunks: string[];
}

/** Interface contract defining core execution methods every provider adapter must implement. */
export interface Provider {
    /** Executes a non-streaming chat request using the official provider SDK. */
    chat: (options: ProviderChatOptions) => Promise<ProviderChatResponse>;
    /** Executes a real-time streaming chat request using the official provider SDK. */
    stream: (options: ProviderChatOptions) => Promise<ProviderStreamResponse>;
}

const SUPPORTED_PROVIDERS = ["openai"];

/**
 * Resolves a provider name string (e.g. "openai") to its matching Provider adapter.
 * 
 * @param providerName Name of provider identifier.
 * @returns Provider adapter object.
 * @throws Actionable diagnostic error if provider is unrecognized.
 */
export function getProviderAdapter(providerName: string): Provider {
    if (!providerName || typeof providerName !== "string") {
        throw new Error(
            `[ExplainSDK Error] Missing or invalid provider parameter.\n\n` +
            `What Happened: You passed an empty or non-string provider value.\n` +
            `Why: ExplainSDK requires a valid provider name to route request API calls.\n` +
            `How to Fix: Set provider to "openai" or omit the provider option to use the default.`
        );
    }

    const normalizedName = providerName.toLowerCase().trim();

    if (normalizedName === "openai") {
        return {
            chat: callOpenAIAdapter,
            stream: callOpenAIStreamAdapter
        };
    }

    const suggestion = normalizedName.includes("open") || normalizedName.includes("ai") ? `Did you mean "openai"?` : "";
    const providerList = SUPPORTED_PROVIDERS.map(p => `• ${p}`).join("\n");

    throw new Error(
        `[ExplainSDK Error] Unknown provider "${providerName}".\n\n` +
        `What Happened: The provider "${providerName}" is not supported by ExplainSDK.\n` +
        `Why: ExplainSDK currently supports the following provider adapters:\n${providerList}\n\n` +
        `How to Fix: Set provider: "openai" in your ExplainSDK options.\n` +
        (suggestion ? `${suggestion}\n` : "")
    );
}
