/**
 * @file agent/handoff/types.ts
 * @description Type definitions for Agent SDK Multi-Agent Handoffs & Loop Prevention.
 */

export interface HandoffPayload {
    __isHandoff: boolean;
    targetAgentName: string;
    reason?: string;
}

export interface HandoffResult {
    activeAgentName: string;
    reason?: string;
}
