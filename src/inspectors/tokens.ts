import { SessionRecord, TokensInspectionData } from "../types.js";

/**
 * @file inspectors/tokens.ts
 * @description Specialized pure-function inspector for token usage metrics.
 * 
 * ARCHITECTURAL RULE: Data -> Formatter -> UI
 * Receives a SessionRecord object and returns pure, structured TokensInspectionData.
 * Performs ZERO console.log calls and ZERO network requests.
 */

/**
 * Inspects prompt tokens, completion tokens, and total tokens processed during a request session.
 * 
 * @param session SessionRecord flight recorder object.
 * @returns Structured TokensInspectionData object.
 */
export function inspectTokens(session: SessionRecord): TokensInspectionData {
    const usage = session.tokenUsage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    return {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens
    };
}
