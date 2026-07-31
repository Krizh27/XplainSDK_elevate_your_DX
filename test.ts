import { ExplainSDK, formatInspection, exportSession } from "./src/index.js";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

/**
 * Interactive model selector function using Node.js native readline module.
 */
async function selectModelFromTerminal(): Promise<string> {
    const cliArgModel = process.argv[2];
    if (cliArgModel) {
        console.log(`Using model specified via CLI argument: ${cliArgModel}\n`);
        return cliArgModel;
    }

    const rl = readline.createInterface({ input, output });

    console.log("==========================================");
    console.log(" Select OpenAI Model for ExplainSDK (Phase 9.5)");
    console.log("==========================================");
    console.log("1. gpt-4o-mini  (Recommended: Fast & Token-Efficient)");
    console.log("2. gpt-4o       (Standard Multimodal)");
    console.log("3. gpt-3.5-turbo (Legacy)");
    console.log("4. Enter custom model name");
    console.log("==========================================");

    const answer = await rl.question("\nEnter choice (1-4) or press Enter for default [gpt-4o-mini]: ");
    rl.close();

    const choice = answer.trim();

    if (choice === "2") return "gpt-4o";
    if (choice === "3") return "gpt-3.5-turbo";
    if (choice === "4") {
        const rlCustom = readline.createInterface({ input, output });
        const customName = await rlCustom.question("Enter custom model name: ");
        rlCustom.close();
        return customName.trim() || "gpt-4o-mini";
    }

    return "gpt-4o-mini";
}

/**
 * Interactive prompt input reader function.
 */
async function getUserPromptFromTerminal(): Promise<string> {
    const rl = readline.createInterface({ input, output });
    const userPrompt = await rl.question("\nEnter your prompt (or press Enter for default: 'What was the ability of Pinocchio?'): ");
    rl.close();

    return userPrompt.trim() || "What was the ability of Pinocchio?";
}

// 1. Interactive Model Selection
const selectedModel = await selectModelFromTerminal();
console.log(`\n-> Selected Model: ${selectedModel}`);

// 2. Interactive Prompt Entry
const userPrompt = await getUserPromptFromTerminal();
console.log(`-> Prompt: "${userPrompt}"\n`);

// 3. Initialize ExplainSDK
const sdk = new ExplainSDK({
    provider: "openai",
    apiKey: process.env.OPENAI_API_KEY || "test-api-key",
    model: selectedModel
});

// 4. Register a tool (registered to test tool invocation behavior)
sdk.registerTool({
    name: "weather",
    description: "Get the current weather forecast for a given city.",
    parameters: {
        type: "object",
        properties: {
            city: { type: "string", description: "City name" }
        },
        required: ["city"]
    },
    execute: async (args: { city: string }) => {
        return `30°C, Humidity 72% in ${args.city}`;
    }
});

console.log("--- Executing Request with Behavior Advisor: sdk.chat(...) ---\n");

// 5. Execute chat request
const result = await sdk.chat({
    input: userPrompt
});

console.log("Model Text Response:");
console.log(result.output_text);
console.log("\n");

// 6. Inspect structured Session data using Behavior Advisor & Inspectors

// Behavior Advisor Report (Post-Execution Runtime Analysis)
const behaviorData = sdk.inspect.behavior(result.session);
console.log(formatInspection("behavior", behaviorData));
console.log("");

// Prompt Advisor Report (Pre-Execution Static Analysis)
const promptData = sdk.inspect.prompt(result.session);
console.log(formatInspection("prompt", promptData));
console.log("");

// Performance Inspector Report
const perfData = sdk.inspect.performance(result.session);
console.log(formatInspection("performance", perfData));
console.log("");

// 7. Optionally export Session flight recorder data to JSON file
try {
    const exportedPath = await exportSession(result.session);
    console.log(`✅ Session Flight Recorder exported to: ${exportedPath}\n`);
} catch (err: any) {
    console.error(`❌ Session Export Error: ${err.message}\n`);
}