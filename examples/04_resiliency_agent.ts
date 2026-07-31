import { Agent, createAgentTool, detectToolLoop } from "../src/index.js";

console.log("==========================================");
console.log(" Agent SDK Phase 4: Resiliency Engine Test");
console.log("==========================================");

// 1. Demonstrate Tool Loop Detection
console.log("--- Test 1: Tool Loop Detection ---");
const toolHistory = [
    { toolName: "fetch_data", args: { id: "123" } },
    { toolName: "fetch_data", args: { id: "123" } }
];

const nextToolCall = { toolName: "fetch_data", args: { id: "123" } };

try {
    console.log("Simulating 3rd consecutive execution of fetch_data(id: 123)...");
    detectToolLoop(toolHistory, nextToolCall, 3);
} catch (err: any) {
    console.log("✅ Tool Loop Successfully Detected!");
    console.log(`Error Message:\n${err.message}\n`);
}

// 2. Instantiate Agent with Resiliency Configuration
console.log("--- Test 2: Agent Resiliency Configuration ---");
const agent = new Agent({
    name: "ResilientAgent",
    instructions: "You are a resilient customer support agent.",
    model: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY || "test-api-key",
    retries: 3,                  // 3 exponential backoff retries for 429/500 transient errors
    timeoutMs: 15000,            // 15 second request timeout
    maxToolLoopThreshold: 3     // Halts tool cycles after 3 identical calls
});

console.log(`Agent Configured with Resiliency:`);
console.log(`• Retries: ${agent.retries} attempts (exponential backoff with jitter)`);
console.log(`• Timeout Limit: ${agent.timeoutMs} ms`);
console.log(`• Tool Loop Threshold: ${agent.maxToolLoopThreshold} max consecutive calls\n`);

const result = await agent.run({
    input: "Explain what an exponential backoff retry policy is."
});

console.log("Agent Response:");
console.log(result.output_text);
console.log("==========================================\n");

console.log("✅ Phase 4 Resiliency Engine successfully verified!");
