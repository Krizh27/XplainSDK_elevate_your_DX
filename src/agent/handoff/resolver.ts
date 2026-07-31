/**
 * @file agent/handoff/resolver.ts
 * @description Pure functional loop detector for multi-agent delegation chains.
 */

/**
 * Detects circular delegation loops (e.g. AgentA -> AgentB -> AgentA) or maximum handoff depth limits.
 * 
 * @param chain Array of active agent names in the delegation stack.
 * @param targetAgentName Name of the agent attempting to receive control.
 * @param maxDepth Maximum allowed delegation stack depth (default 5).
 * @throws Actionable 3-part diagnostic error if a loop or max depth violation is detected.
 */
export function detectHandoffLoop(
    chain: string[],
    targetAgentName: string,
    maxDepth: number = 5
): void {
    if (!chain || chain.length === 0) {
        return;
    }

    // 1. Check max handoff depth limit
    if (chain.length >= maxDepth) {
        throw new Error(
            `[AgentSDK Handoff Loop Error] Maximum handoff depth of ${maxDepth} exceeded.\n\n` +
            `What Happened: Delegation chain exceeded maximum depth limit.\n` +
            `Delegation Chain: ${chain.join(" -> ")} -> ${targetAgentName}\n` +
            `Why: Too many agent transfers occurred within a single run.\n` +
            `How to Fix: Increase maxHandoffDepth or refine agent delegation boundaries.`
        );
    }

    // 2. Check circular delegation (agent appearing twice in chain)
    if (chain.includes(targetAgentName)) {
        throw new Error(
            `[AgentSDK Handoff Loop Error] Circular agent handoff loop detected.\n\n` +
            `What Happened: Agent "${targetAgentName}" was called again in a circular handoff cycle.\n` +
            `Delegation Chain: ${chain.join(" -> ")} -> ${targetAgentName}\n` +
            `Why: Agents are delegating back and forth endlessly without resolving the user request.\n` +
            `How to Fix: Clarify agent tool descriptions or instructions to prevent ping-pong delegation.`
        );
    }
}
