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
import { generateRunId } from "./events/emitter.js";
import { generateExplanation } from "./explain/explain.js";
import { formatExplainConsole, formatExplainMarkdown } from "./explain/formatter.js";
import { ExplainFunction } from "./explain/types.js";
import { reconstructReplay } from "./replay/replay.js";
import { formatReplayConsole, formatReplayMarkdown } from "./replay/formatter.js";
import { ReplayFunction } from "./replay/types.js";
import { generateHTMLReport, saveHTMLReport } from "./report/report.js";
import { ReportOptions, ReportFunction } from "./report/types.js";
import { XplainSDK } from "../client.js";

/**
 * @file agent/runner.ts
 * @description Pure functional agent execution loop orchestrator managing HTML Reports, Session Replay, Explain Mode, events, guardrails, resiliency, and memory sessions.
 */

/**
 * Executes the core agent completion loop, attaching HTML Report, Session Replay, and Explain Mode helpers, emitting lifecycle events,
 * enforcing input guardrails, transient error retries, request timeouts, tool cycle loop detection, and multi-agent handoffs.
 * 
 * @param agent The target Agent instance.
 * @param options Run options containing user prompt input, optional sessionId, runId, and handoffChain.
 * @returns Promise resolving to normalized AgentRunResult payload.
 */
