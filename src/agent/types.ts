import { StreamSpeedPreset, SessionRecord } from "../types.js";
import { StorageAdapter, AgentMessage } from "./memory/types.js";
import { InputGuardrail, OutputGuardrail, ApprovalCallback } from "./guardrails/types.js";
import { Agent } from "./agent.js";
import { AgentExplanation, ExplainFunction } from "./explain/types.js";
import { ReplayData, ReplayFunction } from "./replay/types.js";
import { ReportOptions, ReportFunction } from "./report/types.js";
import {
    RunStartPayload,
    ToolStartPayload,
    ToolCompletePayload,
    HandoffEventPayload,
    GuardrailPayload,
    RunCompletePayload,
    RunFailedPayload
} from "./events/types.js";

/**
 * @file agent/types.ts
 * @description Centralized TypeScript interface contracts and configuration schemas for the Agent SDK.
 */

export interface AgentTool<TArgs = any, TResult = any> {
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
    tools?: AgentTool<any, any>[];

    /** Optional persistent memory storage adapter implementation. */
    memory?: StorageAdapter;

    /** Optional array of Input Guardrails executed before runtime loop. */
    inputGuardrails?: InputGuardrail[];

    /** Optional array of Output Guardrails executed after LLM completion. */
    outputGuardrails?: OutputGuardrail[];

    /** Optional callback invoked when a tool marked `requiresApproval: true` requests execution. */
    onApprovalRequired?: ApprovalCallback;

    /** Maximum retry attempts for transient errors. @default 3 */
    retries?: number;

    /** Per-turn execution timeout limit in milliseconds. @default 30000 */
    timeoutMs?: number;

    /** Maximum allowed consecutive repetitions of identical tool calls before triggering loop error. @default 3 */
    maxToolLoopThreshold?: number;

    /** Optional target agents this agent can hand off control to. */
    handoffs?: Agent[];

    /** Maximum allowed delegation stack depth before triggering handoff loop error. @default 5 */
    maxHandoffDepth?: number;

    // Optional Event Callbacks
    onRunStart?: (payload: RunStartPayload) => void | Promise<void>;
    onToolStart?: (payload: ToolStartPayload) => void | Promise<void>;
    onToolComplete?: (payload: ToolCompletePayload) => void | Promise<void>;
    onHandoff?: (payload: HandoffEventPayload) => void | Promise<void>;
    onGuardrail?: (payload: GuardrailPayload) => void | Promise<void>;
    onRunComplete?: (payload: RunCompletePayload) => void | Promise<void>;
    onRunFailed?: (payload: RunFailedPayload) => void | Promise<void>;
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

    /** Optional runId tracking this specific run context. */
    runId?: string;

    /** Internal delegation stack tracking active agent handoffs. */
    handoffChain?: string[];

    /** Flag indicating whether to generate Explain Mode summary telemetry on result. @default false */
    explain?: boolean;
}

/**
 * Transient execution context constructed per agent run.
 */
export interface RunContext {
    runId: string;
    sessionId?: string;
    input: string;
    history: AgentMessage[];
    model: string;
    streamSpeed?: StreamSpeedPreset;
    providerOptions?: Record<string, any>;
    handoffChain: string[];
}

/**
 * Normalized result payload returned by `agent.run()`.
 */
export interface AgentRunResult {
    /** Unique run identifier string generated for this execution turn. */
    runId: string;

    /** Final text response produced by the agent. */
    output_text: string;

    /** ExplainSDK SessionRecord flight recorder object holding full telemetry. */
    session: SessionRecord;

    /** Number of execution iterations completed. */
    iterations: number;

    /** Name of the agent that produced this response. */
    agentName: string;

    /** Name of the active agent that finalized the response (useful when handoffs occurred). */
    activeAgentName: string;

    /** Delegation chain showing handoff progression (e.g. ["TriageAgent", "BillingAgent"]). */
    handoffChain: string[];

    /** Complete array of loaded and updated conversation messages for this session. */
    history?: AgentMessage[];

    /** Structured AgentExplanation payload produced by Explain Mode. */
    explanation?: AgentExplanation;

    /** Callable ExplainFunction: invoke `result.explain()` for console output, `.markdown()` for report, `.json()` for data. */
    explain: ExplainFunction;

    /** Callable ReplayFunction: invoke `result.replay()` for step-by-step playback, `.markdown()` for report, `.json()` for data. */
    replay: ReplayFunction;

    /** Callable ReportFunction: invoke `await result.report({ outputPath })` to generate HTML report file or `.html()` for raw string. */
    report: ReportFunction;
}
