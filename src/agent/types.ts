import { StreamSpeedPreset, SessionRecord, StreamRenderingOptions } from "../types.js";

/**
 * @file agent/types.ts
 * @description Centralized TypeScript interface contracts and configuration schemas for the Agent SDK.
 */

/**
 * Interface contract defining an executable agent tool.
 * 
 * @template TArgs Type of argument object passed to the execute function.
 * @template TResult Return type of the tool execution function.
 */
export interface AgentTool<TArgs = Record<string, any>, TResult = any> {
    /** Unique name identifier for the tool. */
    name: string;
    /** Clear description explaining what the tool does to the LLM model. */
    description: string;
    /** Optional Zod schema or JSON schema definition for argument validation. */
    schema?: any;
    /** Optional raw JSON parameter schema. */
    parameters?: Record<string, any>;
    /** Execution function invoked when the model calls this tool. */
    execute: (args: TArgs) => Promise<TResult> | TResult;
}

/**
 * Configuration options required when instantiating an `Agent` instance.
 */
export interface AgentConfig {
    /** Name identifier for the agent (e.g. "CustomerSupportAgent"). */
    name: string;

    /** System instructions or persona definition guiding model behavior. */
    instructions?: string;

    /** LLM model identifier to use (e.g. "gpt-4o-mini"). */
    model?: string;

    /** Secret API key for authentication. */
    apiKey: string;

    /** Provider name identifier (e.g. "openai"). @default "openai" */
    provider?: string;

    /** Default stream rendering speed preset ("instant", "fast", "normal", "slow"). */
    streamSpeed?: StreamSpeedPreset;

    /** Maximum allowed completion iterations before halting loop. @default 10 */
    maxIterations?: number;

    /** List of tools available to this agent. */
    tools?: AgentTool[];
}

/**
 * Options passed to `agent.run()`.
 */
export interface AgentRunOptions {
    /** The user prompt or instruction string for the agent run. */
    input: string;

    /** Optional model override for this specific run. */
    model?: string;

    /** Optional stream rendering speed override. */
    streamSpeed?: StreamSpeedPreset;

    /** Optional provider-specific parameters passed directly to provider SDK. */
    providerOptions?: Record<string, any>;
}

/**
 * Normalized result payload returned by `agent.run()`.
 */
export interface AgentRunResult {
    /** Final text response produced by the agent. */
    output_text: string;

    /** ExplainSDK SessionRecord flight recorder object holding full telemetry. */
    session: SessionRecord;

    /** Number of execution iterations completed. */
    iterations: number;

    /** Name of the agent that produced this response. */
    agentName: string;
}
