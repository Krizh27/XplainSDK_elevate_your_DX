/**
 * @file agent/explain/types.ts
 * @description Type definitions and data schemas for Agent SDK Explain Mode.
 */

/**
 * Structured, human-readable executive summary produced by Explain Mode.
 */
export interface AgentExplanation {
    /** Short, executive summary paragraph describing what happened during the agent run. */
    summary: string;

    /** Key decisions made by the model during execution. */
    decisions: string[];

    /** List of tools executed and their outcomes. */
    tools: string[];

    /** List of agent handoffs triggered during execution. */
    handoffs: string[];

    /** Summary of guardrails evaluated and triggered. */
    guardrails: string[];

    /** Information on transient retries or timeouts. */
    retries: string[];

    /** Observed runtime behavioral facts and confidence levels. */
    observations: string[];

    /** Educational recommendations reused from Prompt and Behavior Advisors. */
    recommendations: string[];

    /** Overall explanation confidence level based on empirical evidence. */
    confidence: "high" | "medium" | "low";

    /** Key performance, token, and USD cost metrics. */
    metrics: {
        durationMs: number;
        totalTokens: number;
        formattedCost: string;
    };
}

/**
 * Callable function signature for `result.explain()`, supporting `.markdown()` and `.json()` helpers.
 */
export interface ExplainFunction {
    /** Prints a formatted, human-readable explanation box directly to console.log(). */
    (): void;

    /** Returns formatted GitHub markdown report string. */
    markdown(): string;

    /** Returns the underlying structured AgentExplanation data object. */
    json(): AgentExplanation;
}
