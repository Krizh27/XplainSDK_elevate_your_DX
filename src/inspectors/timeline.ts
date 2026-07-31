import { SessionRecord, TimelineInspectionData } from "../types.js";

/**
 * @file inspectors/timeline.ts
 * @description Specialized pure-function inspector for request timeline events.
 * 
 * ARCHITECTURAL RULE: Data -> Formatter -> UI
 * Receives a SessionRecord object and returns pure, structured TimelineInspectionData.
 * Performs ZERO console.log calls and ZERO network requests.
 */

/**
 * Inspects timeline events recorded during a request session.
 * 
 * @param session SessionRecord flight recorder object.
 * @returns Structured TimelineInspectionData object.
 */
export function inspectTimeline(session: SessionRecord): TimelineInspectionData {
    const formattedEvents = (session.timelineEvents || []).map(event => {
        const date = new Date(event.timestamp);
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const seconds = date.getSeconds().toString().padStart(2, "0");

        return {
            timestampFormatted: `[${hours}:${minutes}:${seconds}]`,
            message: event.message
        };
    });

    return {
        sessionTimestamp: session.timestamp,
        eventCount: formattedEvents.length,
        events: formattedEvents
    };
}
