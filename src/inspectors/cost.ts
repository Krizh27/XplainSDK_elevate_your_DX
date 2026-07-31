import { SessionRecord, CostInspectionData } from "../types.js";

/**
 * @file inspectors/cost.ts
 * @description Specialized pure-function inspector for estimated API cost metrics.
 * 
 * ARCHITECTURAL RULE: Data -> Formatter -> UI
 * Receives a SessionRecord object and returns pure, structured CostInspectionData.
 * Performs ZERO console.log calls and ZERO network requests.
 */

/**
 * Inspects estimated API dollar cost calculated during a request session.
 * 
 * @param session SessionRecord flight recorder object.
 * @returns Structured CostInspectionData object.
 */
export function inspectCost(session: SessionRecord): CostInspectionData {
    const cost = session.cost || { rawCost: 0, formattedCost: "$0.00000" };

    return {
        rawCost: cost.rawCost,
        formattedCost: cost.formattedCost
    };
}
