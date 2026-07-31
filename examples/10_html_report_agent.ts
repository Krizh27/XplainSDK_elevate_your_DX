import { Agent, createAgentTool } from "../src/index.js";

console.log("==========================================");
console.log(" Agent SDK Phase 12: Interactive HTML Report Test");
console.log("==========================================");

// 1. Define a tool
const calcTool = createAgentTool({
    name: "calculate_discount",
    description: "Calculates discount price for an order",
    execute: async ({ price, percent }: { price: number; percent: number }) => {
        return { originalPrice: price, discountAmount: price * (percent / 100), finalPrice: price * (1 - percent / 100) };
    }
});

// 2. Instantiate Agent
const agent = new Agent({
    name: "ShoppingAssistantAgent",
    instructions: "You are a shopping assistant. Calculate discounts using calculate_discount tool.",
    model: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY || "test-api-key",
    tools: [calcTool]
});

// 3. Execute Agent Run
const result = await agent.run({
    input: "Calculate a 20% discount on a $150 item."
});

console.log("\n--- Option 1: Calling await result.report({ outputPath: './my_agent_report.html' }) ---");
await result.report({ outputPath: "./my_agent_report.html" });
console.log("✅ Standalone HTML report successfully written to './my_agent_report.html'!");

console.log("\n--- Option 2: Calling result.report.html() (Raw HTML string length) ---");
const htmlString = result.report.html();
console.log(`Generated HTML Document Length: ${htmlString.length} characters`);

console.log("\n--- Option 3: Calling await agent.generateReport(session, { outputPath: './direct_agent_report.html' }) ---");
await agent.generateReport(result.session, { outputPath: "./direct_agent_report.html" });
console.log("✅ Direct agent HTML report written to './direct_agent_report.html'!\n");

console.log("✅ Phase 12 Interactive HTML Report successfully verified!");
