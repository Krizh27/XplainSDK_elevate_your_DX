import { Agent, createAgentTool, XplainSDK, formatInspection } from "./src/index.js";

console.log("==========================================");
console.log(" Testing Agent SDK Phase 1 Core Runtime");
console.log("==========================================");

// 1. Create a typed AgentTool using createAgentTool() helper
const weatherTool = createAgentTool({
    name: "get_weather",
    description: "Get current weather forecast for a specified city.",
    execute: async (args: { city: string }) => {
        return `30°C, Sunny in ${args.city}`;
    }
});

// 2. Instantiate an Agent instance
const agent = new Agent({
    name: "WeatherAssistantAgent",
    instructions: "You are a friendly weather assistant. Be concise and polite.",
    model: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY || "test-api-key",
    tools: [weatherTool]
});

console.log(`Agent Created: "${agent.name}" (Model: ${agent.model})\n`);

// 3. Execute agent run
const promptInput = "What is the weather in Surat today?";
console.log(`Executing Agent Run with prompt: "${promptInput}"...\n`);

const result = await agent.run({
    input: promptInput
});

console.log("==========================================");
console.log(" Agent Output Response");
console.log("==========================================");
console.log(result.output_text);

console.log("\n==========================================");
console.log(" Observability Telemetry (via XplainSDK)");
console.log("==========================================");
console.log(`Session ID:     ${result.session.id}`);
console.log(`Agent Name:     ${result.agentName}`);
console.log(`Total Tokens:   ${result.session.tokenUsage.total_tokens}`);
console.log(`Estimated Cost: ${result.session.cost.formattedCost}`);
console.log("==========================================\n");

// 4. Use XplainSDK Inspectors on the returned Agent session
const sdk = new XplainSDK({ apiKey: process.env.OPENAI_API_KEY || "test-api-key" });

const behaviorData = sdk.inspect.behavior(result.session);
console.log(formatInspection("behavior", behaviorData));
console.log("");

const perfData = sdk.inspect.performance(result.session);
console.log(formatInspection("performance", perfData));
