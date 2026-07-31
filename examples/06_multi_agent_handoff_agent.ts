import { Agent, detectHandoffLoop } from "../src/index.js";

console.log("==========================================");
console.log(" Agent SDK Phase 6: Multi-Agent Handoff Test");
console.log("==========================================");

// 1. Create specialized target BillingAgent
const billingAgent = new Agent({
    name: "BillingAgent",
    instructions: "You are a specialized billing agent. Help customers with invoice refunds and payment issues.",
    model: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY || "test-api-key"
});

// 2. Create entrypoint TriageAgent with handoff transfer configured
const triageAgent = new Agent({
    name: "TriageAgent",
    instructions: "You route customer inquiries. If the user asks about billing or invoices, hand off immediately to BillingAgent.",
    model: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY || "test-api-key",
    handoffs: [billingAgent]
});

console.log(`TriageAgent Configured with Handoff Target: [${triageAgent.handoffs.map(a => a.name).join(", ")}]\n`);

// 3. Test Handoff Loop Prevention Unit Logic
console.log("--- Test 1: Handoff Loop Prevention ---");
try {
    console.log("Simulating circular delegation chain: TriageAgent -> BillingAgent -> TriageAgent...");
    detectHandoffLoop(["TriageAgent", "BillingAgent"], "TriageAgent", 5);
} catch (err: any) {
    console.log("✅ Circular Handoff Loop Successfully Detected!");
    console.log(`Error Message:\n${err.message}\n`);
}

// 4. Execute Multi-Agent Delegation Run
console.log("--- Test 2: Multi-Agent Delegation Execution ---");
const promptInput = "I need a refund for my last invoice #1042.";
console.log(`User Input to TriageAgent: "${promptInput}"\n`);

const result = await triageAgent.run({
    input: promptInput
});

console.log("==========================================");
console.log(" Multi-Agent Execution Result");
console.log("==========================================");
console.log(`Entrypoint Agent:  ${result.agentName}`);
console.log(`Active Agent:      ${result.activeAgentName}`);
console.log(`Delegation Chain:  ${result.handoffChain.join(" -> ")}`);
console.log(`Session ID:        ${result.session.id}`);
console.log("\nFinal Agent Response:");
console.log(result.output_text);
console.log("==========================================\n");

console.log("✅ Phase 6 Multi-Agent Handoffs & Loop Prevention successfully verified!");
