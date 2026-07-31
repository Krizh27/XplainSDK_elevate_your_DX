import { Agent, createAgentTool } from "../src/index.js";

console.log("==========================================");
console.log(" Agent SDK Phase 10: Session Replay Test");
console.log("==========================================");

// 1. Create a tool
const searchTool = createAgentTool({
    name: "search_kb",
    description: "Search knowledge base for articles",
    execute: async ({ query }: { query: string }) => {
        return { title: "Reset Password Guide", url: "https://kb.example.com/reset" };
    }
});

// 2. Instantiate Agent
const agent = new Agent({
    name: "SupportAgent",
    instructions: "You are a customer support agent. Search knowledge base using search_kb when requested.",
    model: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY || "test-api-key",
    tools: [searchTool]
});

// 3. Execute agent run
const result = await agent.run({
    input: "Search the KB for password reset steps."
});

console.log("\n--- Option 1: Calling result.replay() (Step-by-Step Terminal Playback) ---");
result.replay();

console.log("\n--- Option 2: Calling result.replay.markdown() (Markdown Report) ---");
console.log(result.replay.markdown());

console.log("\n--- Option 3: Calling result.replay.json() (Structured Steps Data) ---");
const replayJson = result.replay.json();
console.log(`Total Replay Steps: ${replayJson.totalSteps}`);
console.log(`First Step: ${replayJson.steps[0].title} - ${replayJson.steps[0].detail}`);

console.log("\n--- Option 4: Calling agent.replay(session) ---");
const directReplay = agent.replay(result.session);
console.log(`Direct Replay Steps: ${directReplay.totalSteps}\n`);

console.log("✅ Phase 10 Session Replay successfully verified!");
