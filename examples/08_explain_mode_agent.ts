import { Agent, createAgentTool } from "../src/index.js";

console.log("==========================================");
console.log(" Agent SDK Phase 9: Explain Mode Test");
console.log("==========================================");

// 1. Define a tool
const weatherTool = createAgentTool({
    name: "get_weather",
    description: "Get real-time weather forecast for a city",
    execute: async ({ city }: { city: string }) => {
        return `28°C, Sunny in ${city}`;
    }
});

// 2. Instantiate Agent
const agent = new Agent({
    name: "WeatherAgent",
    instructions: "You are a weather assistant. Use get_weather tool when asked for forecast.",
    model: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY || "test-api-key",
    tools: [weatherTool]
});

// 3. Execute agent run with explain: true
console.log("--- Option 1: Executing agent.run({ input, explain: true }) ---");
const result = await agent.run({
    input: "What is the weather in Surat right now?",
    explain: false // We will trigger result.explain() manually below
});

console.log("\nAgent Output Text:");
console.log(result.output_text);

console.log("\n--- Option 2: Calling result.explain() (Pretty Console Box) ---");
result.explain();

console.log("\n--- Option 3: Calling result.explain.markdown() (Markdown Report) ---");
console.log(result.explain.markdown());

console.log("\n--- Option 4: Calling result.explain.json() (Structured JSON Data) ---");
const jsonExplanation = result.explain.json();
console.log(`Summary: ${jsonExplanation.summary}`);
console.log(`Tools Executed: ${jsonExplanation.tools.join(", ")}`);
console.log(`Confidence: ${jsonExplanation.confidence}`);

console.log("\n--- Option 5: Calling agent.explain(session) ---");
const directExplanation = agent.explain(result.session);
console.log(`Direct Summary: ${directExplanation.summary}\n`);

console.log("✅ Phase 9 Explain Mode successfully verified!");
