import { TimelineEvent, TimelineState, PerformanceMetrics, ToolInspectionResult } from "./types.js";

/**
 * @file timeline.ts
 * @description Pure functional module for request timeline logging and performance metric formatting.
 */

/**
 * Helper function to format a Date into high-precision HH:MM:SS.mmm format.
 * 
 * @param date Date object to format.
 * @returns Formatted timestamp string (e.g. "12:42:13.102").
 */
export function formatDetailedTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const ms = date.getMilliseconds().toString().padStart(3, "0");
    return `${hours}:${minutes}:${seconds}.${ms}`;
}

/** Helper function to format a Date into [HH:MM:SS] format for event logs. */
function formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `[${hours}:${minutes}:${seconds}]`;
}

/** Creates and initializes a fresh timeline state object. */
export function createTimeline(): TimelineState {
    return {
        events: [],
        startTimeMs: 0,
        endTimeMs: 0,
        startTimeFormatted: "",
        endTimeFormatted: "",
        toolInspections: []
    };
}

/** Records a timestamped event entry into the timeline state. */
export function recordEvent(timeline: TimelineState, message: string): void {
    timeline.events.push({
        timestamp: new Date(),
        message: message
    });
}

/** Records tool inspection telemetry into the timeline state. */
export function recordToolInspection(timeline: TimelineState, inspection: ToolInspectionResult): void {
    if (!timeline.toolInspections) {
        timeline.toolInspections = [];
    }
    timeline.toolInspections.push(inspection);
}

/** Starts the latency timer and captures high-precision start timestamp. */
export function startTimer(timeline: TimelineState): void {
    const now = new Date();
    timeline.startTimeMs = performance.now();
    timeline.startTimeFormatted = formatDetailedTime(now);
}

/** Stops the latency timer and captures high-precision end timestamp. */
export function stopTimer(timeline: TimelineState): void {
    const now = new Date();
    timeline.endTimeMs = performance.now();
    timeline.endTimeFormatted = formatDetailedTime(now);
}

/** Calculates latency in rounded milliseconds. */
export function getLatencyMs(timeline: TimelineState): number {
    if (timeline.startTimeMs === 0 || timeline.endTimeMs === 0) {
        return 0;
    }
    return Math.round(timeline.endTimeMs - timeline.startTimeMs);
}

/** Stores calculated performance and cost metrics inside the timeline state. */
export function recordMetrics(timeline: TimelineState, metrics: PerformanceMetrics): void {
    timeline.metrics = metrics;
}

/** Prints the formatted timeline report including performance, word counts, token usage, and cost. */
export function printTimeline(timeline: TimelineState): void {
    console.log("══════════════════════════════════════════");
    console.log(" ExplainSDK Timeline");
    console.log("══════════════════════════════════════════");
    console.log("");

    for (const event of timeline.events) {
        console.log(formatTime(event.timestamp));
        console.log(event.message);
        console.log("");
    }

    if (timeline.metrics) {
        const m = timeline.metrics;

        console.log("Request Started:");
        console.log(m.startTimeFormatted);
        console.log("");

        console.log("Response Received:");
        console.log(m.endTimeFormatted);
        console.log("");

        console.log("Latency:");
        console.log(`${m.latencyMs} ms`);
        console.log("");

        if (m.totalChunks !== undefined) {
            console.log("Total Chunks:");
            console.log(m.totalChunks);
            console.log("");
        }

        console.log("Characters Returned:");
        console.log(m.charactersReturned);
        console.log("");

        console.log("Words Returned:");
        console.log(m.wordsReturned);
        console.log("");

        console.log("Prompt Tokens:");
        console.log(m.promptTokens);
        console.log("");

        console.log("Completion Tokens:");
        console.log(m.completionTokens);
        console.log("");

        console.log("Total Tokens:");
        console.log(m.totalTokens);
        console.log("");

        console.log("Estimated Cost:");
        console.log(m.estimatedCostFormatted);
        console.log("");
    } else {
        console.log("Latency:");
        console.log(`${getLatencyMs(timeline)} ms`);
        console.log("");
    }

    console.log("══════════════════════════════════════════");
}
