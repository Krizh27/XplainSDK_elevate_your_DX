import OpenAI from "openai";

/**
 * provider.ts
 * 
 * WHY THIS FILE EXISTS:
 * This file encapsulates direct communication with the external LLM provider (OpenAI).
 * 
 * WHY A FUNCTION INSTEAD OF A CLASS (e.g. OpenAIProvider)?
 * Calling an API endpoint is a stateless action: you pass input arguments (client, model, prompt)
 * and receive a response string back.
 * Creating an `OpenAIProvider` class would add unnecessary abstraction without adding any value.
 * A single, clear function `callOpenAI()` keeps the network integration obvious and minimal.
 */

/**
 * Sends a chat prompt to OpenAI's Chat Completion API and returns the generated text response.
 * 
 * @param openai Initialized OpenAI SDK client instance.
 * @param model The model identifier (e.g. "gpt-4o", "gpt-5").
 * @param input The text prompt to send.
 * @returns Promise resolving to the generated text content string.
 */
export async function callOpenAI(openai: OpenAI, model: string, input: string): Promise<string> {
    const completion = await openai.chat.completions.create({
        model: model,
        messages: [
            {
                role: "user",
                content: input
            }
        ]
    });

    // Extract text from the first choice returned by OpenAI, defaulting to empty string if missing.
    return completion.choices[0]?.message?.content ?? "";
}
