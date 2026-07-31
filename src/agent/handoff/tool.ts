import { AgentTool } from "../types.js";
import { Agent } from "../agent.js";
import { HandoffPayload } from "./types.js";

/**
 * @file agent/handoff/tool.ts
 * @description Pure functional helper constructing transfer tools for multi-agent delegation.
 */

/**
 * Constructs an automatic transfer tool for a target Agent.
 * 
 * @param targetAgent The Agent instance to delegate control to.
 * @returns AgentTool instance named `transfer_to_<targetAgent.name>`.
 */
export function createHandoffTool(targetAgent: Agent): AgentTool {
    const toolName = `transfer_to_${targetAgent.name}`;
    const description = `Transfer conversation control to agent "${targetAgent.name}". Agent Instructions: ${targetAgent.instructions || "Specialized assistant"}`;

    return {
        name: toolName,
        description: description,
        parameters: {
            type: "object",
            properties: {
                reason: {
                    type: "string",
                    description: "Reason for delegating to this agent."
                }
            }
        },
        execute: async ({ reason }: { reason?: string }): Promise<HandoffPayload> => {
            return {
                __isHandoff: true,
                targetAgentName: targetAgent.name,
                reason: reason || "Delegation request"
            };
        }
    };
}
