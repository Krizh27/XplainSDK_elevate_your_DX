import { z } from "zod";
import { SessionRecord, StreamSpeedPreset } from "../../types.js";
import { AgentMessage } from "../memory/types.js";

/**
 * @file agent/structured/types.ts
 * @description Type definitions and result schemas for Agent SDK Structured Outputs & Schema Repair Engine.
 */

/**
 * Options passed to `agent.runStructured({ input, schema })`.
 * 
 * @template TSchema Zod schema type extending z.ZodTypeAny.
 */
export interface StructuredRunOptions<TSchema extends z.ZodTypeAny> {
    /** The user prompt or instruction string for structured extraction. */
    input: string;

    /** Target Zod schema definition that the response must conform to. */
    schema: TSchema;

    /** Maximum allowed repair retry attempts if schema validation fails. @default 3 */
    maxRepairAttempts?: number;

    /** Optional session ID for multi-turn history loading and persistence. */
    sessionId?: string;

    /** Optional model override for this specific run. */
    model?: string;

    /** Optional stream rendering speed override. */
    streamSpeed?: StreamSpeedPreset;

    /** Optional provider-specific parameters passed directly to provider SDK. */
    providerOptions?: Record<string, any>;
}

/**
 * Normalized result payload returned by `agent.runStructured()`.
 * 
 * @template T Inferred TypeScript type from the Zod schema (`z.infer<TSchema>`).
 */
export interface StructuredRunResult<T> {
    /** Strongly typed, validated data object matching the target Zod schema. */
    data: T;

    /** Raw text output produced by the LLM model. */
    output_text: string;

    /** ExplainSDK SessionRecord flight recorder object holding full telemetry. */
    session: SessionRecord;

    /** Number of schema repair retry attempts required to achieve valid output. */
    repairAttempts: number;

    /** Complete array of loaded and updated conversation messages for this session. */
    history?: AgentMessage[];
}
