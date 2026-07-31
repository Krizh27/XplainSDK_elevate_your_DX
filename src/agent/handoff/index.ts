/**
 * @file agent/handoff/index.ts
 * @description Barrel export file for Agent SDK Multi-Agent Handoff components.
 */

export * from "./types.js";
export { createHandoffTool } from "./tool.js";
export { detectHandoffLoop } from "./resolver.js";
