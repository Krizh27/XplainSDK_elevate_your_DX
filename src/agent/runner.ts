import { Agent } from "./agent.js";
import { AgentRunOptions, AgentRunResult, RunContext } from "./types.js";
import { AgentMessage } from "./memory/types.js";
import { loadSessionHistory, saveSessionHistory } from "./memory/memoryManager.js";
import { ExplainSDK } from "../client.js";

/**
 * @file agent/runner.ts
 * @description Pure functional agent execution loop orchestrator managing persistent memory sessions.
 */

/**
 * Executes the core agent completion loop, loading session history from storage adapters,
 * registering agent tools into ExplainSDK, and persisting updated history back to storage.
 * 
 * @param agent The target Agent instance.
 * @param options Run options containing user prompt input and optional sessionId.
 * @returns Promise resolving to normalized AgentRunResult payload.
 */
export async function runAgentLoop(
    agent: Agent,
    options: AgentRunOptions
): Promise<AgentRunResult> {
    const selectedModel = options.model || agent.model;
    const activeStreamSpeed = options.streamSpeed || agent.streamSpeed;

    // 1. Load session message history from memory storage adapter if sessionId is provided
    const existingHistory = await loadSessionHistory(agent.memory, options.sessionId);

    const runContext: RunContext = {
        sessionId: options.sessionId,
        input: options.input,
        history: existingHistory,
        model: selectedModel,
        streamSpeed: activeStreamSpeed,
        providerOptions: options.providerOptions
    };

    // 2. Initialize ExplainSDK client instance for DX & Observability
    const sdk = new ExplainSDK({
        provider: agent.provider,
        apiKey: agent.apiKey,
        model: selectedModel,
        streamSpeed: activeStreamSpeed
    });

    // 3. Register agent tools into ExplainSDK
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

    // 4. Construct message context incorporating System Instructions & Loaded History Turns
    const contextLines: string[] = [];

    if (agent.instructions && agent.instructions.trim() !== "") {
        contextLines.push(`[System Instructions: ${agent.instructions.trim()}]`);
    }

    if (runContext.history.length > 0) {
        contextLines.push("\n[Previous Conversation History]");
        for (const msg of runContext.history) {
            const roleLabel = msg.role === "user" ? "User" : msg.role === "assistant" ? "Assistant" : "System";
            contextLines.push(`${roleLabel}: ${msg.content}`);
        }
    }

    contextLines.push(`\nUser Input: ${options.input}`);
    const formattedPrompt = contextLines.join("\n");

    // 5. Delegate completion execution to ExplainSDK
    const response = await sdk.chat({
        input: formattedPrompt,
        model: selectedModel,
        streamSpeed: activeStreamSpeed,
        providerOptions: options.providerOptions
    });

    // 6. Build updated message history list
    const now = new Date().toISOString();
    const newUserMsg: AgentMessage = {
        role: "user",
        content: options.input,
        timestamp: now
    };
    const newAssistantMsg: AgentMessage = {
        role: "assistant",
        content: response.output_text,
        timestamp: now
    };

    const updatedHistory = [...runContext.history, newUserMsg, newAssistantMsg];

    // 7. Persist updated history back to storage adapter if sessionId is provided
    if (agent.memory && options.sessionId) {
        await saveSessionHistory(agent.memory, options.sessionId, updatedHistory);
    }

    return {
        output_text: response.output_text,
        session: response.session,
        iterations: 1,
        agentName: agent.name,
        history: updatedHistory
    };
}
