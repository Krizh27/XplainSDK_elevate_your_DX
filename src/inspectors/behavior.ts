import { SessionRecord, BehaviorAnalysisData, BehaviorObservation } from "../types.js";

/**
 * @file inspectors/behavior.ts
 * @description Specialized pure-function inspector for post-execution Behavior Analysis.
 * 
 * ARCHITECTURAL RULE: Data -> Formatter -> UI
 * Receives a SessionRecord object and analyzes runtime facts vs interpretations.
 * Performs ZERO console.log calls and ZERO extra network requests.
 */

/**
 * Analyzes runtime session execution facts, identifies unexpected behaviors, and provides debugging interpretations.
 * 
 * @param session SessionRecord flight recorder object.
 * @returns Structured BehaviorAnalysisData object.
 */
export function inspectBehavior(session: SessionRecord): BehaviorAnalysisData {
    const observations: BehaviorObservation[] = [];

    const promptInput = session.request.input || "";
    const lowerPrompt = promptInput.toLowerCase().trim();
    const responseText = session.response.output_text || "";
    const lowerResponse = responseText.toLowerCase();
    const toolCalls = session.toolCalls || [];
    const latencyMs = session.performanceMetrics?.latencyMs || 0;
    const words = lowerPrompt.split(/\s+/).filter(Boolean);

    // 1. Detect Tool Execution Behavior & Mismatches
    if (toolCalls.length > 0) {
        for (const tc of toolCalls) {
            const toolName = tc.toolName;
            const weatherKeywords = ["weather", "temperature", "forecast", "rain", "sun", "climate", "degree", "celsius", "fahrenheit"];
            const isWeatherQuery = weatherKeywords.some(kw => lowerPrompt.includes(kw));

            if (toolName === "weather" && !isWeatherQuery) {
                observations.push({
                    fact: `Model executed tool "${toolName}()" with arguments: ${JSON.stringify(tc.args)}`,
                    category: "Unexpected Tool Call",
                    confidence: "High",
                    possibleCause: `The prompt "${promptInput}" was interpreted as referring to a location or entity triggering weather lookup.`,
                    suggestion: `Specify explicit context (e.g., "${promptInput}, the fictional character") instead of a ambiguous single phrase.`,
                    reason: "Explicit context eliminates topic ambiguity and prevents the model from choosing unintended tool executions."
                });
            } else {
                observations.push({
                    fact: `Model executed tool "${toolName}()" successfully in ${tc.durationMs} ms.`,
                    category: "Unexpected Tool Call",
                    confidence: "High",
                    possibleCause: `The model selected ${toolName}() based on registered tool descriptions.`,
                    suggestion: `Review tool parameters if response did not meet expectations.`,
                    reason: "Tool descriptions guide model tool choice during completion orchestration."
                });
            }
        }
    }

    // 2. Detect Ignored Format Constraints
    if (lowerPrompt.includes("json") && !responseText.includes("{") && !responseText.includes("[")) {
        observations.push({
            fact: "User requested JSON output format, but model returned plain unformatted text.",
            category: "Ignored Constraint",
            confidence: "High",
            possibleCause: "The prompt requested JSON in plain text without enforcing json_object response format.",
            suggestion: "Pass providerOptions: { response_format: { type: 'json_object' } } in ChatOptions.",
            reason: "Enforcing response_format at the provider level guarantees valid JSON schema output."
        });
    }

    // 3. Detect Ignored Length Constraints
    if ((lowerPrompt.includes("short answer") || lowerPrompt.includes("one sentence")) && responseText.length > 300) {
        observations.push({
            fact: `User requested a short response, but model generated ${responseText.length} characters (${responseText.split(/\s+/).length} words).`,
            category: "Response Length",
            confidence: "High",
            possibleCause: "Soft instructions like 'short answer' are often deprioritized over comprehensive explanation.",
            suggestion: "Set strict word boundaries (e.g. 'under 20 words') or use max_tokens in providerOptions.",
            reason: "Numeric word boundaries and max_tokens enforce hard truncation."
        });
    }

    // 4. Detect High Latency & Contributing Factors
    if (latencyMs > 3000) {
        const causes: string[] = [];
        if (toolCalls.length > 0) causes.push(`${toolCalls.length} tool execution round-trip(s)`);
        if (session.streamingMetadata.isStreaming) causes.push("stream rendering pacing delay");
        if (session.tokenUsage.total_tokens > 500) causes.push("large token completion length");

        observations.push({
            fact: `Request execution completed in ${(latencyMs / 1000).toFixed(2)} seconds (${latencyMs} ms).`,
            category: "High Latency",
            confidence: "High",
            possibleCause: causes.length > 0 ? `Latency influenced by: ${causes.join(", ")}.` : "Network latency or provider queue delay.",
            suggestion: "Consider using gpt-4o-mini for faster responses or streamSpeed: 'fast' to optimize display.",
            reason: "Tool execution loops and large completions increase latency."
        });
    }

    // 5. Detect Ambiguous Context Prompts
    if (words.length < 4 && toolCalls.length > 0) {
        observations.push({
            fact: `Prompt is very short (${words.length} word/s) and triggered automated tool selection.`,
            category: "Ambiguous Context",
            confidence: "Medium",
            possibleCause: `Short prompts like "${promptInput}" contain minimal context, leaving room for broad model interpretation.`,
            suggestion: "Expand your prompt with clear context and target entity definitions.",
            reason: "Specific prompts reduce reliance on model speculation."
        });
    }

    const hasAnomalies = observations.some(o => o.category === "Unexpected Tool Call" || o.category === "Ignored Constraint" || o.category === "High Latency");
    const summary = hasAnomalies
        ? `Behavior Advisor detected ${observations.length} runtime execution observation(s). Review recommendations below.`
        : `Execution completed as expected with no runtime anomalies detected.`;

    return {
        sessionTimestamp: session.timestamp,
        hasAnomalies: hasAnomalies,
        observations: observations,
        summary: summary
    };
}
