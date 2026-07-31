import { Agent, createAgentTool, ExplainSDK, formatInspection } from "../src/index.js";

console.log("==========================================");
console.log(" Agent SDK Phase 7: Events & Tracing Test");
console.log("==========================================");

// 1. Create a tool
const calcTool = createAgentTool({
    name: "calculate_tax",
    description: "Calculates total tax for an amount",
    execute: async ({ amount }: { amount: number }) => {
        return { taxAmount: amount * 0.18, totalWithTax: amount * 1.18 };
    }
});

// 2. Instantiate Agent
const agent = new Agent({
    name: "FinanceAgent",
    instructions: "You are a finance assistant. Calculate requested taxes using calculate_tax tool.",
    model: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY || "test-api-key",
    tools: [calcTool]
});

// 3. Subscribe to Runtime Lifecycle Events
agent.on("onRunStart", (event) => {
    console.log(`\n🚀 [EVENT: onRunStart] Run ID: ${event.runId} | Agent: ${event.agentName} | Prompt: "${event.input}"`);
});

agent.on("onToolStart", (event) => {
    console.log(`🛠 [EVENT: onToolStart] Tool: ${event.toolName}() | Args:`, event.args);
});

agent.on("onToolComplete", (event) => {
    console.log(`✅ [EVENT: onToolComplete] Tool: ${event.toolName}() | Result:`, event.result);
});

agent.on("onRunComplete", (event) => {
    console.log(`🏁 [EVENT: onRunComplete] Duration: ${event.durationMs} ms | Tokens: ${event.session.tokenUsage.total_tokens}`);
});

// 4. Execute Agent Run
const promptInput = "Calculate the 18% tax for $500.";
const result = await agent.run({ input: promptInput });

console.log("\n==========================================");
console.log(" Agent Execution Result");
console.log("==========================================");
console.log(`Run ID:                 ${result.runId}`);
console.log(`Session ID:             ${result.session.id}`);
console.log(`Estimated Cost:         ${result.session.cost.formattedCost}`);
console.log(`Output:\n${result.output_text}`);

// 5. Use ExplainSDK Inspectors on the returned Agent session
const sdk = new ExplainSDK({ apiKey: process.env.OPENAI_API_KEY || "test-api-key" });
const perfData = sdk.inspect.performance(result.session);
console.log("\n==========================================");
console.log(" ExplainSDK Inspector Output");
console.log("==========================================");
console.log(formatInspection("performance", perfData));
console.log("==========================================\n");

console.log("✅ Phase 7 Events & Observability Integration successfully verified!");
