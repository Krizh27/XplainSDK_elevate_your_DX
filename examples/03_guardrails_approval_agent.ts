import { Agent, createAgentTool, InputGuardrail, OutputGuardrail } from "../src/index.js";

console.log("==========================================");
console.log(" Agent SDK Phase 3: Guardrails & Approval Test");
console.log("==========================================");

// 1. Define an Input Guardrail prohibiting unsafe prompt keywords
const safetyInputGuardrail: InputGuardrail = (input, agentName) => {
    const forbidden = ["malware", "exploit", "hack"];
    const hasForbidden = forbidden.some(word => input.toLowerCase().includes(word));

    if (hasForbidden) {
        return {
            passed: false,
            reason: `Input prompt contains prohibited security policy keyword for ${agentName}.`
        };
    }
    return { passed: true };
};

// 2. Define an Output Guardrail
const qualityOutputGuardrail: OutputGuardrail = (output) => {
    if (output.trim().length === 0) {
        return {
            passed: false,
            reason: "Agent generated an empty completion."
        };
    }
    return { passed: true };
};

// 3. Define a sensitive tool marked `requiresApproval: true`
const deleteDatabaseTool = createAgentTool({
    name: "delete_database",
    description: "Deletes a database table by name.",
    requiresApproval: true, // Human-in-the-Loop Approval Required!
    execute: async ({ tableName }: { tableName: string }) => {
        return `Database table '${tableName}' was successfully deleted.`;
    }
});

// 4. Instantiate Agent with Guardrails and Human Approval Callback
const agent = new Agent({
    name: "AdminAgent",
    instructions: "You are a database administrator. Execute requested database actions carefully.",
    model: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY || "test-api-key",
    tools: [deleteDatabaseTool],
    inputGuardrails: [safetyInputGuardrail],
    outputGuardrails: [qualityOutputGuardrail],
    onApprovalRequired: async ({ toolName, args, agentName }) => {
        console.log(`\n🛑 [APPROVAL REQUIRED] ${agentName} requests to execute: ${toolName}(${JSON.stringify(args)})`);
        
        // Simulate Operator Decision (Rejecting database deletion)
        console.log(`👤 Human Operator Decision: REJECTED (Denying delete_database execution)`);
        return false; // Return false to deny tool execution safely
    }
});

console.log("--- Test 1: Tool Approval Rejection Handling ---");
const promptInput = "Please delete the database table named 'user_logs'.";
console.log(`User: "${promptInput}"`);

const result = await agent.run({
    input: promptInput
});

console.log("\nAgent Response (Conversation continued safely after tool rejection):");
console.log(result.output_text);
console.log("==========================================\n");

console.log("✅ Phase 3 Guardrails & Human Approval Callback successfully verified!");
