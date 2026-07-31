import { AgentExplanation } from "./types.js";

/**
 * @file agent/explain/formatter.ts
 * @description Isolated presentation layer for formatting AgentExplanation data into Terminal Console output or Markdown reports.
 */

/**
 * Renders a structured AgentExplanation payload into a clean, human-readable terminal text box.
 * 
 * @param explanation AgentExplanation object.
 * @returns Formatted console text block string.
 */
export function formatExplainConsole(explanation: AgentExplanation): string {
    const divider = "────────────────────────────────────────────────────────────";
    const lines: string[] = [];

    lines.push(divider);
    lines.push("🧠 Explain Mode Execution Summary");
    lines.push(divider);
    lines.push("");
    lines.push("Summary");
    lines.push(explanation.summary);
    lines.push("");

    lines.push("Performance & Cost");
    lines.push(`• Duration:       ${explanation.metrics.durationMs} ms`);
    lines.push(`• Total Tokens:   ${explanation.metrics.totalTokens}`);
    lines.push(`• Estimated Cost: ${explanation.metrics.formattedCost}`);
    lines.push("");

    if (explanation.tools.length > 0) {
        lines.push("Tool Executions");
        for (const toolStr of explanation.tools) {
            lines.push(`  ${toolStr}`);
        }
        lines.push("");
    }

    if (explanation.handoffs.length > 0) {
        lines.push("Multi-Agent Handoffs");
        for (const handoffStr of explanation.handoffs) {
            lines.push(`  ${handoffStr}`);
        }
        lines.push("");
    }

    if (explanation.guardrails.length > 0) {
        lines.push("Guardrails Evaluated");
        for (const g of explanation.guardrails) {
            lines.push(`  ${g}`);
        }
        lines.push("");
    }

    if (explanation.observations.length > 0) {
        lines.push("Behavior Observations");
        for (const obs of explanation.observations) {
            lines.push(`  ${obs}`);
        }
        lines.push("");
    }

    if (explanation.recommendations.length > 0) {
        lines.push("Advisory Recommendations");
        for (const rec of explanation.recommendations) {
            lines.push(`  💡 ${rec}`);
        }
        lines.push("");
    }

    lines.push(`Explanation Confidence: ${explanation.confidence.toUpperCase()}`);
    lines.push(divider);

    return lines.join("\n");
}

/**
 * Renders a structured AgentExplanation payload into a GitHub Flavored Markdown report.
 * 
 * @param explanation AgentExplanation object.
 * @returns Markdown report string.
 */
export function formatExplainMarkdown(explanation: AgentExplanation): string {
    const lines: string[] = [];

    lines.push("# 🧠 Agent Execution Explanation Report");
    lines.push("");
    lines.push(`> **Confidence Level**: \`${explanation.confidence.toUpperCase()}\``);
    lines.push("");
    lines.push("## Executive Summary");
    lines.push(explanation.summary);
    lines.push("");

    lines.push("## Key Metrics");
    lines.push(`- **Latency**: ${explanation.metrics.durationMs} ms`);
    lines.push(`- **Token Usage**: ${explanation.metrics.totalTokens} tokens`);
    lines.push(`- **Estimated Cost**: \`${explanation.metrics.formattedCost}\``);
    lines.push("");

    if (explanation.tools.length > 0) {
        lines.push("## Tool Executions");
        for (const toolStr of explanation.tools) {
            lines.push(`- ${toolStr}`);
        }
        lines.push("");
    }

    if (explanation.handoffs.length > 0) {
        lines.push("## Multi-Agent Handoffs");
        for (const handoffStr of explanation.handoffs) {
            lines.push(`- ${handoffStr}`);
        }
        lines.push("");
    }

    if (explanation.guardrails.length > 0) {
        lines.push("## Guardrails");
        for (const g of explanation.guardrails) {
            lines.push(`- ${g}`);
        }
        lines.push("");
    }

    if (explanation.recommendations.length > 0) {
        lines.push("## Recommendations");
        for (const rec of explanation.recommendations) {
            lines.push(`- 💡 ${rec}`);
        }
        lines.push("");
    }

    return lines.join("\n");
}
