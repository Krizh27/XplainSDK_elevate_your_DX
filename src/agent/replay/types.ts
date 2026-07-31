/**
 * @file agent/replay/types.ts
 * @description Type definitions and data schemas for Agent SDK Session Replay.
 */

export type ReplayStepType = "user_input" | "guardrail" | "decision" | "tool_execution" | "handoff" | "response";

/**
 * Single reconstructed step in an agent execution replay.
 */
export interface ReplayStep {
    stepNumber: number;
    type: ReplayStepType;
    title: string;
    detail: string;
    status?: "success" | "failed" | "info";
    timestamp?: string;
}

/**
 * Complete step-by-step reconstructed execution payload.
 */
export interface ReplayData {
    sessionId: string;
    provider: string;
    model: string;
    totalSteps: number;
    steps: ReplayStep[];
    finalOutput: string;
    durationMs: number;
}

/**
 * Callable function signature for `result.replay()`, supporting `.markdown()` and `.json()` helpers.
 */
export interface ReplayFunction {
    /** Prints a formatted step-by-step playback box directly to console.log(). */
    (): void;

    /** Returns formatted GitHub markdown step-by-step report string. */
    markdown(): string;

    /** Returns the underlying structured ReplayData object. */
    json(): ReplayData;
}
