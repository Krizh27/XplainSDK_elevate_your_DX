import { 
    TimelineInspectionData, 
    PerformanceInspectionData, 
    TokensInspectionData, 
    CostInspectionData, 
    ToolsInspectionData,
    PromptAnalysisData,
    BehaviorAnalysisData
} from "../types.js";

/**
 * @file inspectors/formatter.ts
 * @description Formatter module transforming structured inspection data into readable terminal reports.
 * 
 * ARCHITECTURAL RULE: Data -> Formatter -> UI
 * Converts machine-readable inspection objects into clean, formatted terminal text blocks.
 */

export type InspectionType = "performance" | "tokens" | "cost" | "tools" | "timeline" | "prompt" | "behavior";

/**
 * Formats structured inspection data into clean, readable terminal text blocks.
 * 
 * @param type The type of inspector report ("performance" | "tokens" | "cost" | "tools" | "timeline" | "prompt" | "behavior").
 * @param data Structured inspection data payload returned by the corresponding inspector function.
 * @returns Formatted terminal report string.
 */
export function formatInspection(type: InspectionType, data: any): string {
    const divider = "====================================";

    switch (type) {
        case "behavior": {
            const d = data as BehaviorAnalysisData;
            const lines = [
                divider,
                "Behavior Advisor",
                "",
                "Summary",
                d.summary,
                ""
            ];

            if (d.observations.length === 0) {
                lines.push("No unexpected runtime behaviors or anomalies were detected.", divider);
                return lines.join("\n");
            }

            for (const obs of d.observations) {
                lines.push(
                    "Observed Behavior",
                    `• [${obs.category}] ${obs.fact}`,
                    "",
                    "Confidence",
                    obs.confidence,
                    "",
                    "Possible Cause",
                    obs.possibleCause,
                    "",
                    "Suggestion",
                    obs.suggestion,
                    "",
                    "Reason",
                    obs.reason,
                    "────────────────────────────────────"
                );
            }

            lines.push(divider);
            return lines.join("\n");
        }

        case "prompt": {
            const d = data as PromptAnalysisData;
            const lines = [
                divider,
                "Prompt Advisor",
                "",
                "Heuristic Score",
                d.heuristicScore,
                ""
            ];

            lines.push("Category Breakdown");
            lines.push(`• Clarity:        ${d.categories.clarity.status}`);
            lines.push(`• Context:        ${d.categories.context.status}`);
            lines.push(`• Specificity:    ${d.categories.specificity.status}`);
            lines.push(`• Constraints:    ${d.categories.constraints.status}`);
            lines.push(`• Output Format:  ${d.categories.outputFormat.status}`);
            lines.push(`• Audience:       ${d.categories.audience.status}`);
            lines.push(`• Ambiguity:      ${d.categories.ambiguity.status}`);
            lines.push(`• Length:         ${d.categories.promptLength.status}`);
            lines.push("");

            if (d.strengths.length > 0) {
                lines.push("Strengths");
                for (const str of d.strengths) {
                    lines.push(str);
                }
                lines.push("");
            }

            if (d.suggestions.length > 0) {
                lines.push("Suggestions");
                for (const sug of d.suggestions) {
                    lines.push(sug);
                }
                lines.push("");
            }

            if (d.educationalWhys.length > 0) {
                lines.push("Why These Matter");
                for (const item of d.educationalWhys) {
                    lines.push(`• ${item.why}`);
                }
                lines.push("");
            }

            if (d.suggestedPrompt && d.diffView) {
                lines.push("Suggested Prompt Recommendation (Educational)");
                lines.push("────────────────────────────────────");
                lines.push("Original Prompt:");
                lines.push(`"${d.diffView.original}"`);
                lines.push("");
                lines.push("Suggested Prompt:");
                lines.push(`"${d.diffView.suggested}"`);
                lines.push("────────────────────────────────────");
                lines.push("");
            }

            lines.push(divider);
            return lines.join("\n");
        }

        case "performance": {
            const d = data as PerformanceInspectionData;
            const lines = [
                divider,
                "Performance Inspector",
                "",
                "Latency",
                d.latencyFormatted,
                ""
            ];

            if (d.totalChunks !== undefined) {
                lines.push("Streaming", `${d.totalChunks} chunks`, "");
            }

            lines.push(
                "Characters",
                String(d.charactersReturned),
                "",
                "Words",
                String(d.wordsReturned),
                "",
                "Status",
                d.status,
                divider
            );

            return lines.join("\n");
        }

        case "tokens": {
            const d = data as TokensInspectionData;
            return [
                divider,
                "Token Inspector",
                "",
                "Prompt Tokens",
                String(d.promptTokens),
                "",
                "Completion Tokens",
                String(d.completionTokens),
                "",
                "Total Tokens",
                String(d.totalTokens),
                divider
            ].join("\n");
        }

        case "cost": {
            const d = data as CostInspectionData;
            return [
                divider,
                "Cost Inspector",
                "",
                "Estimated Cost",
                d.formattedCost,
                divider
            ].join("\n");
        }

        case "tools": {
            const d = data as ToolsInspectionData;
            if (d.totalToolsExecuted === 0) {
                return [
                    divider,
                    "Tool Inspector",
                    "",
                    "No tools were executed during this session.",
                    divider
                ].join("\n");
            }

            const lines = [
                divider,
                "Tool Inspector",
                ""
            ];

            for (const exec of d.executions) {
                lines.push(
                    `${exec.toolName}()`,
                    "",
                    "Execution Time",
                    `${exec.durationMs} ms`,
                    "",
                    "Result",
                    exec.status,
                    ""
                );
            }

            lines.push(divider);
            return lines.join("\n");
        }

        case "timeline": {
            const d = data as TimelineInspectionData;
            const lines = [
                divider,
                "Timeline Inspector",
                ""
            ];

            for (const event of d.events) {
                lines.push(event.message);
            }

            lines.push("", divider);
            return lines.join("\n");
        }

        default:
            return `${divider}\nInspection: ${String(type)}\n${JSON.stringify(data, null, 2)}\n${divider}`;
    }
}
