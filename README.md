# ExplainSDK & AI Agent SDK

> 🚀 **Production-Grade Open-Source AI Agent SDK Core & Developer Experience (DX) Observability Layer for TypeScript**

ExplainSDK is a Developer Experience (DX) layer and AI Agent SDK sitting directly on top of official provider SDKs (OpenAI, Anthropic, Gemini, Groq, Mistral). It provides a full-featured agent runtime engine paired with flight recorder observability, prompt analysis, behavior inspection, persistent memory, guardrails, resiliency retries, structured outputs, multi-agent handoffs, and typed runtime events.

---

## 📚 Table of Contents

- [Core Philosophy & Architecture](#-core-philosophy--architecture)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Core Features & API Reference](#-core-features--api-reference)
  - [1. Agent Runtime & Definition](#1-agent-runtime--definition)
  - [2. Typed Tool System](#2-typed-tool-system)
  - [3. Persistent Memory & Storage Adapters](#3-persistent-memory--storage-adapters)
  - [4. Session Recording ("Flight Recorder")](#4-session-recording-flight-recorder)
  - [5. Guardrails & Human-in-the-Loop Approval](#5-guardrails--human-in-the-loop-approval)
  - [6. Resiliency Engine & Loop Prevention](#6-resiliency-engine--loop-prevention)
  - [7. Structured Output & Schema Repair Engine](#7-structured-output--schema-repair-engine)
  - [8. Multi-Agent Handoffs & Loop Prevention](#8-multi-agent-handoffs--loop-prevention)
  - [9. Runtime Event Emitter & Tracing](#9-runtime-event-emitter--tracing)
  - [10. ExplainSDK Inspector Framework](#10-explainsdk-inspector-framework)
  - [11. Actionable Diagnostic Errors](#11-actionable-diagnostic-errors)
- [Runnable Examples Directory](#-runnable-examples-directory)
- [License](#-license)

---

## 🎯 Core Philosophy & Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                         AI AGENT SDK (RUNTIME CORE)                    │
│ ┌───────────────────┐ ┌──────────────────┐ ┌─────────────────────────┐ │
│ │  Agent Runtime    │ │ Memory & Storage │ │  Guardrails & Repair    │ │
│ └───────────────────┘ └──────────────────┘ └─────────────────────────┘ │
│ ┌───────────────────┐ ┌──────────────────┐ ┌─────────────────────────┐ │
│ │ Multi-Agent Loop  │ │ Tool Execution   │ │ Handoffs & Human-in-Loop│ │
│ └───────────────────┘ └──────────────────┘ └─────────────────────────┘ │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Tracing, Flight Recording & Telemetry)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        EXPLAINSDK (DX & OBSERVABILITY LAYER)           │
│ ┌───────────────────┐ ┌──────────────────┐ ┌─────────────────────────┐ │
│ │ Request Timeline  │ │ Session Recorder │ │  Inspector Framework    │ │
│ └───────────────────┘ └──────────────────┘ └─────────────────────────┘ │
│ ┌───────────────────┐ ┌──────────────────┐ ┌─────────────────────────┐ │
│ │ Token & Cost Track│ │ Prompt Advisor   │ │  Behavior Advisor       │ │
│ └───────────────────┘ └──────────────────┘ └─────────────────────────┘ │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Official Provider APIs (OpenAI)                   │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Single Responsibility**: `Agent` handles agent lifecycle, tool execution loops, memory, guardrails, handoffs, and schema repair. `ExplainSDK` handles flight recording, latency measurement, cost calculation, prompt analysis, and terminal telemetry.
2. **Single Class Rule**: `Agent` and `ExplainSDK` represent the primary entrypoints. Internal utilities are pure, stateless functions.
3. **Provider Compatibility**: All native provider options (`providerOptions`) pass directly through to official provider SDKs without restriction.

---

## 📦 Installation

```bash
npm install explain-sdk zod
```

---

## ⚡ Quick Start

```typescript
import { Agent, createAgentTool, ExplainSDK, formatInspection } from "explain-sdk";

// 1. Create a typed tool
const weatherTool = createAgentTool({
    name: "get_weather",
    description: "Get real-time weather forecast for a city",
    execute: async ({ city }: { city: string }) => {
        return `30°C, Sunny in ${city}`;
    }
});

// 2. Instantiate an Agent
const agent = new Agent({
    name: "WeatherAssistant",
    instructions: "You are a friendly weather assistant. Be concise and polite.",
    model: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY!,
    tools: [weatherTool]
});

// 3. Execute agent run
const result = await agent.run({
    input: "What is the weather in Surat today?"
});

console.log(result.output_text); // "The weather in Surat is 30°C and sunny today!"
console.log(`Run ID: ${result.runId}`);
console.log(`Estimated Cost: ${result.session.cost.formattedCost}`);
```

---

## 🔑 Core Features & API Reference

### 1. Agent Runtime & Definition

Define agents declaratively with system instructions, models, tools, memory, and guardrail policies.

```typescript
const agent = new Agent({
    name: "SupportAgent",
    instructions: "You are a customer support specialist.",
    model: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY!,
    provider: "openai",
    maxIterations: 10
});

const result = await agent.run({ input: "Hello!" });
```

---

### 2. Typed Tool System

Construct tools using `createAgentTool()` with Zod schema validation or JSON parameters.

```typescript
import { createAgentTool } from "explain-sdk";
import { z } from "zod";

const calcTool = createAgentTool({
    name: "calculate_tax",
    description: "Calculates tax for an amount",
    schema: z.object({ amount: z.number() }),
    execute: async ({ amount }: { amount: number }) => {
        return { tax: amount * 0.18, total: amount * 1.18 };
    }
});
```

---

### 3. Persistent Memory & Storage Adapters

Maintain multi-turn conversation context across sessions using `InMemoryStorageAdapter` or `FileStorageAdapter`.

```typescript
import { Agent, FileStorageAdapter } from "explain-sdk";

const fileStore = new FileStorageAdapter({ storageDir: "./my_sessions" });

const agent = new Agent({
    name: "MemoryAgent",
    apiKey: process.env.OPENAI_API_KEY!,
    memory: fileStore
});

// Turn 1
await agent.run({ input: "My name is Alice.", sessionId: "session_123" });

// Turn 2 (Remembers Alice automatically from disk)
const res = await agent.run({ input: "What is my name?", sessionId: "session_123" });
console.log(res.output_text); // "Your name is Alice."
```

---

### 4. Session Recording ("Flight Recorder")

Every request produces a structured `SessionRecord` capturing timeline events, performance metrics, token usage, USD costs, tool executions, and streaming metadata.

```typescript
import { exportSession } from "explain-sdk";

const result = await agent.run({ input: "Tell me a joke" });

console.log(result.session.id);                  // Unique session ID
console.log(result.session.cost.formattedCost);  // "$0.00003"
console.log(result.session.performance.durationMs); // 450ms

// Export flight recorder JSON artifact to disk
exportSession(result.session, "./sessions/flight_record.json");
```

---

### 5. Guardrails & Human-in-the-Loop Approval

Enforce pre-execution safety rules (`inputGuardrails`), post-execution checks (`outputGuardrails`), and human operator confirmation (`onApprovalRequired`) for sensitive actions.

```typescript
const deleteDatabaseTool = createAgentTool({
    name: "delete_database",
    description: "Deletes a database table",
    requiresApproval: true, // Pauses execution for Human-in-the-Loop approval
    execute: async ({ tableName }) => `Deleted ${tableName}`
});

const agent = new Agent({
    name: "AdminAgent",
    apiKey: process.env.OPENAI_API_KEY!,
    tools: [deleteDatabaseTool],
    inputGuardrails: [
        (input) => input.includes("hack") ? { passed: false, reason: "Security violation" } : { passed: true }
    ],
    onApprovalRequired: async ({ toolName, args }) => {
        console.log(`APPROVAL REQUIRED for ${toolName}(${JSON.stringify(args)})`);
        return false; // Denies execution safely without crashing the conversation
    }
});
```

---

### 6. Resiliency Engine & Loop Prevention

Automatically retry transient failures (HTTP 429 rate limits, 500/503 server errors) with exponential backoff and jitter, enforce per-turn request timeouts, and halt infinite runaway tool loops.

```typescript
const agent = new Agent({
    name: "ResilientAgent",
    apiKey: process.env.OPENAI_API_KEY!,
    retries: 3,                // 3 exponential backoff retries for transient errors
    timeoutMs: 15000,          // 15 second request timeout
    maxToolLoopThreshold: 3   // Halts execution if identical tool called >= 3 times
});
```

---

### 7. Structured Output & Schema Repair Engine

Guarantee that model responses conform strictly to a target Zod schema using `agent.runStructured()`. If generated output fails validation, Agent SDK automatically executes a repair retry loop using diagnostic model feedback.

```typescript
import { z } from "zod";

const UserSchema = z.object({
    name: z.string(),
    age: z.number(),
    skills: z.array(z.string())
});

type UserProfile = z.infer<typeof UserSchema>;

const result = await agent.runStructured({
    input: "Extract profile: Alex is 29, lives in Surat, knows TypeScript and Python.",
    schema: UserSchema,
    maxRepairAttempts: 2
});

const profile: UserProfile = result.data; // Strongly typed
console.log(profile.name);                // "Alex"
console.log(result.repairAttempts);       // 0 (or repair turns required)
```

---

### 8. Multi-Agent Handoffs & Loop Prevention

Transfer conversation control seamlessly between specialized agents (`TriageAgent` $\rightarrow$ `BillingAgent`) while preserving message history and preventing circular handoff loops.

```typescript
const billingAgent = new Agent({
    name: "BillingAgent",
    instructions: "Handle billing questions and refunds.",
    apiKey: process.env.OPENAI_API_KEY!
});

const triageAgent = new Agent({
    name: "TriageAgent",
    instructions: "Route customer questions. Hand off to BillingAgent for billing issues.",
    apiKey: process.env.OPENAI_API_KEY!,
    handoffs: [billingAgent] // Auto-generates transfer_to_BillingAgent tool
});

const result = await triageAgent.run({ input: "I need a refund for my invoice #1042." });

console.log(result.activeAgentName);          // "BillingAgent"
console.log(result.handoffChain.join(" -> ")); // "TriageAgent -> BillingAgent"
```

---

### 9. Runtime Event Emitter & Tracing

Listen to typed execution lifecycle events (`onRunStart`, `onToolStart`, `onToolComplete`, `onHandoff`, `onGuardrail`, `onRunComplete`, `onRunFailed`) with unique `runId` tracing.

```typescript
const agent = new Agent({ name: "FinanceAgent", apiKey: process.env.OPENAI_API_KEY! });

agent.on("onRunStart", (e) => console.log(`🚀 Run ID: ${e.runId}`));
agent.on("onToolStart", (e) => console.log(`🛠 Executing: ${e.toolName}()`));
agent.on("onToolComplete", (e) => console.log(`✅ Result:`, e.result));
agent.on("onRunComplete", (e) => console.log(`🏁 Duration: ${e.durationMs}ms`));

const result = await agent.run({ input: "Hello" });
```

---

### 10. ExplainSDK Inspector Framework

Inspect any `SessionRecord` using specialized inspector utilities:

```typescript
import { ExplainSDK, formatInspection } from "explain-sdk";

const sdk = new ExplainSDK({ apiKey: process.env.OPENAI_API_KEY! });

// Performance Inspector
const perf = sdk.inspect.performance(result.session);
console.log(formatInspection("performance", perf));

// Behavior Advisor (Post-Execution Runtime Analysis)
const behavior = sdk.inspect.behavior(result.session);
console.log(formatInspection("behavior", behavior));

// Prompt Advisor (Pre-Execution Static Analysis)
const promptAnalysis = sdk.inspect.prompt(result.session);
console.log(formatInspection("prompt", promptAnalysis));
```

---

### 11. Actionable Diagnostic Errors

Every error thrown by Agent SDK follows a strict 3-part diagnostic format:
1. **What Happened**: Clear explanation of the failure.
2. **Why**: Underlying root cause.
3. **How to Fix**: Exact corrective steps.

```text
[AgentSDK Tool Loop Error] Detected infinite tool execution loop for "get_weather()".

What Happened: The tool "get_weather()" was invoked 3 consecutive times with identical arguments: {"city":"Surat"}.
Why: The model is stuck in an infinite tool invocation cycle without making progress.
How to Fix: Provide more specific prompt context, refine tool return values, or increase maxToolLoopThreshold.
```

---

## 📂 Runnable Examples Directory

Run any example directly using `npx tsx`:

| Example File | Description | Command |
| :--- | :--- | :--- |
| `examples/01_quickstart_agent.ts` | Basic Agent setup, tool execution, and ExplainSDK telemetry | `npx tsx examples/01_quickstart_agent.ts` |
| `examples/02_memory_agent.ts` | Persistent multi-turn session memory with `FileStorageAdapter` | `npx tsx examples/02_memory_agent.ts` |
| `examples/03_guardrails_approval_agent.ts` | Input/Output Guardrails & Human-in-the-Loop tool approval | `npx tsx examples/03_guardrails_approval_agent.ts` |
| `examples/04_resiliency_agent.ts` | Transient retries, exponential backoff, timeouts & tool loop detection | `npx tsx examples/04_resiliency_agent.ts` |
| `examples/05_structured_output_agent.ts` | Strongly typed Zod schema extraction & automated repair loop | `npx tsx examples/05_structured_output_agent.ts` |
| `examples/06_multi_agent_handoff_agent.ts` | Multi-agent delegation, context transfer & handoff loop protection | `npx tsx examples/06_multi_agent_handoff_agent.ts` |
| `examples/07_events_tracing_agent.ts` | Typed runtime event emitter, `runId` tracing & inspector inspection | `npx tsx examples/07_events_tracing_agent.ts` |

---

## 📄 License

MIT © [Krizh27](https://github.com/Krizh27)
