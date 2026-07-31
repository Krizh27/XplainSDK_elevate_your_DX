import { SessionRecord } from "../../types.js";
import { inspectPerformance } from "../../inspectors/performance.js";
import { inspectCost } from "../../inspectors/cost.js";
import { inspectTools } from "../../inspectors/tools.js";
import { inspectPrompt } from "../../inspectors/prompt.js";
import { inspectBehavior } from "../../inspectors/behavior.js";
import { DebugReport, NextInspectionRecommendation } from "./types.js";

/**
 * @file agent/debug/debug.ts
 * @description Pure orchestrator function synthesizing SessionRecord telemetry into evidence-based DebugReport diagnostics.
 * 
 * ARCHITECTURAL DESIGN PRINCIPLE:
 * Smart Debug Assistant CONSUMES information from existing inspectors.
 * It NEVER fabricates explanations, invents unevidenced recommendations, or duplicates inspector logic.
 */

/**
 * Analyzes a SessionRecord flight recorder object to produce an evidence-based DebugReport.
 * 
 * @param session SessionRecord flight recorder object.
 * @param options Optional execution details like delegation handoffChain.
 * @returns Strongly typed DebugReport object.
 */
export function analyzeDebug(
    session: SessionRecord,
    options?: { handoffChain?: string[]; runId?: string }
): DebugReport {
    const perf = inspectPerformance(session);
    const cost = inspectCost(session);
    const toolsData = inspectTools(session);
    const promptData = inspectPrompt(session);
    const behaviorData = inspectBehavior(session);

    const detectedIssues: string[] = [];
    const suggestions: string[] = [];
    const nextInspections: NextInspectionRecommendation[] = [];
    const learningTips: string[] = [];
    const warnings: string[] = [];

    // 1. Analyze Tool Execution Telemetry
    if (toolsData.totalToolsExecuted > 0) {
        let failedToolsCount = 0;
        for (const exec of toolsData.executions) {
            if (exec.status === "Failed") {
                failedToolsCount++;
                detectedIssues.push(`Tool "${exec.toolName}()" failed during execution with error: "${exec.returned}".`);
            }
        }

        if (failedToolsCount > 0) {
            nextInspections.push({
                target: "Tool Inspector",
                reason: `${failedToolsCount} tool execution(s) failed or threw errors.`,
                command: "const toolData = sdk.inspect.tools(result.session);"
            });
            learningTips.push("Tools return error strings to the LLM so the model can attempt alternative actions or inform the user.");
        } else {
            learningTips.push("The model selected and executed tools based on matching descriptions to prompt intent.");
        }
    }

    // 2. Analyze Performance & Latency Telemetry
    if (perf.latencyMs > 2500) {
        detectedIssues.push(`High request latency detected (${perf.latencyMs} ms total duration).`);
        nextInspections.push({
            target: "Performance Inspector",
            reason: `Total request duration exceeded 2.5 seconds (${perf.latencyMs} ms).`,
            command: "const perfData = sdk.inspect.performance(result.session);"
        });
        learningTips.push("Latency is driven by token count, network round-trips, and tool execution durations.");
    }

    // 3. Analyze Prompt Structure Telemetry (Reusing Prompt Advisor)
    if (promptData.suggestions && promptData.suggestions.length > 0) {
        for (const sug of promptData.suggestions) {
            suggestions.push(`Prompt Advisor: ${sug}`);
        }

        nextInspections.push({
            target: "Prompt Advisor",
            reason: "Prompt Advisor identified clarity or specificity improvement opportunities.",
            command: "const promptData = sdk.inspect.prompt(result.session);"
        });
    }

    // 4. Analyze Behavioral Telemetry (Reusing Behavior Advisor)
    if (behaviorData.hasAnomalies && behaviorData.observations) {
        for (const obs of behaviorData.observations) {
            detectedIssues.push(`Behavioral Anomaly [${obs.category}]: ${obs.fact}.`);
            if (obs.suggestion) {
                suggestions.push(`Behavior Advisor: ${obs.suggestion}`);
            }
        }

        nextInspections.push({
            target: "Behavior Advisor",
            reason: "Behavior Advisor detected unexpected tool selection or format mismatches.",
            command: "const behaviorData = sdk.inspect.behavior(result.session);"
        });
    }

    // Default next inspection recommendation if none triggered
    if (nextInspections.length === 0) {
        nextInspections.push({
            target: "Performance Inspector",
            reason: "Execution completed cleanly. Inspect performance and token metrics.",
            command: "const perfData = sdk.inspect.performance(result.session);"
        });
        learningTips.push("Regular inspection of token usage helps optimize API dollar costs.");
    }

    // Build Executive Diagnostic Summary
    const summaryParts: string[] = [];
    summaryParts.push(`Request processed in ${perf.latencyMs} ms utilizing ${session.tokenUsage.total_tokens} tokens ($${cost.formattedCost}).`);

    if (detectedIssues.length > 0) {
        summaryParts.push(`Smart Debug Assistant identified ${detectedIssues.length} issue(s) requiring attention.`);
    } else {
        summaryParts.push("No critical anomalies or failures were detected during execution.");
    }

    const summary = summaryParts.join(" ");

    // Determine confidence level
    let confidence: "high" | "medium" | "low" = "high";
    if (detectedIssues.length > 0) {
        confidence = "medium";
    }

    return {
        summary,
        detectedIssues,
        suggestions,
        nextInspections,
        learningTips,
        warnings,
        confidence
    };
}
