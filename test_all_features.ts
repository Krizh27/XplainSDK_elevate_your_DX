import {
    Agent,
    createAgentTool,
    InMemoryStorageAdapter,
    FileStorageAdapter,
    loadSessionHistory,
    saveSessionHistory,
    runInputGuardrails,
    runOutputGuardrails,
    isTransientError,
    detectToolLoop,
    extractJSON,
    createHandoffTool,
    detectHandoffLoop,
    AgentEventEmitter,
    generateRunId,
    generateExplanation,
    formatExplainConsole,
    formatExplainMarkdown,
    reconstructReplay,
    formatReplayConsole,
    formatReplayMarkdown,
    generateHTMLReport,
    saveHTMLReport,
    analyzeDebug,
    formatDebugConsole,
    formatDebugMarkdown
} from "./src/index.js";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";

console.log("==========================================================");
console.log(" 🧪 XplainSDK & AI Agent SDK: Comprehensive Feature Suite");
console.log("==========================================================");

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string) {
    totalCount++;
    if (condition) {
        passedCount++;
        console.log(` ✅ TEST ${totalCount}: ${testName} - PASSED`);
    } else {
        console.error(` ❌ TEST ${totalCount}: ${testName} - FAILED`);
        process.exit(1);
    }
}

// -------------------------------------------------------------------
// TEST 1: Typed Tool Creation & Zod Schema Validation (Phase 1)
// -------------------------------------------------------------------
console.log("\n--- Phase 1: Tool System ---");
const calcTool = createAgentTool({
    name: "calculate_sum",
    description: "Adds two numbers together",
    schema: z.object({ a: z.number(), b: z.number() }),
    execute: async ({ a, b }) => a + b
});

assert(calcTool.name === "calculate_sum", "Tool name is correctly assigned");
assert(typeof calcTool.execute === "function", "Tool execute handler is a function");
const toolResult = await calcTool.execute({ a: 15, b: 25 });
assert(toolResult === 40, "Tool execution returns expected mathematical result (40)");

// -------------------------------------------------------------------
// TEST 2: Agent Instance Creation & Properties (Phase 1)
// -------------------------------------------------------------------
console.log("\n--- Phase 1: Agent Construction ---");
const agent = new Agent({
    name: "TestAgent",
    instructions: "You are a test assistant.",
    model: "gpt-4o-mini",
    apiKey: "test-api-key",
    tools: [calcTool]
});

assert(agent.name === "TestAgent", "Agent name is initialized");
assert(agent.tools.length === 1, "Agent tool registry contains 1 tool");

// -------------------------------------------------------------------
// TEST 3: Persistent Memory & Storage Adapters (Phase 2)
// -------------------------------------------------------------------
console.log("\n--- Phase 2: Memory System ---");
const inMemory = new InMemoryStorageAdapter();
await saveSessionHistory(inMemory, "sess_100", [
    { role: "user", content: "My favorite color is blue." },
    { role: "assistant", content: "Got it!" }
]);

const loadedHistory = await loadSessionHistory(inMemory, "sess_100");
assert(loadedHistory.length === 2, "InMemoryStorageAdapter loads saved multi-turn messages");
assert(loadedHistory[0].content === "My favorite color is blue.", "Memory preserves exact message content");

const testDir = "./temp_test_memory";
const fileStore = new FileStorageAdapter({ storageDir: testDir });
await saveSessionHistory(fileStore, "file_sess_1", [
    { role: "user", content: "Remember this file test." }
]);
const fileHistory = await loadSessionHistory(fileStore, "file_sess_1");
assert(fileHistory.length === 1 && fileHistory[0].content === "Remember this file test.", "FileStorageAdapter persists session to disk");
await fs.rm(testDir, { recursive: true, force: true });

// -------------------------------------------------------------------
// TEST 4: Guardrails Pipeline (Phase 3)
// -------------------------------------------------------------------
console.log("\n--- Phase 3: Guardrails ---");
const inputGuardrails = [
    (input: string) => input.includes("DROP TABLE") ? { passed: false, reason: "SQL Injection detected" } : { passed: true }
];

const cleanInput = await runInputGuardrails("Hello world", "TestAgent", inputGuardrails);
assert(cleanInput === "Hello world", "Clean input passes input guardrail pipeline");

