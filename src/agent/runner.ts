import { Agent } from "./agent.js";
import { AgentRunOptions, AgentRunResult, RunContext } from "./types.js";
import { AgentMessage } from "./memory/types.js";
import { loadSessionHistory, saveSessionHistory } from "./memory/memoryManager.js";
import { runInputGuardrails, runOutputGuardrails } from "./guardrails/pipeline.js";
import { ExplainSDK } from "../client.js";

/**
 * @file agent/runner.ts
 * @description Pure functional agent execution loop orchestrator managing guardrails, human approval callbacks, and persistent memory sessions.
 */

/**
 * Executes the core agent completion loop, enforcing input guardrails before start,
 * handling Human-in-the-Loop tool approvals, and enforcing output guardrails before completion.
 * 
 * @param agent The target Agent instance.
 * @param options Run options containing user prompt input and optional sessionId.
 * @returns Promise resolving to normalized AgentRunResult payload.
 */
export async function runAgentLoop(
    agent: Agent,
    options: AgentRunOptions
): Promise<AgentRunResult> {
    // 1. Run Input Guardrails BEFORE runtime loop starts
    const validatedInput = await runInputGuardrails(options.input, agent.name, agent.inputGuardrails);

    const selectedModel = options.model || agent.model;
    const activeStreamSpeed = options.streamSpeed || agent.streamSpeed;

    // 2. Load session message history from memory storage adapter if sessionId is provided
    const existingHistory = await loadSessionHistory(agent.memory, options.sessionId);

    const runContext: RunContext = {
        sessionId: options.sessionId,
        input: validatedInput,
        history: existingHistory,
        model: selectedModel,
        streamSpeed: activeStreamSpeed,
        providerOptions: options.providerOptions
    };

    // 3. Initialize ExplainSDK client instance for DX & Observability
    const sdk = new ExplainSDK({
        provider: agent.provider,
        apiKey: agent.apiKey,
        model: selectedModel,
        streamSpeed: activeStreamSpeed
    });

    // 4. Register agent tools into ExplainSDK with Human-in-the-Loop Approval wrappers
    if (agent.tools && agent.tools.length > 0) {
        for (const tool of agent.tools) {
            sdk.registerTool({
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
                execute: async (args: any) => {
                    // Check if human approval is required
                    if (tool.requiresApproval) {
                        if (agent.onApprovalRequired) {
                            const isApproved = await agent.onApprovalRequired({
                                toolName: tool.name,
                                args: args,
                                agentName: agent.name
                            });

                            if (!isApproved) {
                                // Safe rejection: return message to model without crashing conversation
                                return `[Approval Denied] Execution of tool '${tool.name}' was explicitly denied by human operator. Please inform the user and proceed without executing this tool action.`;
                            }
                        }
                    }

                    return await tool.execute(args);
                }
            });
        }
    }

    // 5. Construct message context incorporating System Instructions & Loaded History Turns
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

    contextLines.push(`\nUser Input: ${validatedInput}`);
    const formattedPrompt = contextLines.join("\n");

    // 6. Delegate completion execution turn to ExplainSDK
    const response = await sdk.chat({
        input: formattedPrompt,
        model: selectedModel,
        streamSpeed: activeStreamSpeed,
        providerOptions: options.providerOptions
    });

    // 7. Run Output Guardrails AFTER LLM completion generation
    const validatedOutput = await runOutputGuardrails(response.output_text, agent.name, agent.outputGuardrails);

    // 8. Build updated message history list
    const now = new Date().toISOString();
    const newUserMsg: AgentMessage = {
        role: "user",
        content: validatedInput,
        timestamp: now
    };
    const newAssistantMsg: AgentMessage = {
        role: "assistant",
        content: validatedOutput,
        timestamp: now
    };

    const updatedHistory = [...runContext.history, newUserMsg, newAssistantMsg];

    // 9. Persist updated history back to storage adapter if sessionId is provided
    if (agent.memory && options.sessionId) {
        await saveSessionHistory(agent.memory, options.sessionId, updatedHistory);
    }

    return {
        output_text: validatedOutput,
        session: response.session,
        iterations: 1,
        agentName: agent.name,
        history: updatedHistory
    };
}
