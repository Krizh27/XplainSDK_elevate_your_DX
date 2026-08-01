import { AgentTool } from "./types.js";
import { zodToJsonSchema } from "../tools.js";

/**
 * @file agent/tool.ts
 * @description Pure functional helper for constructing typed AgentTool definitions.
 */

export interface CreateAgentToolOptions<TArgs = Record<string, any>, TResult = any> {
    name: string;
    description: string;
    schema?: any;
    parameters?: Record<string, any>;
    requiresApproval?: boolean;
    execute: (args: TArgs) => Promise<TResult> | TResult;
}

/**
 * Creates and validates a standardized `AgentTool` instance.
 * 
 * @example
 * ```typescript
 * const deleteDatabaseTool = createAgentTool({
 *   name: "delete_database",
 *   description: "Deletes a database table",
 *   requiresApproval: true, // Pauses execution for Human-in-the-Loop approval
 *   execute: async ({ tableName }: { tableName: string }) => `Deleted ${tableName}`
 * });
 * ```
 */
export function createAgentTool<TArgs = Record<string, any>, TResult = any>(
    options: CreateAgentToolOptions<TArgs, TResult>
): AgentTool<TArgs, TResult> {
    if (!options || typeof options.name !== "string" || options.name.trim() === "") {
        throw new Error(
            `[AgentSDK Error] Missing or invalid tool name.\n\n` +
            `What Happened: You called createAgentTool() with an invalid tool name.\n` +
            `Why: Agent SDK requires every tool to have a unique string name.\n` +
            `How to Fix: Provide a valid name property (e.g. name: "get_weather").`
        );
    }

    if (typeof options.execute !== "function") {
        throw new Error(
            `[AgentSDK Error] Missing execute function for tool "${options.name}".\n\n` +
            `What Happened: The tool "${options.name}" has no execute handler function.\n` +
            `Why: Agent SDK requires an executable function to invoke when the model calls this tool.\n` +
            `How to Fix: Pass an async execute function to createAgentTool().`
        );
    }

    return {
        name: options.name.trim(),
        description: options.description || "",
        schema: options.schema,
        parameters: options.parameters || (options.schema ? zodToJsonSchema(options.schema) : undefined),
        requiresApproval: options.requiresApproval || false,
        execute: options.execute
    };
}
