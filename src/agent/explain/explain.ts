import { SessionRecord } from "../../types.js";
import { inspectPerformance } from "../../inspectors/performance.js";
import { inspectCost } from "../../inspectors/cost.js";
import { inspectTools } from "../../inspectors/tools.js";
import { inspectPrompt } from "../../inspectors/prompt.js";
import { inspectBehavior } from "../../inspectors/behavior.js";
import { AgentExplanation } from "./types.js";

/**
 * @file agent/explain/explain.ts
 * @description Pure orchestrator function synthesizing ExplainSDK Inspectors into a structured AgentExplanation payload.
 * 
 * ARCHITECTURAL DESIGN PRINCIPLE:
 * Explain Mode CONSUMES information produced by existing inspectors.
 * It does NOT collect information or re-implement timeline tracking or performance calculations.
 */

/**
 * Synthesizes telemetry from ExplainSDK's Performance, Cost, Tools, Prompt Advisor, and Behavior Advisor
 * into a structured AgentExplanation payload.
 * 
 * @param session SessionRecord flight recorder object.
 * @param options Optional execution details like delegation handoffChain.
 * @returns Strongly typed AgentExplanation object.
 */
export function generateExplanation(
    session: SessionRecord,
    options?: { handoffChain?: string[]; runId?: string }
): AgentExplanation {
    // 1. Consume telemetry from ExplainSDK pure inspectors
    const perf = inspectPerformance(session);
    const cost = inspectCost(session);
    const toolsData = inspectTools(session);
    const promptData = inspectPrompt(session);
    const behaviorData = inspectBehavior(session);

    // 2. Synthesize Tool Executions list
    const toolSummaries: string[] = [];
    if (toolsData.totalToolsExecuted > 0) {
        for (const exec of toolsData.executions) {
            const statusSymbol = exec.status === "Success" ? "✓" : "✗";
            toolSummaries.push(`${statusSymbol} Executed tool "${exec.toolName}()" in ${exec.durationMs} ms`);
        }
    }

    // 3. Synthesize Multi-Agent Handoffs
    const handoffSummaries: string[] = [];
    if (options?.handoffChain && options.handoffChain.length > 1) {
        handoffSummaries.push(`Delegation Chain: ${options.handoffChain.join(" -> ")}`);
    }

    // 4. Synthesize Decisions
    const decisions: string[] = [];
    if (toolsData.totalToolsExecuted > 0) {
        decisions.push(`Selected and executed ${toolsData.totalToolsExecuted} tool call(s) to fulfill request context.`);
    } else {
        decisions.push("Generated direct text response without invoking external tools.");
    }

    // 5. Synthesize Observations from Behavior Advisor
    const observations: string[] = [];
    if (behaviorData.observations && behaviorData.observations.length > 0) {
        for (const obs of behaviorData.observations) {
            observations.push(`[${obs.confidence} Confidence] ${obs.fact}: ${obs.possibleCause}`);
        }
    }

    // 6. Synthesize Recommendations from Prompt & Behavior Advisors (reusing existing advice)
    const recommendations: string[] = [];

    if (promptData.suggestions && promptData.suggestions.length > 0) {
        for (const sug of promptData.suggestions) {
            recommendations.push(`Prompt Advisor: ${sug}`);
        }
    }

    if (behaviorData.observations && behaviorData.observations.length > 0) {
        for (const obs of behaviorData.observations) {
            if (obs.suggestion) {
                recommendations.push(`Behavior Advisor: ${obs.suggestion}`);
            }
        }
    }

    // 7. Synthesize Executive Summary Paragraph
    const summaryParts: string[] = [];
    summaryParts.push(`The model processed the request in ${perf.latencyMs} ms utilizing ${session.tokenUsage.total_tokens} total tokens.`);

    if (toolsData.totalToolsExecuted > 0) {
        const toolNames = toolsData.executions.map(t => t.toolName).join(", ");
        summaryParts.push(`It decided to invoke ${toolsData.totalToolsExecuted} tool(s) (${toolNames}).`);
    } else {
        summaryParts.push("It responded directly without requiring tool execution.");
    }

    if (options?.handoffChain && options.handoffChain.length > 1) {
        summaryParts.push(`Conversation control was handed off across: ${options.handoffChain.join(" -> ")}.`);
    }

    if (recommendations.length > 0) {
        summaryParts.push(`Advisors identified ${recommendations.length} optimization recommendation(s).`);
    } else {
        summaryParts.push("No unexpected behavioral anomalies or prompt issues were detected.");
    }

    const summary = summaryParts.join(" ");

    // 8. Determine overall explanation confidence
    let confidence: "high" | "medium" | "low" = "high";
    if (behaviorData.hasAnomalies) {
        confidence = "medium";
    }

    return {
        summary,
        decisions,
        tools: toolSummaries,
        handoffs: handoffSummaries,
        guardrails: [],
        retries: [],
        observations,
        recommendations,
        confidence,
        metrics: {
            durationMs: perf.latencyMs,
            totalTokens: session.tokenUsage.total_tokens,
            formattedCost: cost.formattedCost
        }
    };
}
