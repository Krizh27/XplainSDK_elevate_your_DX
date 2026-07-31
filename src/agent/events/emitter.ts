import { AgentEventName, AgentEventMap, AgentEventListener } from "./types.js";

/**
 * @file agent/events/emitter.ts
 * @description Typed event emitter class and runId generator for Agent SDK runtime lifecycle events.
 */

/**
 * Generates a unique, readable run identifier string.
 * 
 * @example
 * ```typescript
 * const runId = generateRunId(); // "run_1722437200_a1b2c3"
 * ```
 */
export function generateRunId(): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `run_${timestamp}_${randomSuffix}`;
}

/**
 * Typed Event Emitter for listening to agent execution lifecycle events.
 */
export class AgentEventEmitter {
    private listeners: Map<AgentEventName, Set<AgentEventListener<any>>>;

    constructor() {
        this.listeners = new Map();
    }

    /**
     * Subscribes a listener function to a lifecycle event.
     */
    public on<K extends AgentEventName>(event: K, listener: AgentEventListener<K>): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(listener);
    }

    /**
     * Unsubscribes a listener function from a lifecycle event.
     */
    public off<K extends AgentEventName>(event: K, listener: AgentEventListener<K>): void {
        const set = this.listeners.get(event);
        if (set) {
            set.delete(listener);
        }
    }

    /**
     * Emits a lifecycle event to all subscribed listeners.
     */
    public async emit<K extends AgentEventName>(event: K, payload: AgentEventMap[K]): Promise<void> {
        const set = this.listeners.get(event);
        if (!set || set.size === 0) return;

        for (const listener of Array.from(set)) {
            try {
                await listener(payload);
            } catch (err) {
                console.error(`[AgentSDK Event Error] Error in listener for event "${event}":`, err);
            }
        }
    }
}
