import { InputGuardrail, OutputGuardrail } from "./types.js";

/**
 * @file agent/guardrails/pipeline.ts
 * @description Pure functional pipeline runner for Input and Output Guardrails.
 */

/**
 * Runs Input Guardrails sequentially before the agent runtime loop starts.
 * 
 * @param input Raw user prompt input string.
 * @param agentName Name of the agent running the prompt.
 * @param guardrails Optional array of InputGuardrail functions.
 * @returns Promise resolving to the validated (or sanitized) prompt input string.
 * @throws Actionable 3-part diagnostic error if any Input Guardrail fails validation.
 */
export async function runInputGuardrails(
    input: string,
    agentName: string,
    guardrails?: InputGuardrail[]
): Promise<string> {
    if (!guardrails || guardrails.length === 0) {
        return input;
    }

    let currentInput = input;

    for (let i = 0; i < guardrails.length; i++) {
        const guardrail = guardrails[i];
        const result = await guardrail(currentInput, agentName);

        if (!result.passed) {
            throw new Error(
                `[AgentSDK Guardrail Error] Input Guardrail #${i + 1} failed for agent "${agentName}".\n\n` +
                `What Happened: The input prompt was rejected by input guardrail validation.\n` +
                `Why: ${result.reason || "Policy validation violation"}\n` +
                `How to Fix: Modify your prompt input to conform to the agent safety policy.`
            );
        }

        if (result.modifiedText) {
            currentInput = result.modifiedText;
        }
    }

    return currentInput;
}

/**
 * Runs Output Guardrails sequentially after LLM completion generation.
 * 
 * @param output Generated output text string.
 * @param agentName Name of the agent producing the response.
 * @param guardrails Optional array of OutputGuardrail functions.
 * @returns Promise resolving to the validated output text string.
 * @throws Actionable 3-part diagnostic error if any Output Guardrail fails validation.
 */
export async function runOutputGuardrails(
    output: string,
    agentName: string,
    guardrails?: OutputGuardrail[]
): Promise<string> {
    if (!guardrails || guardrails.length === 0) {
        return output;
    }

    let currentOutput = output;

    for (let i = 0; i < guardrails.length; i++) {
        const guardrail = guardrails[i];
        const result = await guardrail(currentOutput, agentName);

        if (!result.passed) {
            throw new Error(
                `[AgentSDK Guardrail Error] Output Guardrail #${i + 1} failed for agent "${agentName}".\n\n` +
                `What Happened: The generated agent output was rejected by output guardrail validation.\n` +
                `Why: ${result.reason || "Output policy violation"}\n` +
                `How to Fix: Adjust agent instructions or system prompt boundaries to generate policy-compliant output.`
            );
        }

        if (result.modifiedText) {
            currentOutput = result.modifiedText;
        }
    }

    return currentOutput;
}