let guardrailBlocked = false;
try {
    await runInputGuardrails("DROP TABLE users;", "TestAgent", inputGuardrails);
} catch (err: any) {
    guardrailBlocked = true;
    assert(err.message.includes("SQL Injection detected"), "Input guardrail rejects forbidden content with diagnostic error");
}
assert(guardrailBlocked, "Input guardrail throws error on rejection");

// -------------------------------------------------------------------
// TEST 5: Resiliency Engine & Loop Prevention (Phase 4)
// -------------------------------------------------------------------
console.log("\n--- Phase 4: Resiliency Engine ---");
assert(isTransientError(new Error("429 Too Many Requests")), "Rate limit 429 error identified as transient");
assert(isTransientError(new Error("503 Service Unavailable")), "Server 503 error identified as transient");
assert(!isTransientError(new Error("401 Unauthorized")), "Authentication 401 error identified as NON-transient");

let loopDetected = false;
try {
    const executedToolCalls = [
        { toolName: "get_weather", args: { city: "Surat" } },
        { toolName: "get_weather", args: { city: "Surat" } }
    ];
    detectToolLoop(executedToolCalls, { toolName: "get_weather", args: { city: "Surat" } }, 3);
} catch (err: any) {
    loopDetected = true;
    assert(err.message.includes("Detected infinite tool execution loop"), "Tool loop detector halts repeated identical calls");
}
assert(loopDetected, "Tool loop detector throws diagnostic error at threshold");

// -------------------------------------------------------------------
// TEST 6: Structured Output & JSON Repair (Phase 5)
// -------------------------------------------------------------------
console.log("\n--- Phase 5: Structured Output ---");
const rawJSON = "Here is your JSON: ```json\n{\"name\": \"Surat\", \"population\": 6000000}\n```";
const jsonStr = extractJSON(rawJSON);
const parsedObj = JSON.parse(jsonStr);
assert(parsedObj.name === "Surat" && parsedObj.population === 6000000, "extractJSON strips markdown blocks and parses clean JSON object");

// -------------------------------------------------------------------
// TEST 7: Multi-Agent Handoffs & Loop Prevention (Phase 6)
// -------------------------------------------------------------------
console.log("\n--- Phase 6: Multi-Agent Handoffs ---");
const targetAgent = new Agent({ name: "BillingAgent", apiKey: "test" });
const handoffTool = createHandoffTool(targetAgent);
assert(handoffTool.name === "transfer_to_BillingAgent", "createHandoffTool generates transfer_to_<agent> tool name");

let handoffLoopDetected = false;
try {
    detectHandoffLoop(["TriageAgent", "BillingAgent", "TriageAgent"], "BillingAgent", 5);
} catch (err: any) {
    handoffLoopDetected = true;
    assert(err.message.includes("Handoff Loop Error"), "detectHandoffLoop halts circular delegation stacks");
}
assert(handoffLoopDetected, "Handoff loop detector triggers at depth limit");

// -------------------------------------------------------------------
// TEST 8: Runtime Event Emitter & Tracing (Phase 7)
// -------------------------------------------------------------------
console.log("\n--- Phase 7: Event Emitter & Run IDs ---");
const runId = generateRunId();
assert(runId.startsWith("run_"), "generateRunId creates valid run_ prefix string");

const emitter = new AgentEventEmitter();
let eventFired = false;
emitter.on("onRunStart", (payload) => {
    eventFired = payload.runId === "run_test_123";
});
await emitter.emit("onRunStart", {
    runId: "run_test_123",
    agentName: "TestAgent",
    input: "Hi",
    timestamp: new Date().toISOString()
});
assert(eventFired, "AgentEventEmitter emits typed event payloads to listeners");

// -------------------------------------------------------------------
// TEST 9: Explain Mode Telemetry & Formatters (Phase 9)
// -------------------------------------------------------------------
console.log("\n--- Phase 9: Explain Mode ---");
const mockSession: any = {
    id: "sess_mock_1",
    sdkVersion: "1.0.0",
    timestamp: new Date().toISOString(),
    provider: "openai",
    model: "gpt-4o-mini",
    request: { input: "What is the weather in Surat?" },
    response: { output_text: "30°C, Sunny" },
    timelineEvents: [],
    tokenUsage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    cost: { rawCost: 0.0001, formattedCost: "$0.00010" },
    toolCalls: [{
        toolName: "get_weather",
        args: { city: "Surat" },
        startTimeFormatted: "12:00:00",
        endTimeFormatted: "12:00:01",
        durationMs: 12,
        success: true,
        result: "30°C, Sunny"
    }],
    streamingMetadata: { isStreaming: false }
};

