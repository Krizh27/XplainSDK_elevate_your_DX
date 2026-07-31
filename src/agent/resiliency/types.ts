/**
 * @file agent/resiliency/types.ts
 * @description Type definitions and configuration schemas for the Agent SDK Resiliency Engine.
 */

export interface ResiliencyOptions {
    /** Maximum number of retry attempts for transient errors. @default 3 */
    retries?: number;

    /** Initial delay in milliseconds before the first retry attempt. @default 200 */
    initialDelayMs?: number;

    /** Per-turn execution timeout limit in milliseconds. @default 30000 */
    timeoutMs?: number;
}

export interface ToolCallSignature {
    toolName: string;
    args: Record<string, any>;
}
