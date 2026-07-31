import { z } from "zod";
import { AgentConfig, AgentRunOptions, AgentRunResult, AgentTool } from "./types.js";
import { StorageAdapter } from "./memory/types.js";
import { InputGuardrail, OutputGuardrail, ApprovalCallback } from "./guardrails/types.js";
import { StructuredRunOptions, StructuredRunResult } from "./structured/types.js";
import { AgentEventEmitter } from "./events/emitter.js";
import { AgentEventName, AgentEventListener } from "./events/types.js";
import { AgentExplanation } from "./explain/types.js";
import { generateExplanation } from "./explain/explain.js";
import { ReplayData } from "./replay/types.js";
import { reconstructReplay } from "./replay/replay.js";
import { ReportOptions } from "./report/types.js";
import { saveHTMLReport } from "./report/report.js";
import { DebugReport } from "./debug/types.js";
import { analyzeDebug } from "./debug/debug.js";
import { executeStructuredOutput } from "./structured/repair.js";
import { runAgentLoop } from "./runner.js";
import { SessionRecord } from "../types.js";

/**
 * @class Agent
 * @description Primary declarative entity in Agent SDK representing an AI Agent.
 * 
 * An `Agent` encapsulates identity name, instructions, model, tools, memory,
 * guardrails, approval callbacks, resiliency policies, multi-agent `handoffs`,
 * runtime event emitter (`.on()`), Explain Mode (`agent.explain()`), Session Replay (`agent.replay()`), Interactive HTML Report (`agent.generateReport()`), Smart Debug Assistant (`agent.debug()`), and structured output execution.
 */
export class Agent {
    public readonly name: string;
    public readonly instructions: string;
    public readonly model: string;
    public readonly apiKey: string;
    public readonly provider: string;
    public readonly streamSpeed: any;
    public readonly maxIterations: number;
    public readonly tools: AgentTool[];
    public readonly memory?: StorageAdapter;
    public readonly inputGuardrails?: InputGuardrail[];
    public readonly outputGuardrails?: OutputGuardrail[];
    public readonly onApprovalRequired?: ApprovalCallback;
    public readonly retries: number;
    public readonly timeoutMs: number;
    public readonly maxToolLoopThreshold: number;
    public readonly handoffs: Agent[];
    public readonly maxHandoffDepth: number;

    /** Typed event emitter instance for runtime lifecycle events. */
    public readonly emitter: AgentEventEmitter;

    /**
     * Instantiates a new Agent instance.
     * 
     * @param config Agent configuration object.
     */
    constructor(config: AgentConfig) {
        if (!config || typeof config.name !== "string" || config.name.trim() === "") {
            throw new Error(
                `[AgentSDK Error] Missing required agent configuration "name".\n\n` +
                `What Happened: Agent was initialized without a valid string name.\n` +
                `Why: Every agent requires a distinct name identifier.\n` +
                `How to Fix: Pass a name property when creating an Agent (e.g. name: "AssistantAgent").`
            );
        }

        if (!config.apiKey || typeof config.apiKey !== "string" || config.apiKey.trim() === "") {
            throw new Error(
                `[AgentSDK Error] Missing required configuration "apiKey".\n\n` +
                `What Happened: Agent "${config.name}" was initialized without an API key.\n` +
                `Why: LLM provider authentication requires an API key.\n` +
                `How to Fix: Set apiKey: process.env.OPENAI_API_KEY when creating the Agent.`
            );
        }

        this.name = config.name.trim();
        this.instructions = config.instructions || "";
        this.model = config.model || "gpt-4o-mini";
        this.apiKey = config.apiKey.trim();
        this.provider = config.provider || "openai";
        this.streamSpeed = config.streamSpeed || "instant";
        this.maxIterations = config.maxIterations || 10;
        this.tools = config.tools || [];
        this.memory = config.memory;
        this.inputGuardrails = config.inputGuardrails;
        this.outputGuardrails = config.outputGuardrails;
        this.onApprovalRequired = config.onApprovalRequired;
        this.retries = config.retries !== undefined ? config.retries : 3;
        this.timeoutMs = config.timeoutMs !== undefined ? config.timeoutMs : 30000;
        this.maxToolLoopThreshold = config.maxToolLoopThreshold !== undefined ? config.maxToolLoopThreshold : 3;
        this.handoffs = config.handoffs || [];
        this.maxHandoffDepth = config.maxHandoffDepth !== undefined ? config.maxHandoffDepth : 5;

        // Initialize event emitter & attach config callbacks
        this.emitter = new AgentEventEmitter();

        if (config.onRunStart) this.emitter.on("onRunStart", config.onRunStart);
        if (config.onToolStart) this.emitter.on("onToolStart", config.onToolStart);
        if (config.onToolComplete) this.emitter.on("onToolComplete", config.onToolComplete);
        if (config.onHandoff) this.emitter.on("onHandoff", config.onHandoff);
        if (config.onGuardrail) this.emitter.on("onGuardrail", config.onGuardrail);
        if (config.onRunComplete) this.emitter.on("onRunComplete", config.onRunComplete);
        if (config.onRunFailed) this.emitter.on("onRunFailed", config.onRunFailed);
    }

