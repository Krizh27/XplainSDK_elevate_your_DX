import { z } from "zod";
import { Agent } from "../agent.js";
import { StructuredRunOptions, StructuredRunResult } from "./types.js";

/**
 * @file agent/structured/repair.ts
 * @description Pure functional orchestrator for Structured Outputs and Schema Repair Engine.
 */

/**
 * Extracts a clean JSON substring from raw text or markdown code blocks (` ```json ... ``` `).
 */
export function extractJSON(text: string): string {
    const trimmed = text.trim();

    // 1. Check for markdown codeblocks
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
        return codeBlockMatch[1].trim();
    }

    // 2. Locate first '{' or '[' and last '}' or ']'
    const firstBrace = trimmed.indexOf("{");
    const firstBracket = trimmed.indexOf("[");

    let startIndex = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
        startIndex = Math.min(firstBrace, firstBracket);
    } else if (firstBrace !== -1) {
        startIndex = firstBrace;
    } else if (firstBracket !== -1) {
        startIndex = firstBracket;
    }

    if (startIndex !== -1) {
        const lastBrace = trimmed.lastIndexOf("}");
        const lastBracket = trimmed.lastIndexOf("]");
        const endIndex = Math.max(lastBrace, lastBracket);

        if (endIndex > startIndex) {
            return trimmed.substring(startIndex, endIndex + 1);
        }
    }

    return trimmed;
}

/**
 * Formats Zod validation issues into clear, human-readable error descriptions.
 */
function formatZodIssues(issues: z.ZodIssue[]): string {
    return issues
        .map(issue => `• Path: "${issue.path.join(".") || "root"}" - ${issue.message}`)
        .join("\n");
}

/**
 * Executes a structured output agent run, validating completion text against a Zod schema
 * and executing automated repair turns if validation fails.
 * 
 * @param agent The target Agent instance.
 * @param options StructuredRunOptions containing user prompt and target Zod schema.
 * @returns Promise resolving to strongly typed StructuredRunResult.
 * @throws Actionable 3-part diagnostic error if repair attempts are exhausted.
 */
export async function executeStructuredOutput<TSchema extends z.ZodTypeAny>(
    agent: Agent,
    options: StructuredRunOptions<TSchema>
): Promise<StructuredRunResult<z.infer<TSchema>>> {
    const maxAttempts = options.maxRepairAttempts !== undefined ? options.maxRepairAttempts : 3;

    // Enable native provider JSON mode if available
    const mergedProviderOptions = {
        response_format: { type: "json_object" },
        ...(options.providerOptions || {})
    };

    let currentPrompt = options.input;
    let repairAttempts = 0;

    while (repairAttempts <= maxAttempts) {
        // Construct system instruction hint for JSON schema compliance
        const systemHint = `System Instruction: Generate ONLY a valid JSON object matching the required schema. Do not include markdown codeblocks or conversational text.`;
        const turnInput = repairAttempts === 0
            ? `${systemHint}\n\n${currentPrompt}`
            : currentPrompt;

        // Execute run turn via agent
        const result = await agent.run({
            input: turnInput,
            sessionId: options.sessionId,
            model: options.model,
            streamSpeed: options.streamSpeed,
            providerOptions: mergedProviderOptions
        });

        const rawText = result.output_text;

        try {
            const jsonString = extractJSON(rawText);
            const parsedObj = JSON.parse(jsonString);

            // Validate against target Zod schema
            const parseResult = options.schema.safeParse(parsedObj);

            if (parseResult.success) {
                return {
                    data: parseResult.data,
                    output_text: rawText,
                    session: result.session,
                    repairAttempts: repairAttempts,
                    history: result.history
                };
            }

            // Schema validation failed: prepare repair prompt for next attempt
            repairAttempts++;

            if (repairAttempts > maxAttempts) {
                const issueDetails = formatZodIssues(parseResult.error.issues);
                throw new Error(
                    `[AgentSDK Schema Validation Error] Output failed Zod schema validation after ${maxAttempts} repair attempt(s).\n\n` +
                    `What Happened: Generated response JSON failed schema validation.\n` +
                    `Validation Issues:\n${issueDetails}\n\n` +
                    `How to Fix: Clarify field descriptions in your Zod schema or adjust agent instructions.`
                );
            }

            // Construct automated Schema Repair prompt for model feedback
            const issueDetails = formatZodIssues(parseResult.error.issues);
            currentPrompt = 
                `[Schema Validation Failed]\n` +
                `Your previous JSON output failed schema validation with the following errors:\n${issueDetails}\n\n` +
                `Previous Invalid Output:\n${rawText}\n\n` +
                `Please generate a corrected JSON object matching the required schema. Return ONLY JSON.`;

        } catch (err: any) {
            // Handle JSON parsing errors or rethrow schema validation errors
            if (err.message.includes("[AgentSDK Schema Validation Error]")) {
                throw err;
            }

            repairAttempts++;

            if (repairAttempts > maxAttempts) {
                throw new Error(
                    `[AgentSDK Schema Parsing Error] Response output could not be parsed as JSON after ${maxAttempts} attempt(s).\n\n` +
                    `What Happened: The LLM model returned unparseable text instead of valid JSON.\n` +
                    `Why: ${err.message}\n` +
                    `Raw Output:\n${rawText}\n\n` +
                    `How to Fix: Ensure provider supports response_format: { type: "json_object" } or simplify prompt.`
                );
            }

            currentPrompt =
                `[JSON Parsing Error]\n` +
                `Your previous response could not be parsed as valid JSON. Error: ${err.message}\n\n` +
                `Please return ONLY a valid, syntax-correct JSON object. Do not include conversational text.`;
        }
    }

    throw new Error(`[AgentSDK Error] Exceeded max repair attempts.`);
}
