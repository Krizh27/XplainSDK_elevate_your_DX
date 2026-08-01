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
 * Converts a Zod schema or object into a standard OpenAI function JSON Schema parameter object.
 */
export function zodToJsonSchema(schema: any): Record<string, any> {
    if (!schema) {
        return { type: "object", properties: {}, required: [] };
    }

    if (typeof schema === "object" && !schema._def && schema.type === "object") {
        return schema;
    }

    function parseZodType(zodType: any): any {
        if (!zodType || !zodType._def) return { type: "string" };
        const def = zodType._def;
        const typeName = def.typeName;
        const desc = zodType.description || def.description;
        const result: any = {};
        if (desc) result.description = desc;

        switch (typeName) {
            case "ZodString":
                result.type = "string";
                break;
            case "ZodNumber":
                result.type = "number";
                break;
            case "ZodBoolean":
                result.type = "boolean";
                break;
            case "ZodArray":
                result.type = "array";
                result.items = parseZodType(def.type);
                break;
            case "ZodEnum":
                result.type = "string";
                result.enum = def.values;
                break;
            case "ZodObject": {
                result.type = "object";
                result.properties = {};
                result.required = [];
                const shape = typeof zodType.shape === "function" ? zodType.shape() : (zodType.shape || (def.shape ? (typeof def.shape === "function" ? def.shape() : def.shape) : {}));
                for (const [key, propType] of Object.entries(shape)) {
                    result.properties[key] = parseZodType(propType);
                    const propTypeName = (propType as any)?._def?.typeName;
                    const isOpt = typeof (propType as any)?.isOptional === "function" ? (propType as any).isOptional() : false;
                    if (propTypeName !== "ZodOptional" && propTypeName !== "ZodDefault" && !isOpt) {
                        result.required.push(key);
                    }
                }
                break;
            }
            case "ZodOptional":
            case "ZodNullable":
            case "ZodDefault":
            case "ZodEffects": {
                const inner = parseZodType(def.innerType || def.schema);
                if (desc && !inner.description) inner.description = desc;
                return inner;
            }
            default:
                result.type = "string";
                break;
        }

        return result;
    }

    const generated = parseZodType(schema);
    if (generated.type !== "object") {
        return { type: "object", properties: { value: generated }, required: ["value"] };
    }
    return generated;
}

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
                parameters: tool.parameters || (tool.schema ? zodToJsonSchema(tool.schema) : {
                    type: "object",
                    properties: {},
                    required: []
                })
            }
        });
    }

    return formattedTools;
}
