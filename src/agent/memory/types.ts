/**
 * @file agent/memory/types.ts
 * @description Type definitions and storage interface contracts for the Agent SDK Memory System.
 */

export type AgentRole = "user" | "assistant" | "system" | "tool";

/**
 * A single message entry recorded in an agent conversation turn.
 */
export interface AgentMessage {
    role: AgentRole;
    content: string;
    name?: string;
    tool_call_id?: string;
    timestamp?: string;
}

/**
 * Universal interface contract defining methods every storage adapter must implement.
 * 
 * @example
 * ```typescript
 * class MyStorage implements StorageAdapter {
 *   async get(sessionId: string) { ... }
 *   async set(sessionId: string, messages: AgentMessage[]) { ... }
 *   async clear(sessionId: string) { ... }
 * }
 * ```
 */
export interface StorageAdapter {
    /** Retrieves saved message history for a session ID. */
    get(sessionId: string): Promise<AgentMessage[] | undefined> | AgentMessage[] | undefined;

    /** Persists updated message history for a session ID. */
    set(sessionId: string, messages: AgentMessage[]): Promise<void> | void;

    /** Clears saved message history for a session ID. */
    clear(sessionId: string): Promise<void> | void;
}
