/**
 * cost.ts
 * 
 * WHY THIS FILE EXISTS:
 * This module is dedicated strictly to API cost estimation.
 * 
 * DESIGN PRINCIPLES:
 * 1. Provider-Agnostic: It does not import or know anything about OpenAI, Anthropic, or HTTP SDKs.
 * 2. Single Responsibility: Given a model name and token counts, it computes the estimated dollar cost.
 * 3. Isolated Pricing Table: Prices are maintained in a clean, central lookup table that can be easily updated.
 */

export interface ModelPricing {
    /** Cost in USD per 1 Million input (prompt) tokens. */
    inputPer1M: number;
    /** Cost in USD per 1 Million output (completion) tokens. */
    outputPer1M: number;
}

/**
 * Local pricing lookup table for LLM models (USD per 1 Million Tokens).
 * 
 * Keeping this object isolated makes it trivial to update prices as vendors drop rates.
 */
export const PRICING_TABLE: Record<string, ModelPricing> = {
    "gpt-4o-mini": {
        inputPer1M: 0.15,
        outputPer1M: 0.60
    },
    "gpt-4o": {
        inputPer1M: 2.50,
        outputPer1M: 10.00
    },
    "gpt-3.5-turbo": {
        inputPer1M: 0.50,
        outputPer1M: 1.50
    },
    "gpt-5": {
        inputPer1M: 5.00,
        outputPer1M: 15.00
    },
    // Default fallback pricing if an unlisted model name is provided
    "default": {
        inputPer1M: 1.00,
        outputPer1M: 3.00
    }
};

/**
 * Calculates estimated API cost in USD based on model pricing per 1M tokens.
 * 
 * @param model Model identifier string (e.g. "gpt-4o-mini").
 * @param promptTokens Number of input prompt tokens.
 * @param completionTokens Number of generated completion tokens.
 * @returns Total estimated cost in USD as a raw number.
 */
export function calculateCost(
    model: string,
    promptTokens: number,
    completionTokens: number
): number {
    const normalizedModel = model.toLowerCase().trim();
    
    // Lookup pricing or fallback to default table entry
    const pricing = PRICING_TABLE[normalizedModel] || PRICING_TABLE["default"];

    const inputCost = (promptTokens / 1_000_000) * pricing.inputPer1M;
    const outputCost = (completionTokens / 1_000_000) * pricing.outputPer1M;

    return inputCost + outputCost;
}

/**
 * Formats a raw numerical dollar cost into a clean string (e.g. "$0.00014" or "$0.00182").
 * 
 * @param cost Dollar amount as a number.
 * @returns Formatted currency string.
 */
export function formatCost(cost: number): string {
    // If cost is 0, return $0.00000
    if (cost === 0) return "$0.00000";
    
    // Format to 5 decimal places for precision with micro-costs
    return `$${cost.toFixed(5)}`;
}
