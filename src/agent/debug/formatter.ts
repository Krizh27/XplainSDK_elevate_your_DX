import { DebugReport } from "./types.js";

/**
 * @file agent/debug/formatter.ts
 * @description Presentation layer formatting DebugReport data into Terminal Console boxes or Markdown reports.
 */

/**
 * Renders a structured DebugReport payload into a clean, developer-friendly terminal box.
 * 
 * @param report DebugReport object.
 * @returns Formatted console text block string.
 */
export function formatDebugConsole(report: DebugReport): string {
    const divider = "────────────────────────────────────────────────────────────";
    const lines: string[] = [];

    lines.push(divider);
    lines.push("🐞 Smart Debug Assistant Report");
    lines.push(divider);
    lines.push("");

    lines.push("What Happened");
    lines.push(report.summary);
    lines.push("");

    if (report.detectedIssues.length > 0) {
        lines.push("Detected Issues / Anomalies");
        for (const issue of report.detectedIssues) {
            lines.push(`  ⚠️  ${issue}`);
        }
        lines.push("");
    } else {
        lines.push("Detected Issues");
        lines.push("  ✓ No critical execution issues detected.");
        lines.push("");
    }

    if (report.nextInspections.length > 0) {
        lines.push("Recommended Next Inspection");
        for (const rec of report.nextInspections) {
            lines.push(`  🔍 [${rec.target}] ${rec.reason}`);
            lines.push(`     Command: ${rec.command}`);
        }
        lines.push("");
    }

    if (report.suggestions.length > 0) {
        lines.push("Actionable Suggestions");
        for (const sug of report.suggestions) {
            lines.push(`  💡 ${sug}`);
        }
        lines.push("");
    }

    if (report.learningTips.length > 0) {
        lines.push("Educational Learning Tips");
        for (const tip of report.learningTips) {
            lines.push(`  🎓 ${tip}`);
        }
        lines.push("");
    }

    if (report.warnings.length > 0) {
        lines.push("Warnings");
        for (const w of report.warnings) {
            lines.push(`  🚨 ${w}`);
        }
        lines.push("");
    }

    lines.push(`Diagnostic Confidence: ${report.confidence.toUpperCase()}`);
    lines.push(divider);

    return lines.join("\n");
}

/**
 * Renders a structured DebugReport payload into a GitHub Flavored Markdown debug report document.
 * 
 * @param report DebugReport object.
 * @returns Markdown report string.
 */
export function formatDebugMarkdown(report: DebugReport): string {
    const lines: string[] = [];

    lines.push("# 🐞 Smart Debug Assistant Report");
    lines.push("");
    lines.push(`> **Confidence Level**: \`${report.confidence.toUpperCase()}\``);
    lines.push("");
    lines.push("## Summary");
    lines.push(report.summary);
    lines.push("");

    if (report.detectedIssues.length > 0) {
        lines.push("## Detected Issues");
        for (const issue of report.detectedIssues) {
            lines.push(`- ⚠️ ${issue}`);
        }
        lines.push("");
    }

    if (report.nextInspections.length > 0) {
        lines.push("## Recommended Next Inspections");
        for (const rec of report.nextInspections) {
            lines.push(`### 🔍 ${rec.target}`);
            lines.push(`- **Reason**: ${rec.reason}`);
            lines.push(`- **Code**: \`${rec.command}\``);
            lines.push("");
        }
    }

    if (report.suggestions.length > 0) {
        lines.push("## Actionable Suggestions");
        for (const sug of report.suggestions) {
            lines.push(`- 💡 ${sug}`);
        }
        lines.push("");
    }

    if (report.learningTips.length > 0) {
        lines.push("## Learning Tips");
        for (const tip of report.learningTips) {
            lines.push(`- 🎓 ${tip}`);
        }
        lines.push("");
    }

    return lines.join("\n");
}
