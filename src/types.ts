/**
 * @file types.ts
 * @description Centralized TypeScript type definitions, interface contracts, and state schemas for XplainSDK.
 */

export type StreamSpeedPreset = "instant" | "fast" | "normal" | "slow";

export const STREAM_SPEED_PRESETS: Record<StreamSpeedPreset, number> = {
    instant: 0,
    fast: 10,
    normal: 25,
    slow: 50
};

export interface StreamRenderingOptions {
    speed?: StreamSpeedPreset;
    delayMs?: number;
}

export interface XplainSDKOptions {
    provider?: string;
    apiKey: string;
    model?: string;
    streamSpeed?: StreamSpeedPreset;
    streamDelayMs?: number;
    rendering?: StreamRenderingOptions;
    providerOptions?: Record<string, any>;
}

export interface ChatOptions {
    input: string;
    model?: string;
    streamSpeed?: StreamSpeedPreset;
    streamDelayMs?: number;
    rendering?: StreamRenderingOptions;
    providerOptions?: Record<string, any>;
}

export interface TokenUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

export interface PerformanceMetrics {
    startTimeFormatted: string;
    endTimeFormatted: string;
    latencyMs: number;
    totalChunks?: number;
    charactersReturned: number;
    wordsReturned: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostFormatted: string;
}

export interface TimelineEvent {
    timestamp: Date;
    message: string;
}

export interface ToolDefinition<TArgs = Record<string, any>, TResult = any> {
    name: string;
    description: string;
    schema?: any;
    parameters?: Record<string, any>;
    execute: (args: TArgs) => Promise<TResult> | TResult;
}

export interface ToolInspectionResult {
    toolName: string;
    reason?: string;
    args: Record<string, any>;
    startTimeFormatted: string;
    endTimeFormatted: string;
    durationMs: number;
    success: boolean;
    result?: string;
    error?: string;
}

export interface TimelineState {
    events: TimelineEvent[];
    startTimeMs: number;
    endTimeMs: number;
    startTimeFormatted: string;
    endTimeFormatted: string;
    metrics?: PerformanceMetrics;
    toolInspections?: ToolInspectionResult[];
}

export interface SessionRecord {
    id: string;
    sdkVersion: string;
    timestamp: string;
    provider: string;
    model: string;
    request: {
        input: string;
        model: string;
        streamSpeed?: string;
        streamDelayMs?: number;
        providerOptions?: Record<string, any>;
    };
    response: {
        output_text: string;
    };
    timelineEvents: TimelineEvent[];
    performanceMetrics?: PerformanceMetrics;
    tokenUsage: TokenUsage;
    cost: {
        rawCost: number;
        formattedCost: string;
    };
    toolCalls: ToolInspectionResult[];
    streamingMetadata: {
        isStreaming: boolean;
        totalChunks?: number;
        chunks?: string[];
    };
}

export interface ChatResponse {
    output_text: string;
    session: SessionRecord;
    raw_response?: any;
}

/* ==========================================================================
   INSPECTOR FRAMEWORK TYPES (PHASE 8, 9 & 9.5)
   ========================================================================== */

export interface TimelineInspectionData {
    sessionTimestamp: string;
    eventCount: number;
    events: {
        timestampFormatted: string;
        message: string;
    }[];
}

export interface PerformanceInspectionData {
    latencyMs: number;
    latencyFormatted: string;
    totalChunks?: number;
    charactersReturned: number;
    wordsReturned: number;
    status: "Healthy" | "Degraded" | "Slow";
}

export interface TokensInspectionData {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

export interface CostInspectionData {
    rawCost: number;
    formattedCost: string;
}

export interface ToolsInspectionData {
    totalToolsExecuted: number;
    executions: {
        toolName: string;
        args: Record<string, any>;
        startTimeFormatted: string;
        endTimeFormatted: string;
        durationMs: number;
        status: "Success" | "Failed";
        returned: string;
    }[];
}

export type CategoryStatus = "Good" | "Needs Improvement" | "Missing";

export interface PromptCategoryAnalysis {
    status: CategoryStatus;
    explanation: string;
    suggestion?: string;
    whyItMatters?: string;
}

export interface PromptAnalysisData {
    promptInput: string;
    heuristicScore: string;
    strengths: string[];
    improvements: string[];
    suggestions: string[];
    categories: {
        clarity: PromptCategoryAnalysis;
        context: PromptCategoryAnalysis;
        specificity: PromptCategoryAnalysis;
        constraints: PromptCategoryAnalysis;
        outputFormat: PromptCategoryAnalysis;
        audience: PromptCategoryAnalysis;
        ambiguity: PromptCategoryAnalysis;
        promptLength: PromptCategoryAnalysis;
    };
    educationalWhys: {
        suggestion: string;
        why: string;
    }[];
    suggestedPrompt?: string;
    diffView?: {
        original: string;
        suggested: string;
    };
}

/* ==========================================================================
   BEHAVIOR ADVISOR TYPES (PHASE 9.5)
   Runtime execution observation and interpretation schemas.
   ========================================================================== */

export type ConfidenceLevel = "High" | "Medium" | "Low";

export type BehaviorCategory = 
    | "Unexpected Tool Call" 
    | "Ignored Constraint" 
    | "High Latency" 
    | "Ambiguous Context" 
    | "Response Length";

export interface BehaviorObservation {
    fact: string;
    category: BehaviorCategory;
    confidence: ConfidenceLevel;
    possibleCause: string;
    suggestion: string;
    reason: string;
}

export interface BehaviorAnalysisData {
    sessionTimestamp: string;
    hasAnomalies: boolean;
    observations: BehaviorObservation[];
    summary: string;
}