export async function runAgentLoop(
    agent: Agent,
    options: AgentRunOptions
): Promise<AgentRunResult> {
    const startTime = Date.now();
    const runId = options.runId || generateRunId();
    const handoffChain: string[] = options.handoffChain || [agent.name];
    const timestamp = new Date().toISOString();

    // Emit "onRunStart" event
    await agent.emitter.emit("onRunStart", {
        runId,
        agentName: agent.name,
        input: options.input,
        sessionId: options.sessionId,
        timestamp
    });

    try {
        // 1. Run Input Guardrails BEFORE runtime loop starts
        let validatedInput = options.input;
        try {
            validatedInput = await runInputGuardrails(options.input, agent.name, agent.inputGuardrails);
            if (agent.inputGuardrails && agent.inputGuardrails.length > 0) {
                await agent.emitter.emit("onGuardrail", {
                    runId,
                    agentName: agent.name,
                    type: "input",
                    passed: true,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (guardrailErr: any) {
            await agent.emitter.emit("onGuardrail", {
                runId,
                agentName: agent.name,
                type: "input",
                passed: false,
                reason: guardrailErr.message,
                timestamp: new Date().toISOString()
            });
            throw guardrailErr;
        }

        const selectedModel = options.model || agent.model;
        const activeStreamSpeed = options.streamSpeed || agent.streamSpeed;

        // 2. Load session message history from memory storage adapter if sessionId is provided
        const existingHistory = await loadSessionHistory(agent.memory, options.sessionId);

        const runContext: RunContext = {
            runId: runId,
            sessionId: options.sessionId,
            input: validatedInput,
            history: existingHistory,
            model: selectedModel,
            streamSpeed: activeStreamSpeed,
            providerOptions: options.providerOptions,
            handoffChain: handoffChain
        };

        // 3. Initialize XplainSDK client instance for DX & Observability
        const sdk = new XplainSDK({
            provider: agent.provider,
            apiKey: agent.apiKey,
            model: selectedModel,
            streamSpeed: activeStreamSpeed
        });

        // Track tool call signatures executed during this run to detect loops
        const executedToolCalls: ToolCallSignature[] = [];
        let pendingHandoffTarget: Agent | null = null;
        let pendingHandoffReason: string | undefined = undefined;

        // 4. Register regular tools and Handoff transfer tools into XplainSDK
        const allTools = [...(agent.tools || [])];

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
                        const now = new Date().toISOString();

                        // Check if this tool execution is a Handoff Transfer request
                        if (tool.name.startsWith("transfer_to_")) {
                            const targetAgentName = tool.name.replace("transfer_to_", "");
                            const targetAgent = agent.handoffs.find(a => a.name === targetAgentName);

                            if (targetAgent) {
                                detectHandoffLoop(handoffChain, targetAgentName, agent.maxHandoffDepth);
                                pendingHandoffTarget = targetAgent;
                                pendingHandoffReason = args?.reason;

                                await agent.emitter.emit("onHandoff", {
                                    runId,
                                    fromAgent: agent.name,
                                    toAgent: targetAgentName,
                                    reason: args?.reason,
                                    timestamp: now
                                });

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

                        // Emit "onToolStart" event
                        await agent.emitter.emit("onToolStart", {
                            runId,
                            agentName: agent.name,
                            toolName: tool.name,
                            args: args || {},
                            timestamp: now
                        });

                        // Check Human-in-the-Loop approval
                        if (tool.requiresApproval) {
                            if (agent.onApprovalRequired) {
                                const isApproved = await agent.onApprovalRequired({
                                    toolName: tool.name,
                                    args: args,
                                    agentName: agent.name
                                });

                                if (!isApproved) {
                                    const denialMsg = `[Approval Denied] Execution of tool '${tool.name}' was explicitly denied by human operator. Please inform the user and proceed without executing this tool action.`;
                                    await agent.emitter.emit("onToolComplete", {
                                        runId,
                                        agentName: agent.name,
                                        toolName: tool.name,
                                        args: args || {},
                                        result: denialMsg,
                                        timestamp: new Date().toISOString()
                                    });
                                    return denialMsg;
                                }
                            }
                        }

                        // Execute actual tool function
                        const toolResult = await tool.execute(args);

                        // Emit "onToolComplete" event
                        await agent.emitter.emit("onToolComplete", {
                            runId,
                            agentName: agent.name,
                            toolName: tool.name,
                            args: args || {},
                            result: toolResult,
                            timestamp: new Date().toISOString()
                        });

                        return toolResult;
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

        // 6. Delegate completion execution turn to XplainSDK wrapped with Retry Engine & Timeout
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

            const now = new Date().toISOString();
            const transferUserMsg: AgentMessage = { role: "user", content: validatedInput, timestamp: now };
            const transferAssistMsg: AgentMessage = {
                role: "assistant",
                content: `[Handoff to ${targetAgent.name}] ${response.output_text}`,
                timestamp: now
            };
            const transferredHistory = [...runContext.history, transferUserMsg, transferAssistMsg];

            if (agent.memory && options.sessionId) {
                await saveSessionHistory(agent.memory, options.sessionId, transferredHistory);
            }

            const targetResult = await runAgentLoop(targetAgent, {
                input: options.input,
                sessionId: options.sessionId,
                model: options.model,
                streamSpeed: options.streamSpeed,
                providerOptions: options.providerOptions,
                runId: runId,
                handoffChain: newChain,
                explain: options.explain
            });

            return {
                runId: runId,
                output_text: targetResult.output_text,
                session: targetResult.session,
                iterations: targetResult.iterations + 1,
                agentName: agent.name,
                activeAgentName: targetResult.activeAgentName,
                handoffChain: newChain,
                history: targetResult.history,
                explanation: targetResult.explanation,
                explain: targetResult.explain,
                replay: targetResult.replay,
                report: targetResult.report
            };
        }

        // 8. Run Output Guardrails AFTER LLM completion generation
        let validatedOutput = response.output_text;
        try {
            validatedOutput = await runOutputGuardrails(response.output_text, agent.name, agent.outputGuardrails);
            if (agent.outputGuardrails && agent.outputGuardrails.length > 0) {
                await agent.emitter.emit("onGuardrail", {
                    runId,
                    agentName: agent.name,
                    type: "output",
                    passed: true,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (guardrailErr: any) {
            await agent.emitter.emit("onGuardrail", {
                runId,
                agentName: agent.name,
                type: "output",
                passed: false,
                reason: guardrailErr.message,
                timestamp: new Date().toISOString()
            });
            throw guardrailErr;
        }

        // 9. Build updated message history list
        const now = new Date().toISOString();
        const newUserMsg: AgentMessage = { role: "user", content: validatedInput, timestamp: now };
        const newAssistantMsg: AgentMessage = { role: "assistant", content: validatedOutput, timestamp: now };
        const updatedHistory = [...runContext.history, newUserMsg, newAssistantMsg];

        if (agent.memory && options.sessionId) {
            await saveSessionHistory(agent.memory, options.sessionId, updatedHistory);
        }

        const durationMs = Date.now() - startTime;

        // 10. Generate Explain Mode, Session Replay & HTML Report Telemetry Helpers
        const explanation = generateExplanation(response.session, { handoffChain, runId });

        const explainFn: ExplainFunction = Object.assign(
            () => {
                console.log(formatExplainConsole(explanation));
            },
            {
                markdown: () => formatExplainMarkdown(explanation),
                json: () => explanation
            }
        );

        if (options.explain) {
            explainFn();
        }

        const replayData = reconstructReplay(response.session);

        const replayFn: ReplayFunction = Object.assign(
            () => {
                console.log(formatReplayConsole(replayData));
            },
            {
                markdown: () => formatReplayMarkdown(replayData),
                json: () => replayData
            }
        );

        const reportFn: ReportFunction = Object.assign(
            async (opts?: ReportOptions) => {
                const targetPath = opts?.outputPath || "./report.html";
                return await saveHTMLReport(response.session, { ...opts, outputPath: targetPath, handoffChain, runId });
            },
            {
                html: () => generateHTMLReport(response.session, { handoffChain, runId })
            }
        );

        // Emit "onRunComplete" event
        await agent.emitter.emit("onRunComplete", {
            runId,
            agentName: agent.name,
            output_text: validatedOutput,
            session: response.session,
            durationMs,
            timestamp: new Date().toISOString()
        });

        return {
            runId: runId,
            output_text: validatedOutput,
            session: response.session,
            iterations: 1,
            agentName: agent.name,
            activeAgentName: agent.name,
            handoffChain: handoffChain,
            history: updatedHistory,
            explanation: explanation,
            explain: explainFn,
            replay: replayFn,
            report: reportFn
        };

    } catch (error: any) {
        // Emit "onRunFailed" event
        await agent.emitter.emit("onRunFailed", {
            runId,
            agentName: agent.name,
            error: error instanceof Error ? error : new Error(String(error)),
            timestamp: new Date().toISOString()
        });
        throw error;
    }
}
