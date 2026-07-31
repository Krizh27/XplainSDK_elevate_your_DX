import { ReplayData } from "./types.js";

/**
 * @file agent/replay/formatter.ts
 * @description Isolated presentation layer formatting ReplayData into Terminal Console playback or Markdown reports.
 */

/**
 * Renders a structured ReplayData payload into a clean, step-by-step terminal playback text box.
 * 
 * @param replayData ReplayData object.
 * @returns Formatted console text block string.
 */
export function formatReplayConsole(replayData: ReplayData): string {
    const divider = "────────────────────────────────────────────────────────────";
    const lines: string[] = [];

    lines.push(divider);
    lines.push(`🎬 Session Replay (Session: ${replayData.sessionId})`);
    lines.push(`Provider: ${replayData.provider.toUpperCase()} | Model: ${replayData.model} | Steps: ${replayData.totalSteps}`);
    lines.push(divider);
    lines.push("");

    for (const step of replayData.steps) {
        const symbol = step.status === "failed" ? "❌" : step.status === "success" ? "✓" : "▶";
        lines.push(`STEP ${step.stepNumber} [${step.type.toUpperCase()}] ${symbol} ${step.title}`);
        
        // Indent detail lines
        const detailLines = step.detail.split("\n");
        for (const line of detailLines) {
            lines.push(`  ${line}`);
        }
        lines.push("");
    }

    lines.push(divider);
    lines.push(`🏁 Replay Complete (${replayData.durationMs} ms Total Duration)`);
    lines.push(divider);

    return lines.join("\n");
}

/**
 * Renders a structured ReplayData payload into a GitHub Flavored Markdown step-by-step report.
 * 
 * @param replayData ReplayData object.
 * @returns Markdown report string.
 */
export function formatReplayMarkdown(replayData: ReplayData): string {
    const lines: string[] = [];

    lines.push(`# 🎬 Session Replay Report: \`${replayData.sessionId}\``);
    lines.push("");
    lines.push(`- **Provider**: \`${replayData.provider}\``);
    lines.push(`- **Model**: \`${replayData.model}\``);
    lines.push(`- **Total Replay Steps**: ${replayData.totalSteps}`);
    lines.push(`- **Execution Duration**: ${replayData.durationMs} ms`);
    lines.push("");
    lines.push("## Step-by-Step Timeline");
    lines.push("");

    for (const step of replayData.steps) {
        const badge = step.status === "failed" ? "🔴" : step.status === "success" ? "🟢" : "🔵";
        lines.push(`### Step ${step.stepNumber}: ${badge} ${step.title}`);
        lines.push(`**Type**: \`${step.type}\``);
        lines.push("");
        lines.push("```text");
        lines.push(step.detail);
        lines.push("```");
        lines.push("");
    }

    return lines.join("\n");
}
