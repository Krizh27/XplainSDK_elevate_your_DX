import { ExplainSDKOptions, ChatOptions, ChatResponse, ToolDefinition, StreamSpeedPreset, StreamRenderingOptions, SessionRecord } from "./types.js";
import { handleChat, handleStream } from "./chat.js";
import { createToolRegistry, registerToolInRegistry, ToolRegistry } from "./tools.js";
import { inspectTimeline, inspectPerformance, inspectTokens, inspectCost, inspectTools, inspectPrompt, inspectBehavior } from "./inspectors/index.js";

/**
 * @class ExplainSDK
 * @description Main client entry point for ExplainSDK.
 * 
 * `ExplainSDK` is the ONLY CLASS in the SDK codebase.
 * It provides an educational, zero-abstraction DX Layer on top of LLM APIs.
 * It includes an Inspector Framework (`sdk.inspect.behavior`, `sdk.inspect.prompt`, etc.),
 * Session Flight Recording, Stream Rendering Speed controls, and Tool Call Inspection.
 * 
 * @example
 * ```typescript
 * import { ExplainSDK } from "explainsdk";
 * 
 * const sdk = new ExplainSDK({
 *   apiKey: process.env.OPENAI_API_KEY,
 *   model: "gpt-4o-mini"
 * });
 * 
 * const result = await sdk.chat({ input: "What was the ability of Pinocchio?" });
 * const behaviorData = sdk.inspect.behavior(result.session);
 * console.log(behaviorData.summary);
 * ```
 */
export class ExplainSDK {
    private provider: string;
    private apiKey: string;
    private defaultModel: string;
    private defaultStreamSpeed?: StreamSpeedPreset;
    private defaultStreamDelayMs?: number;
    private defaultRendering?: StreamRenderingOptions;
    private toolRegistry: ToolRegistry;

    /**
     * Instantiates a new `ExplainSDK` client instance.
     * 
     * @param options Configuration options including `apiKey`, `provider`, default `model`, and default stream rendering settings.
     * @throws Actionable diagnostic error if `apiKey` is missing or invalid.
     */
    constructor(options: ExplainSDKOptions) {
        if (!options || typeof options.apiKey !== "string" || options.apiKey.trim() === "") {
            throw new Error(
                `[ExplainSDK Error] Missing required configuration option "apiKey".\n\n` +
                `What Happened: ExplainSDK was initialized without a valid API key string.\n` +
                `Why: Authentication with AI provider APIs requires a valid API key.\n` +
                `How to Fix: Pass your API key when instantiating ExplainSDK:\n\n` +
                `  const sdk = new ExplainSDK({\n` +
                `    apiKey: process.env.OPENAI_API_KEY || "sk-your-key-here"\n` +
                `  });\n`
            );
        }

        this.provider = options.provider || "openai";
        this.apiKey = options.apiKey.trim();
        this.defaultModel = options.model || "gpt-4o-mini";
        this.defaultStreamSpeed = options.streamSpeed;
        this.defaultStreamDelayMs = options.streamDelayMs;
        this.defaultRendering = options.rendering;
        this.toolRegistry = createToolRegistry();
    }

