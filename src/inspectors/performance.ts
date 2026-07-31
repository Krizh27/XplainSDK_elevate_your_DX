import { SessionRecord, PerformanceInspectionData } from "../types.js";

/**
 * @file inspectors/performance.ts
 * @description Specialized pure-function inspector for request performance and latency metrics.
 * 
 * ARCHITECTURAL RULE: Data -> Formatter -> UI
 * Receives a SessionRecord object and returns pure, structured PerformanceInspectionData.
 * Performs ZERO console.log calls and ZERO network requests.
 */

/**
 * Inspects performance, latency, and output text metrics recorded during a request session.
 * 
 * @param session SessionRecord flight recorder object.
 * @returns Structured PerformanceInspectionData object.
 */
export function inspectPerformance(session: SessionRecord): PerformanceInspectionData {
    const metrics = session.performanceMetrics;
    const latency = metrics?.latencyMs ?? 0;

    // Determine performance health status based on latency thresholds
    let status: "Healthy" | "Degraded" | "Slow" = "Healthy";
    if (latency > 5000) {
        status = "Slow";
    } else if (latency > 2500) {
        status = "Degraded";
    }

    const latencyFormatted = (latency / 1000).toFixed(2) + " s";

    return {
        latencyMs: latency,
        latencyFormatted: latencyFormatted,
        totalChunks: metrics?.totalChunks ?? session.streamingMetadata.totalChunks,
        charactersReturned: metrics?.charactersReturned ?? session.response.output_text.length,
        wordsReturned: metrics?.wordsReturned ?? 0,
        status: status
    };
}
