import { Agent } from "../src/index.js";
import { z } from "zod";

console.log("==========================================");
console.log(" Agent SDK Phase 5: Structured Output Test");
console.log("==========================================");

// 1. Define target Zod schema
const UserProfileSchema = z.object({
    name: z.string().describe("User's full name"),
    age: z.number().describe("User's age in years"),
    city: z.string().describe("Current city of residence"),
    skills: z.array(z.string()).describe("Technical skills")
});

// Infer TypeScript type automatically
type UserProfile = z.infer<typeof UserProfileSchema>;

// 2. Instantiate Agent
const agent = new Agent({
    name: "DataExtractionAgent",
    instructions: "You are an expert data extraction agent. Extract requested user profile information.",
    model: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY || "test-api-key"
});

// 3. Execute structured output run
const textToExtract = "Extract profile: Alex Rivera is 29 years old, lives in Surat, and specializes in TypeScript, Node.js, and AI SDK development.";
console.log(`Input Text: "${textToExtract}"\n`);

const result = await agent.runStructured({
    input: textToExtract,
    schema: UserProfileSchema,
    maxRepairAttempts: 2
});

// 4. Strongly typed TypeScript output guarantees
const userProfile: UserProfile = result.data;

console.log("==========================================");
console.log(" Strongly Typed Extracted Data");
console.log("==========================================");
console.log(`Name:            ${userProfile.name}`);
console.log(`Age:             ${userProfile.age}`);
console.log(`City:            ${userProfile.city}`);
console.log(`Skills:          ${userProfile.skills.join(", ")}`);
console.log(`Repair Attempts: ${result.repairAttempts}`);
console.log(`Session ID:      ${result.session.id}`);
console.log("==========================================\n");

console.log("✅ Phase 5 Structured Output & Schema Repair Engine successfully verified!");
