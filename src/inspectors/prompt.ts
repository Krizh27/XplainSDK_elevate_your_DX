import { SessionRecord, PromptAnalysisData, PromptCategoryAnalysis, CategoryStatus } from "../types.js";

/**
 * @file inspectors/prompt.ts
 * @description Specialized pure-function inspector for educational Prompt Advisor analysis.
 * 
 * ARCHITECTURAL RULE: Data -> Formatter -> UI
 * Receives a SessionRecord object and returns pure, structured PromptAnalysisData.
 * Performs ZERO console.log calls, ZERO network requests, and NEVER modifies the prompt sent to providers.
 */

/**
 * Inspects and evaluates a prompt string to provide educational prompt engineering feedback.
 * 
 * @param session SessionRecord flight recorder object.
 * @returns Structured PromptAnalysisData object.
 */
export function inspectPrompt(session: SessionRecord): PromptAnalysisData {
    const promptInput = session.request.input || "";
    const lowerPrompt = promptInput.toLowerCase().trim();
    const words = lowerPrompt.split(/\s+/).filter(Boolean);

    // 1. Analyze Category: Clarity
    const actionVerbs = ["explain", "list", "create", "write", "compare", "describe", "calculate", "generate", "summarize", "find", "get", "what", "how", "why"];
    const hasActionVerb = actionVerbs.some(verb => lowerPrompt.includes(verb));
    const clarity: PromptCategoryAnalysis = {
        status: hasActionVerb ? "Good" : "Needs Improvement",
        explanation: hasActionVerb
            ? "The prompt contains a clear action verb indicating what task the AI should perform."
            : "The prompt lacks a direct action verb (e.g., 'Explain', 'List', 'Compare'), which may lead to generic responses.",
        suggestion: hasActionVerb ? undefined : "Start your prompt with a clear command verb like 'Explain', 'Compare', or 'Summarize'.",
        whyItMatters: "Explicit command verbs reduce model ambiguity and direct attention to the core instruction."
    };

    // 2. Analyze Category: Context
    const contextKeywords = ["for", "in", "given", "scenario", "background", "context", "using", "as a"];
    const hasContext = contextKeywords.some(kw => lowerPrompt.includes(kw)) || words.length > 15;
    const context: PromptCategoryAnalysis = {
        status: hasContext ? "Good" : "Missing",
        explanation: hasContext
            ? "Contextual details or domain background were provided."
            : "No background context or domain setup was detected in the prompt.",
        suggestion: hasContext ? undefined : "Add 1-2 sentences of background context explaining the situation or domain.",
        whyItMatters: "Background context helps the AI adopt the correct domain knowledge and tone."
    };

    // 3. Analyze Category: Specificity
    const specificityKeywords = ["today", "surat", "exact", "specific", "step-by-step", "detailed", "top 5", "3 reasons"];
    const hasNumbers = /\d+/.test(promptInput);
    const isSpecific = specificityKeywords.some(kw => lowerPrompt.includes(kw)) || hasNumbers || words.length > 10;
    const specificity: PromptCategoryAnalysis = {
        status: isSpecific ? "Good" : "Needs Improvement",
        explanation: isSpecific
            ? "The prompt includes specific entities, numbers, or location details."
            : "The prompt is generic and lacks specific target details.",
        suggestion: isSpecific ? undefined : "Specify precise entities, quantities, or locations (e.g. 'in 3 bullet points' or 'for Surat city').",
        whyItMatters: "Specific prompts produce concrete, actionable answers instead of generic overviews."
    };

    // 4. Analyze Category: Constraints
    const constraintKeywords = ["under", "limit", "maximum", "minimum", "don't", "do not", "sentences", "words", "only"];
    const hasConstraints = constraintKeywords.some(kw => lowerPrompt.includes(kw));
    const constraints: PromptCategoryAnalysis = {
        status: hasConstraints ? "Good" : "Missing",
        explanation: hasConstraints
            ? "Explicit boundaries or length constraints were specified."
            : "No length limits or structural constraints were specified in the prompt.",
        suggestion: hasConstraints ? undefined : "Add a response boundary (e.g., 'Keep the explanation under 150 words').",
        whyItMatters: "Setting response constraints prevents unnecessarily long responses and saves API token costs."
    };

    // 5. Analyze Category: Output Format
    const formatKeywords = ["json", "markdown", "list", "bullet", "table", "csv", "code", "text", "html", "summary"];
    const hasFormat = formatKeywords.some(kw => lowerPrompt.includes(kw));
    const outputFormat: PromptCategoryAnalysis = {
        status: hasFormat ? "Good" : "Missing",
        explanation: hasFormat
            ? "A preferred output format (e.g. list, table, JSON, markdown) was specified."
            : "No output format was requested.",
        suggestion: hasFormat ? undefined : "Specify your desired output structure (e.g., 'Format your response as a bulleted list' or 'Return JSON').",
        whyItMatters: "Specifying output format eliminates post-processing work and simplifies application parsing."
    };

    // 6. Analyze Category: Audience
    const audienceKeywords = ["for beginners", "for kids", "for a 5-year-old", "for developers", "for senior engineers", "for students", "for executive"];
    const hasAudience = audienceKeywords.some(kw => lowerPrompt.includes(kw));
    const audience: PromptCategoryAnalysis = {
        status: hasAudience ? "Good" : "Missing",
        explanation: hasAudience
            ? "The intended reader audience was explicitly specified."
            : "Target audience was not specified in the prompt.",
        suggestion: hasAudience ? undefined : "Specify who the answer is for (e.g., 'Explain for a beginner' or 'For senior developers').",
        whyItMatters: "Defining the target audience adjusts the complexity of vocabulary and technical depth."
    };

    // 7. Analyze Category: Ambiguity
    const vagueWords = ["stuff", "things", "good", "nice", "somehow", "etc", "whatever"];
    const hasAmbiguity = vagueWords.some(vw => lowerPrompt.includes(vw));
    const ambiguity: PromptCategoryAnalysis = {
        status: hasAmbiguity ? "Needs Improvement" : "Good",
        explanation: hasAmbiguity
            ? "The prompt contains vague terms (e.g. 'stuff', 'things', 'good') that could lead to unpredictable results."
            : "No obvious vague or ambiguous filler words were detected.",
        suggestion: hasAmbiguity ? "Replace vague terms like 'stuff' or 'things' with concrete nouns." : undefined,
        whyItMatters: "Clear, unambiguous terms eliminate model guessing and improve response consistency."
    };

    // 8. Analyze Category: Prompt Length
    let lengthStatus: CategoryStatus = "Good";
    let lengthExplanation = "Prompt length is balanced.";
    if (words.length < 5) {
        lengthStatus = "Needs Improvement";
        lengthExplanation = "The prompt is extremely short (under 5 words). Short prompts often produce broad answers.";
    } else if (words.length > 150) {
        lengthStatus = "Needs Improvement";
        lengthExplanation = "The prompt is very long (over 150 words). Consider breaking complex instructions into bullet points.";
    }

    const promptLength: PromptCategoryAnalysis = {
        status: lengthStatus,
        explanation: lengthExplanation,
        suggestion: words.length < 5 ? "Expand your prompt by adding target context and output format." : undefined,
        whyItMatters: "Balanced prompt length provides enough context without diluting key instructions."
    };

    // Build Strengths, Improvements & Suggestions
    const strengths: string[] = [];
    const improvements: string[] = [];
    const suggestions: string[] = [];
    const educationalWhys: { suggestion: string; why: string }[] = [];

    if (clarity.status === "Good") strengths.push("✓ Clear objective command verb");
    else {
        improvements.push("• Objective verb can be clearer");
        if (clarity.suggestion) suggestions.push(clarity.suggestion);
        if (clarity.whyItMatters) educationalWhys.push({ suggestion: clarity.suggestion || "Use clear command verbs", why: clarity.whyItMatters });
    }

    if (specificity.status === "Good") strengths.push("✓ Specific target entities / details included");
    else {
        improvements.push("• Specificity can be improved");
        if (specificity.suggestion) suggestions.push(specificity.suggestion);
        if (specificity.whyItMatters) educationalWhys.push({ suggestion: specificity.suggestion || "Add specific details", why: specificity.whyItMatters });
    }

    if (constraints.status === "Good") strengths.push("✓ Explicit boundaries / constraints specified");
    else {
        improvements.push("• Response boundaries / constraints missing");
        if (constraints.suggestion) suggestions.push(constraints.suggestion);
        if (constraints.whyItMatters) educationalWhys.push({ suggestion: constraints.suggestion || "Add response length limits", why: constraints.whyItMatters });
    }

    if (outputFormat.status === "Good") strengths.push("✓ Preferred output format requested");
    else {
        improvements.push("• Target output format missing");
        if (outputFormat.suggestion) suggestions.push(outputFormat.suggestion);
        if (outputFormat.whyItMatters) educationalWhys.push({ suggestion: outputFormat.suggestion || "Specify output format", why: outputFormat.whyItMatters });
    }

    if (audience.status === "Good") strengths.push("✓ Target reader audience specified");
    else {
        improvements.push("• Target audience not specified");
        if (audience.suggestion) suggestions.push(audience.suggestion);
        if (audience.whyItMatters) educationalWhys.push({ suggestion: audience.suggestion || "Specify target audience", why: audience.whyItMatters });
    }

    // Calculate Heuristic Score (Informational Indicator)
    let goodCount = 0;
    const catList = [clarity, context, specificity, constraints, outputFormat, audience, ambiguity, promptLength];
    catList.forEach(c => { if (c.status === "Good") goodCount++; });
    const scoreVal = ((goodCount / catList.length) * 10).toFixed(1);
    const heuristicScore = `${scoreVal} / 10 (Heuristic Indicator)`;

    // Generate Suggested Prompt & Diff View
    let suggestedPrompt = promptInput;
    const additions: string[] = [];

    if (audience.status === "Missing") additions.push("for a beginner");
    if (outputFormat.status === "Missing") additions.push("formatted as a bulleted list");
    if (constraints.status === "Missing") additions.push("kept under 150 words");

    if (additions.length > 0) {
        suggestedPrompt = `${promptInput} Please explain this ${additions.join(", ")}.`;
    }

    return {
        promptInput: promptInput,
        heuristicScore: heuristicScore,
        strengths: strengths.length > 0 ? strengths : ["✓ Concise input text"],
        improvements: improvements,
        suggestions: suggestions,
        categories: {
            clarity: clarity,
            context: context,
            specificity: specificity,
            constraints: constraints,
            outputFormat: outputFormat,
            audience: audience,
            ambiguity: ambiguity,
            promptLength: promptLength
        },
        educationalWhys: educationalWhys,
        suggestedPrompt: suggestedPrompt !== promptInput ? suggestedPrompt : undefined,
        diffView: suggestedPrompt !== promptInput ? {
            original: promptInput,
            suggested: suggestedPrompt
        } : undefined
    };
}