    /**
     * The Inspector Framework gateway exposing specialized pure-function inspectors.
     * 
     * Each inspector receives a `SessionRecord` object and returns pure, structured inspection data.
     * 
     * @example
     * ```typescript
     * const result = await sdk.chat({ input: "Hello" });
     * 
     * const behaviorData = sdk.inspect.behavior(result.session);
     * const promptData   = sdk.inspect.prompt(result.session);
     * const timelineData = sdk.inspect.timeline(result.session);
     * const perfData     = sdk.inspect.performance(result.session);
     * const tokenData    = sdk.inspect.tokens(result.session);
     * const costData     = sdk.inspect.cost(result.session);
     * const toolData     = sdk.inspect.tools(result.session);
     * ```
     */
    public get inspect() {
        return {
            /** Inspects post-execution runtime behavior, tool selection mismatches, ignored format constraints, and high latency. */
            behavior: (session: SessionRecord) => inspectBehavior(session),

            /** Inspects prompt structure, providing category evaluations, strengths, suggestions, and diff comparison. */
            prompt: (session: SessionRecord) => inspectPrompt(session),

            /** Inspects timeline events recorded during a session. */
            timeline: (session: SessionRecord) => inspectTimeline(session),

            /** Inspects latency, text metrics, and performance health status. */
            performance: (session: SessionRecord) => inspectPerformance(session),

            /** Inspects prompt tokens, completion tokens, and total tokens. */
            tokens: (session: SessionRecord) => inspectTokens(session),

            /** Inspects estimated API dollar cost. */
            cost: (session: SessionRecord) => inspectCost(session),

            /** Inspects tool executions, parameters, durations, and outputs. */
            tools: (session: SessionRecord) => inspectTools(session),

            /** Convenience helper returning all structured inspection objects at once. */
            all: (session: SessionRecord) => ({
                behavior: inspectBehavior(session),
                prompt: inspectPrompt(session),
                timeline: inspectTimeline(session),
                performance: inspectPerformance(session),
                tokens: inspectTokens(session),
                cost: inspectCost(session),
                tools: inspectTools(session)
            })
        };
    }

    /**
     * Registers a custom tool function that the LLM model can inspect and execute.
     */
    public registerTool<TArgs = Record<string, any>, TResult = any>(tool: ToolDefinition<TArgs, TResult>): void {
        if (!tool || typeof tool.name !== "string" || tool.name.trim() === "") {
            throw new Error(
                `[ExplainSDK Error] Cannot register tool with missing or invalid name.\n\n` +
                `What Happened: You called sdk.registerTool() with an invalid tool object.\n` +
                `Why: ExplainSDK requires every tool to have a unique string name.\n` +
                `How to Fix: Provide a valid name property (e.g. name: "weather").`
            );
        }

        if (typeof tool.execute !== "function") {
            throw new Error(
                `[ExplainSDK Error] Cannot register tool "${tool.name}" without an execute function.\n\n` +
                `What Happened: The tool "${tool.name}" is missing an execute handler function.\n` +
                `Why: ExplainSDK requires an executable function to invoke when the model calls this tool.\n` +
                `How to Fix: Add an execute async function property to your tool definition.`
            );
        }

        registerToolInRegistry(this.toolRegistry, tool as any);
    }

    /**
     * Sends a non-streaming chat prompt to the LLM model.
     */
    public async chat(options: ChatOptions): Promise<ChatResponse> {
        if (!options || typeof options.input !== "string" || options.input.trim() === "") {
            throw new Error(
                `[ExplainSDK Error] Missing required input prompt.\n\n` +
                `What Happened: You called sdk.chat() with an empty or missing input prompt.\n` +
                `Why: The AI model requires a non-empty text prompt string to generate a response.\n` +
                `How to Fix: Pass an input property to sdk.chat({ input: "Your prompt here" }).`
            );
        }

        return await handleChat(
            this.provider,
            this.apiKey,
            this.defaultModel,
            options,
            this.toolRegistry
        );
    }

    /**
     * Sends a real-time streaming chat prompt to the LLM model.
     */
    public async stream(options: ChatOptions): Promise<ChatResponse> {
        if (!options || typeof options.input !== "string" || options.input.trim() === "") {
            throw new Error(
                `[ExplainSDK Error] Missing required input prompt for streaming.\n\n` +
                `What Happened: You called sdk.stream() with an empty or missing input prompt.\n` +
                `Why: The AI model requires a non-empty text prompt string to stream responses.\n` +
                `How to Fix: Pass an input property to sdk.stream({ input: "Your prompt here" }).`
            );
        }

        const defaultSettings = {
            streamSpeed: this.defaultStreamSpeed,
            streamDelayMs: this.defaultStreamDelayMs,
            rendering: this.defaultRendering
        };

        return await handleStream(
            this.provider,
            this.apiKey,
            this.defaultModel,
            options,
            defaultSettings,
            this.toolRegistry
        );
    }
}
