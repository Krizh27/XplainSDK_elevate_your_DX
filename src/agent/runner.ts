import { Agent } from "./agent.js";
import { AgentRunOptions, AgentRunResult } from "./types.js";
import { ExplainSDK } from "../client.js";

/**
 * @file agent/runner.ts
 * @description Pure functional agent execution loop orchestrator delegating to ExplainSDK.
 */

/**
 * Executes the core agent completion loop, registering agent tools into ExplainSDK
 * and managing execution turns until a final output text is produced or maxIterations is reached.
 * 
 * @param agent The target Agent instance.
 * @param options Run options containing user prompt input.
 * @returns Promise resolving to normalized AgentRunResult payload.
 */
export async function runAgentLoop(
    agent: Agent,
    options: AgentRunOptions
): Promise<AgentRunResult> {
    const selectedModel = options.model || agent.model;
    const activeStreamSpeed = options.streamSpeed || agent.streamSpeed;

    // 1. Initialize underlying ExplainSDK client instance for DX & Observability
    const sdk = new ExplainSDK({
        provider: agent.provider,
        apiKey: agent.apiKey,
        model: selectedModel,
        streamSpeed: activeStreamSpeed
    });

    // 2. Register agent tools into ExplainSDK
    if (agent.tools && agent.tools.length > 0) {
        for (const tool of agent.tools) {
            sdk.registerTool({
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
                execute: tool.execute
            });
        }
    }

    // 3. Prepare systemic prompt incorporating agent instructions
    let formattedPrompt = options.input;
    if (agent.instructions && agent.instructions.trim() !== "") {
        formattedPrompt = `[System Instructions: ${agent.instructions.trim()}]\n\nUser Input: ${options.input}`;
    }

    // 4. Delegate execution turn to ExplainSDK
    const response = await sdk.chat({
        input: formattedPrompt,
        model: selectedModel,
        streamSpeed: activeStreamSpeed,
        providerOptions: options.providerOptions
    });

    return {
        output_text: response.output_text,
        session: response.session,
        iterations: 1,
        agentName: agent.name
    };
}
