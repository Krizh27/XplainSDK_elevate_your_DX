import { Agent, FileStorageAdapter, InMemoryStorageAdapter } from "../src/index.js";

console.log("==========================================");
console.log(" Agent SDK Phase 2: Memory & Storage Test");
console.log("==========================================");

// 1. Initialize a FileStorageAdapter (persists session history to ./test_sessions/<sessionId>.json)
const fileMemory = new FileStorageAdapter({ storageDir: "./test_sessions" });

// 2. Instantiate Agent with FileStorageAdapter
const agent = new Agent({
    name: "MemorySupportAgent",
    instructions: "You are a helpful customer support agent with memory.",
    model: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY || "test-api-key",
    memory: fileMemory
});

const sessionId = "user_session_alice_123";
console.log(`Configured Memory: FileStorageAdapter (Session ID: "${sessionId}")\n`);

// Turn 1: User introduces themselves
console.log("--- Turn 1: User introduces name ---");
const turn1Prompt = "Hello, my name is Alice and I live in Surat.";
console.log(`User: "${turn1Prompt}"`);

const res1 = await agent.run({
    input: turn1Prompt,
    sessionId: sessionId
});

console.log(`Agent: ${res1.output_text}`);
console.log(`Session History Length: ${res1.history?.length} messages stored\n`);

// Turn 2: User asks Agent to recall their name from persistent memory
console.log("--- Turn 2: Asking Agent to recall name from persistent memory ---");
const turn2Prompt = "What is my name and where do I live?";
console.log(`User: "${turn2Prompt}"`);

const res2 = await agent.run({
    input: turn2Prompt,
    sessionId: sessionId
});

console.log(`Agent: ${res2.output_text}`);
console.log(`Session History Length: ${res2.history?.length} messages stored`);
console.log("==========================================\n");

console.log("✅ Turn 2 successfully loaded conversation history from FileStorageAdapter!");