const explanation = generateExplanation(mockSession);
assert(explanation.summary.includes("processed the request"), "generateExplanation synthesizes executive summary paragraph");
assert(explanation.tools.length === 1 && explanation.tools[0].includes("get_weather"), "Explain Mode captures executed tool list");

const consoleBox = formatExplainConsole(explanation);
assert(consoleBox.includes("🧠 Explain Mode Execution Summary"), "formatExplainConsole renders pretty terminal text box");

const mdReport = formatExplainMarkdown(explanation);
assert(mdReport.includes("# 🧠 Agent Execution Explanation Report"), "formatExplainMarkdown renders markdown report document");

// -------------------------------------------------------------------
// TEST 10: Session Replay Engine & Formatters (Phase 10)
// -------------------------------------------------------------------
console.log("\n--- Phase 10: Session Replay ---");
const replayData = reconstructReplay(mockSession);
assert(replayData.sessionId === "sess_mock_1", "reconstructReplay captures session ID");
assert(replayData.totalSteps === 3, "reconstructReplay reconstructs chronological step array (3 steps)");
assert(replayData.steps[1].title === "Tool Called: get_weather()", "Session Replay step 2 identifies tool call execution");

const replayConsole = formatReplayConsole(replayData);
assert(replayConsole.includes("🎬 Session Replay"), "formatReplayConsole renders pretty step-by-step terminal playback");

const replayMd = formatReplayMarkdown(replayData);
assert(replayMd.includes("# 🎬 Session Replay Report"), "formatReplayMarkdown renders markdown replay report");

// -------------------------------------------------------------------
// TEST 11: Interactive Standalone HTML Report Generator (Phase 12)
// -------------------------------------------------------------------
console.log("\n--- Phase 12: Interactive HTML Report Generator ---");
const htmlDoc = generateHTMLReport(mockSession);
assert(htmlDoc.includes("<!DOCTYPE html>"), "generateHTMLReport generates valid standalone HTML document");
assert(htmlDoc.includes("XplainSDK"), "HTML report embeds XplainSDK branding");
assert(htmlDoc.includes("get_weather"), "HTML report renders tool execution details");
assert(htmlDoc.includes("sess_mock_1"), "HTML report renders session ID");

const reportPath = "./temp_test_report.html";
await saveHTMLReport(mockSession, { outputPath: reportPath });
const fileExists = await fs.stat(reportPath).then(() => true).catch(() => false);
assert(fileExists, "saveHTMLReport writes standalone report.html to disk");
await fs.rm(reportPath, { force: true });

// -------------------------------------------------------------------
// TEST 12: Smart Debug Assistant (Phase 13)
// -------------------------------------------------------------------
console.log("\n--- Phase 13: Smart Debug Assistant ---");
const debugReport = analyzeDebug(mockSession);
assert(debugReport.summary.includes("processed in"), "analyzeDebug generates evidence-based summary");
assert(debugReport.nextInspections.length > 0, "analyzeDebug generates next inspection recommendations");
assert(debugReport.learningTips.length > 0, "analyzeDebug generates educational learning tips");

const debugConsole = formatDebugConsole(debugReport);
assert(debugConsole.includes("🐞 Smart Debug Assistant Report"), "formatDebugConsole renders pretty terminal diagnostic box");

const debugMd = formatDebugMarkdown(debugReport);
assert(debugMd.includes("# 🐞 Smart Debug Assistant Report"), "formatDebugMarkdown renders markdown debug report");

// -------------------------------------------------------------------
// FINAL VERIFICATION SUMMARY
// -------------------------------------------------------------------
console.log("\n==========================================================");
console.log(` 🎉 ALL ${passedCount}/${totalCount} FEATURE SUITE TESTS PASSED PERFECTLY!`);
console.log("==========================================================");
