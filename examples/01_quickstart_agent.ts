import { Agent, createAgentTool, ExplainSDK, formatInspection } from "../src/index.js";

console.log("==========================================");
console.log(" Agent SDK Phase 8: Quickstart Example");
console.log("==========================================");

// 1. Define a tool using createAgentTool()
const stockTool = createAgentTool({
    name: "get_stock_price",
    description: "Get real-time stock price for a ticker symbol",
    execute: async ({ ticker }: { ticker: string }) => {
        return { ticker: ticker.toUpperCase(), price: "$182.50", change: "+1.4%" };
    }
});

// 2. Instantiate an Agent
const agent = new Agent({
    name: "FinancialAssistant",
    instructions: "You are a financial advisor assistant. Answer user stock questions politely.",
    model: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY || "test-api-key",
    tools: [stockTool]
});

// 3. Execute agent run
const result = await agent.run({
    input: "What is the stock price for AAPL?"
});

console.log("==========================================");
console.log(" Agent Output Response");
console.log("==========================================");
console.log(result.output_text);

console.log("\n==========================================");
console.log(" Telemetry & ExplainSDK Inspectors");
console.log("==========================================");
console.log(`Run ID:         ${result.runId}`);
console.log(`Session ID:     ${result.session.id}`);
console.log(`Tokens Used:    ${result.session.tokenUsage.total_tokens}`);
console.log(`Estimated Cost: ${result.session.cost.formattedCost}`);

const sdk = new ExplainSDK({ apiKey: process.env.OPENAI_API_KEY || "test-api-key" });
const perfData = sdk.inspect.performance(result.session);
console.log("\nPerformance Inspection:");
console.log(formatInspection("performance", perfData));
console.log("==========================================\n");

console.log("✅ Quickstart agent successfully executed!");
