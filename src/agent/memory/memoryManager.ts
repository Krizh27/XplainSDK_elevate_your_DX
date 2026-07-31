import { AgentMessage, StorageAdapter } from "./types.js";

/**
 * @file agent/memory/memoryManager.ts
 * @description Pure functional memory manager functions delegating to StorageAdapter instances.
 */

/**
 * Loads session message history from a storage adapter if available.
 * 
 * @param storage Optional StorageAdapter implementation.
 * @param sessionId Optional session identifier.
 * @returns Promise resolving to an array of AgentMessages.
 */
export async function loadSessionHistory(
    storage?: StorageAdapter,
    sessionId?: string
): Promise<AgentMessage[]> {
    if (!storage || !sessionId || sessionId.trim() === "") {
        return [];
    }

    const messages = await storage.get(sessionId.trim());
    return messages ? [...messages] : [];
}

/**
 * Persists session message history to a storage adapter if available.
 * 
 * @param storage Optional StorageAdapter implementation.
 * @param sessionId Optional session identifier.
 * @param messages Array of AgentMessages to save.
 */
export async function saveSessionHistory(
    storage?: StorageAdapter,
    sessionId?: string,
    messages: AgentMessage[] = []
): Promise<void> {
    if (!storage || !sessionId || sessionId.trim() === "") {
        return;
    }

    await storage.set(sessionId.trim(), [...messages]);
}

/**
 * Clears session message history from a storage adapter if available.
 * 
 * @param storage Optional StorageAdapter implementation.
 * @param sessionId Optional session identifier.
 */
export async function clearSessionHistory(
    storage?: StorageAdapter,
    sessionId?: string
): Promise<void> {
    if (!storage || !sessionId || sessionId.trim() === "") {
        return;
    }

    await storage.clear(sessionId.trim());
}
