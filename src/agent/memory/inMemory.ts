import { AgentMessage, StorageAdapter } from "./types.js";

/**
 * @class InMemoryStorageAdapter
 * @description Fast in-memory storage adapter for Agent SDK using Map<string, AgentMessage[]>.
 * 
 * @example
 * ```typescript
 * const memory = new InMemoryStorageAdapter();
 * const agent = new Agent({ name: "Assistant", apiKey: "...", memory });
 * ```
 */
export class InMemoryStorageAdapter implements StorageAdapter {
    private storage: Map<string, AgentMessage[]>;

    constructor() {
        this.storage = new Map<string, AgentMessage[]>();
    }

    public get(sessionId: string): AgentMessage[] | undefined {
        if (!sessionId) return undefined;
        return this.storage.get(sessionId);
    }

    public set(sessionId: string, messages: AgentMessage[]): void {
        if (!sessionId) return;
        this.storage.set(sessionId, [...messages]);
    }

    public clear(sessionId: string): void {
        if (!sessionId) return;
        this.storage.delete(sessionId);
    }
}