    /**
     * Subscribes a listener to a runtime lifecycle event (`onRunStart`, `onToolStart`, `onToolComplete`, etc.).
     */
    public on<K extends AgentEventName>(event: K, listener: AgentEventListener<K>): this {
        this.emitter.on(event, listener);
        return this;
    }

    /**
     * Unsubscribes a listener from a runtime lifecycle event.
     */
    public off<K extends AgentEventName>(event: K, listener: AgentEventListener<K>): this {
        this.emitter.off(event, listener);
        return this;
    }

    /**
     * Synthesizes an executive summary AgentExplanation payload for an agent run result or SessionRecord.
     */
    public explain(sessionOrResult: SessionRecord | AgentRunResult): AgentExplanation {
        if (!sessionOrResult) {
            throw new Error(`[AgentSDK Error] Missing SessionRecord or AgentRunResult argument in agent.explain().`);
        }

        const session = "session" in sessionOrResult ? sessionOrResult.session : (sessionOrResult as SessionRecord);
        const handoffChain = "handoffChain" in sessionOrResult ? (sessionOrResult as AgentRunResult).handoffChain : undefined;

        return generateExplanation(session, { handoffChain });
    }

    /**
     * Reconstructs a step-by-step execution timeline array from a recorded SessionRecord or AgentRunResult.
     */
    public replay(sessionOrResult: SessionRecord | AgentRunResult): ReplayData {
        if (!sessionOrResult) {
            throw new Error(`[AgentSDK Error] Missing SessionRecord or AgentRunResult argument in agent.replay().`);
        }

        const session = "session" in sessionOrResult ? sessionOrResult.session : (sessionOrResult as SessionRecord);
        return reconstructReplay(session);
    }

    /**
     * Generates an evidence-based diagnostic DebugReport from a recorded SessionRecord or AgentRunResult.
     * 
     * @param sessionOrResult AgentRunResult object or SessionRecord flight recorder object.
     * @returns Structured DebugReport object.
     * 
     * @example
     * ```typescript
     * const debugReport = agent.debug(result);
     * console.log(debugReport.summary);
     * ```
     */
    public debug(sessionOrResult: SessionRecord | AgentRunResult): DebugReport {
        if (!sessionOrResult) {
            throw new Error(`[AgentSDK Error] Missing SessionRecord or AgentRunResult argument in agent.debug().`);
        }

        const session = "session" in sessionOrResult ? sessionOrResult.session : (sessionOrResult as SessionRecord);
        const handoffChain = "handoffChain" in sessionOrResult ? (sessionOrResult as AgentRunResult).handoffChain : undefined;

        return analyzeDebug(session, { handoffChain });
    }

    /**
     * Generates a standalone interactive HTML report document and optionally saves it to disk.
     */
    public async generateReport(
        sessionOrResult: SessionRecord | AgentRunResult,
        options?: ReportOptions
    ): Promise<string> {
        if (!sessionOrResult) {
            throw new Error(`[AgentSDK Error] Missing SessionRecord or AgentRunResult argument in agent.generateReport().`);
        }

        const session = "session" in sessionOrResult ? sessionOrResult.session : (sessionOrResult as SessionRecord);
        const handoffChain = "handoffChain" in sessionOrResult ? (sessionOrResult as AgentRunResult).handoffChain : undefined;
        const runId = "runId" in sessionOrResult ? (sessionOrResult as AgentRunResult).runId : undefined;

        return await saveHTMLReport(session, { ...options, handoffChain, runId });
    }

    /**
     * Executes an agent run with the given prompt input and optional sessionId.
     */
    public async run(options: AgentRunOptions): Promise<AgentRunResult> {
        if (!options || typeof options.input !== "string" || options.input.trim() === "") {
            throw new Error(
                `[AgentSDK Error] Missing required input prompt.\n\n` +
                `What Happened: You called agent.run() with an empty or missing input prompt.\n` +
                `Why: The agent requires a non-empty text prompt to execute.\n` +
                `How to Fix: Pass an input property: agent.run({ input: "Your prompt here" }).`
            );
        }

        return await runAgentLoop(this, options);
    }

    /**
     * Executes a structured output extraction run, guaranteeing that the response conforms strictly to a Zod schema.
     */
    public async runStructured<TSchema extends z.ZodTypeAny>(
        options: StructuredRunOptions<TSchema>
    ): Promise<StructuredRunResult<z.infer<TSchema>>> {
        if (!options || !options.schema) {
            throw new Error(
                `[AgentSDK Error] Missing required Zod schema parameter in runStructured().\n\n` +
                `What Happened: You called agent.runStructured() without providing a Zod schema.\n` +
                `Why: Structured extraction requires a valid Zod schema definition to validate output.\n` +
                `How to Fix: Pass a schema property: agent.runStructured({ input: "...", schema: MyZodSchema }).`
            );
        }

        if (!options.input || typeof options.input !== "string" || options.input.trim() === "") {
            throw new Error(
                `[AgentSDK Error] Missing required input prompt in runStructured().\n\n` +
                `What Happened: You called agent.runStructured() with an empty or missing input prompt.\n` +
                `Why: The agent requires a non-empty text prompt to extract structured data.\n` +
                `How to Fix: Pass an input property: agent.runStructured({ input: "Your text here", schema }).`
            );
        }

        return await executeStructuredOutput(this, options);
    }
}
