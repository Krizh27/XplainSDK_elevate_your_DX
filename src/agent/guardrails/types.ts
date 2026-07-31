/**
 * @file agent/guardrails/types.ts
 * @description Type definitions and callback contracts for Agent SDK Guardrails and Human-in-the-Loop Approval.
 */

/**
 * Result returned by an Input or Output Guardrail validation check.
 */
export interface GuardrailResult {
    /** Indicates whether the validation check passed. */
    passed: boolean;
    /** Optional explanation if validation failed or warning was issued. */
    reason?: string;
    /** Optional sanitized or modified text if the guardrail mutated the content. */
    modifiedText?: string;
}

/**
 * Function contract for Input Guardrails executed before the agent runtime loop.
 */
export type InputGuardrail = (
    input: string,
    agentName: string
) => Promise<GuardrailResult> | GuardrailResult;

/**
 * Function contract for Output Guardrails executed after LLM completion generation.
 */
export type OutputGuardrail = (
    output: string,
    agentName: string
) => Promise<GuardrailResult> | GuardrailResult;

/**
 * Payload passed to the human approval callback when a sensitive tool requires confirmation.
 */
export interface ApprovalRequest {
    /** Name of the tool requesting execution. */
    toolName: string;
    /** Arguments passed to the tool function. */
    args: Record<string, any>;
    /** Name of the agent attempting tool execution. */
    agentName: string;
}

/**
 * Callback function contract for requesting human approval before tool execution.
 * 
 * @returns Promise<boolean> or boolean: true if approved, false if denied.
 */
export type ApprovalCallback = (
    request: ApprovalRequest
) => Promise<boolean> | boolean;
