import { Agent, createAgentTool } from "../src/index.js";

console.log("==========================================");
console.log(" Agent SDK Phase 13: Smart Debug Assistant Test");
console.log("==========================================");

// 1. Define a tool
const weatherTool = createAgentTool({
    name: "get_weather",
    description: "Get current weather for a city",
    execute: async ({ city }: { city: string }) => {
        return `32°C, Clear in ${city}`;
    }
});

// 2. Instantiate Agent
const agent = new Agent({
    name: "DebugAssistantAgent",
    instructions: "You are a helpful assistant. Use get_weather when asked about forecast.",
    model: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY || "test-api-key",
    tools: [weatherTool]
});

// 3. Execute agent run with debug: false (we will call result.debug() manually)
const result = await agent.run({
    input: "What is the weather in Surat?",
    debug: false
});

console.log("--- Option 1: Calling result.debug() (Pretty Diagnostic Terminal Box) ---");
result.debug();

console.log("\n--- Option 2: Calling result.debug.markdown() (Markdown Diagnostic Report) ---");
console.log(result.debug.markdown());

console.log("\n--- Option 3: Calling result.debug.json() (Structured JSON Debug Data) ---");
const debugJson = result.debug.json();
console.log(`Summary: ${debugJson.summary}`);
console.log(`Confidence: ${debugJson.confidence}`);
console.log(`Recommended Next Inspection: ${debugJson.nextInspections[0].target} -> Command: ${debugJson.nextInspections[0].command}`);

console.log("\n--- Option 4: Calling agent.debug(session) ---");
const directDebug = agent.debug(result.session);
console.log(`Direct Summary: ${directDebug.summary}\n`);

console.log("✅ Phase 13 Smart Debug Assistant successfully verified!");
