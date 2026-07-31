import { AgentConfig, AgentRunOptions, AgentRunResult, AgentTool } from "./types.js";
import { runAgentLoop } from "./runner.js";

/**
 * @class Agent
 * @description Primary declarative entity in Agent SDK representing an AI Agent.
 * 
 * An `Agent` encapsulates an agent identity name, system instructions, model,
 * tools, and provider options. Execution is delegated to `runAgentLoop()` which
 * uses ExplainSDK under the hood for request timelines, cost tracking, and flight recording.
 * 
 * @example
 * ```typescript
 * const agent = new Agent({
 *   name: "AssistantAgent",
 *   instructions: "You are a helpful assistant.",
 *   model: "gpt-4o-mini",
 *   apiKey: process.env.OPENAI_API_KEY
 * });
 * 
 * const result = await agent.run({ input: "Hello!" });
 * console.log(result.output_text);
 * ```
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
    }

    /**
     * Executes an agent run with the given prompt input.
     * 
     * @param options Run options containing user `input` string and optional overrides.
     * @returns Promise resolving to `AgentRunResult` containing output text and ExplainSDK `session`.
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
}
