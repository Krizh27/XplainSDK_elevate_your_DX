import { SessionRecord } from "../../types.js";

/**
 * @file agent/events/types.ts
 * @description Type definitions and event payload contracts for Agent SDK Runtime Event Emitter.
 */

export interface RunStartPayload {
    runId: string;
    agentName: string;
    input: string;
    sessionId?: string;
    timestamp: string;
}

export interface ToolStartPayload {
    runId: string;
    agentName: string;
    toolName: string;
    args: Record<string, any>;
    timestamp: string;
}

export interface ToolCompletePayload {
    runId: string;
    agentName: string;
    toolName: string;
    args: Record<string, any>;
    result: any;
    timestamp: string;
}

export interface HandoffEventPayload {
    runId: string;
    fromAgent: string;
    toAgent: string;
    reason?: string;
    timestamp: string;
}

export interface GuardrailPayload {
    runId: string;
    agentName: string;
    type: "input" | "output";
    passed: boolean;
    reason?: string;
    timestamp: string;
}

export interface RunCompletePayload {
    runId: string;
    agentName: string;
    output_text: string;
    session: SessionRecord;
    durationMs: number;
    timestamp: string;
}

export interface RunFailedPayload {
    runId: string;
    agentName: string;
    error: Error;
    timestamp: string;
}

/**
 * Mapping of event names to their respective payload interfaces.
 */
export interface AgentEventMap {
    onRunStart: RunStartPayload;
    onToolStart: ToolStartPayload;
    onToolComplete: ToolCompletePayload;
    onHandoff: HandoffEventPayload;
    onGuardrail: GuardrailPayload;
    onRunComplete: RunCompletePayload;
    onRunFailed: RunFailedPayload;
}

export type AgentEventName = keyof AgentEventMap;
export type AgentEventListener<K extends AgentEventName> = (payload: AgentEventMap[K]) => void | Promise<void>;
