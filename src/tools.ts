import { ToolDefinition } from "./types.js";

/**
 * tools.ts
 * 
 * WHY THIS FILE EXISTS:
 * Pure functional tool registry and schema converter.
 * 
 * RESPONSIBILITIES:
 * 1. Stores registered tools in an in-memory Map structure.
 * 2. Formats registered tools into the official OpenAI JSON schema payload format.
 */

export type ToolRegistry = Map<string, ToolDefinition>;

/**
 * Creates and initializes a fresh, empty tool registry.
 */
export function createToolRegistry(): ToolRegistry {
    return new Map<string, ToolDefinition>();
}

/**
 * Registers a new tool definition into the registry.
 * 
 * @param registry Target ToolRegistry map.
 * @param tool ToolDefinition object containing name, description, parameters, and execute.
 */
export function registerToolInRegistry(registry: ToolRegistry, tool: ToolDefinition): void {
    if (!tool.name) {
        throw new Error("ExplainSDK Error: Tool must have a valid name.");
    }
    registry.set(tool.name, tool);
}

/**
 * Retrieves a tool definition by name from the registry.
 */
export function getToolFromRegistry(registry: ToolRegistry, name: string): ToolDefinition | undefined {
    return registry.get(name);
}

/**
 * Converts registered tools into the OpenAI `tools` JSON array format expected by the API.
 * 
 * @param registry ToolRegistry map.
 * @returns Array of OpenAI function tool schemas or undefined if no tools registered.
 */
export function formatToolsForOpenAI(registry: ToolRegistry): any[] | undefined {
    if (registry.size === 0) return undefined;

    const formattedTools: any[] = [];

    for (const tool of registry.values()) {
        formattedTools.push({
            type: "function",
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters || {
                    type: "object",
                    properties: {},
                    required: []
                }
            }
        });
    }

    return formattedTools;
}
