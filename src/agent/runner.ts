import { Agent } from "./agent.js";
import { AgentRunOptions, AgentRunResult, RunContext } from "./types.js";
import { AgentMessage } from "./memory/types.js";
import { loadSessionHistory, saveSessionHistory } from "./memory/memoryManager.js";
import { runInputGuardrails, runOutputGuardrails } from "./guardrails/pipeline.js";
import { withRetryAndTimeout } from "./resiliency/retry.js";
import { detectToolLoop } from "./resiliency/loopDetector.js";
import { ToolCallSignature } from "./resiliency/types.js";
import { createHandoffTool } from "./handoff/tool.js";
import { detectHandoffLoop } from "./handoff/resolver.js";
import { ExplainSDK } from "../client.js";

/**
 * @file agent/runner.ts
 * @description Pure functional agent execution loop orchestrator managing multi-agent handoffs, guardrails, resiliency, and memory sessions.
 */

/**
 * Executes the core agent completion loop, enforcing input guardrails, transient error retries,
 * request timeouts, tool cycle loop detection, multi-agent handoffs, and output guardrails.
 * 
 * @param agent The target Agent instance.
 * @param options Run options containing user prompt input, optional sessionId, and handoffChain.
 * @returns Promise resolving to normalized AgentRunResult payload.
 */
export async function runAgentLoop(
    agent: Agent,
    options: AgentRunOptions
): Promise<AgentRunResult> {
    // Maintain delegation stack chain
    const handoffChain: string[] = options.handoffChain || [agent.name];

    // 1. Run Input Guardrails BEFORE runtime loop starts (Fail Fast, Zero Retries)
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
        providerOptions: options.providerOptions,
        handoffChain: handoffChain
    };

    // 3. Initialize ExplainSDK client instance for DX & Observability
    const sdk = new ExplainSDK({
        provider: agent.provider,
        apiKey: agent.apiKey,
        model: selectedModel,
        streamSpeed: activeStreamSpeed
    });

    // Track tool call signatures executed during this run to detect loops
    const executedToolCalls: ToolCallSignature[] = [];
    let pendingHandoffTarget: Agent | null = null;
    let pendingHandoffReason: string | undefined = undefined;

    // 4. Register regular tools and Handoff transfer tools into ExplainSDK
    const allTools = [...(agent.tools || [])];

    // Auto-generate transfer tools for target handoff agents
    if (agent.handoffs && agent.handoffs.length > 0) {
        for (const targetAgent of agent.handoffs) {
            allTools.push(createHandoffTool(targetAgent));
        }
    }

    if (allTools.length > 0) {
        for (const tool of allTools) {
            sdk.registerTool({
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
                execute: async (args: any) => {
                    // Check if this tool execution is a Handoff Transfer request
                    if (tool.name.startsWith("transfer_to_")) {
                        const targetAgentName = tool.name.replace("transfer_to_", "");
                        const targetAgent = agent.handoffs.find(a => a.name === targetAgentName);

                        if (targetAgent) {
                            // Check for Handoff Cycle Loops & Depth Bounds
                            detectHandoffLoop(handoffChain, targetAgentName, agent.maxHandoffDepth);
                            pendingHandoffTarget = targetAgent;
                            pendingHandoffReason = args?.reason;

                            return `[Handoff Initiated] Successfully transferring conversation control from '${agent.name}' to '${targetAgentName}'.`;
                        }
                    }

                    const currentToolCall: ToolCallSignature = {
                        toolName: tool.name,
                        args: args || {}
                    };

                    // Detect tool cycle loops BEFORE execution
                    detectToolLoop(executedToolCalls, currentToolCall, agent.maxToolLoopThreshold);
                    executedToolCalls.push(currentToolCall);

                    // Check Human-in-the-Loop approval
                    if (tool.requiresApproval) {
                        if (agent.onApprovalRequired) {
                            const isApproved = await agent.onApprovalRequired({
                                toolName: tool.name,
                                args: args,
                                agentName: agent.name
                            });

                            if (!isApproved) {
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

    // 6. Delegate completion execution turn to ExplainSDK wrapped with Retry Engine & Timeout
    const response = await withRetryAndTimeout(
        async () => {
            return await sdk.chat({
                input: formattedPrompt,
                model: selectedModel,
                streamSpeed: activeStreamSpeed,
                providerOptions: options.providerOptions
            });
        },
        {
            retries: agent.retries,
            timeoutMs: agent.timeoutMs
        },
        `Agent "${agent.name}" LLM Request`
    );

    // 7. Handle Multi-Agent Handoff Execution Transfer if triggered
    if (pendingHandoffTarget) {
        const targetAgent: Agent = pendingHandoffTarget;
        const newChain = [...handoffChain, targetAgent.name];

        // Build current history message context for transfer
        const now = new Date().toISOString();
        const transferUserMsg: AgentMessage = { role: "user", content: validatedInput, timestamp: now };
        const transferAssistMsg: AgentMessage = {
            role: "assistant",
            content: `[Handoff to ${targetAgent.name}] ${response.output_text}`,
            timestamp: now
        };
        const transferredHistory = [...runContext.history, transferUserMsg, transferAssistMsg];

        // Persist history turn before handoff transfer
        if (agent.memory && options.sessionId) {
            await saveSessionHistory(agent.memory, options.sessionId, transferredHistory);
        }

        // Transfer execution to target agent seamlessly
        const targetResult = await runAgentLoop(targetAgent, {
            input: options.input,
            sessionId: options.sessionId,
            model: options.model,
            streamSpeed: options.streamSpeed,
            providerOptions: options.providerOptions,
            handoffChain: newChain
        });

        return {
            output_text: targetResult.output_text,
            session: targetResult.session,
            iterations: targetResult.iterations + 1,
            agentName: agent.name,
            activeAgentName: targetResult.activeAgentName,
            handoffChain: newChain,
            history: targetResult.history
        };
    }

    // 8. Run Output Guardrails AFTER LLM completion generation
    const validatedOutput = await runOutputGuardrails(response.output_text, agent.name, agent.outputGuardrails);

    // 9. Build updated message history list
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

    // 10. Persist updated history back to storage adapter if sessionId is provided
    if (agent.memory && options.sessionId) {
        await saveSessionHistory(agent.memory, options.sessionId, updatedHistory);
    }

    return {
        output_text: validatedOutput,
        session: response.session,
        iterations: 1,
        agentName: agent.name,
        activeAgentName: agent.name,
        handoffChain: handoffChain,
        history: updatedHistory
    };
}
