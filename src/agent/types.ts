import { StreamSpeedPreset, SessionRecord } from "../types.js";
import { StorageAdapter, AgentMessage } from "./memory/types.js";
import { InputGuardrail, OutputGuardrail, ApprovalCallback } from "./guardrails/types.js";

/**
 * @file agent/types.ts
 * @description Centralized TypeScript interface contracts and configuration schemas for the Agent SDK.
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
    /** Optional flag indicating whether human approval is required before executing this tool. @default false */
    requiresApproval?: boolean;
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

    /** Optional persistent memory storage adapter implementation. */
    memory?: StorageAdapter;

    /** Optional array of Input Guardrails executed before runtime loop. */
    inputGuardrails?: InputGuardrail[];

    /** Optional array of Output Guardrails executed after LLM completion. */
    outputGuardrails?: OutputGuardrail[];

    /** Optional callback invoked when a tool marked `requiresApproval: true` requests execution. */
    onApprovalRequired?: ApprovalCallback;
}

/**
 * Options passed to `agent.run()`.
 */
export interface AgentRunOptions {
    /** The user prompt or instruction string for the agent run. */
    input: string;

    /** Optional session ID for loading and saving multi-turn conversation memory. */
    sessionId?: string;

    /** Optional model override for this specific run. */
    model?: string;

    /** Optional stream rendering speed override. */
    streamSpeed?: StreamSpeedPreset;

    /** Optional provider-specific parameters passed directly to provider SDK. */
    providerOptions?: Record<string, any>;
}

/**
 * Transient execution context constructed per agent run.
 */
export interface RunContext {
    sessionId?: string;
    input: string;
    history: AgentMessage[];
    model: string;
    streamSpeed?: StreamSpeedPreset;
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

    /** Complete array of loaded and updated conversation messages for this session. */
    history?: AgentMessage[];
}
