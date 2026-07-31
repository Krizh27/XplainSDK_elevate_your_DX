# XplainSDK & AI Agent SDK

> 🚀 **Production-Grade Open-Source AI Agent SDK Core & Developer Experience (DX) Observability Layer for TypeScript**

[![npm version](https://img.shields.io/npm/v/xplain-sdk.svg?style=flat-square)](https://www.npmjs.com/package/xplain-sdk)
[![license](https://img.shields.io/github/license/Krizh27/XplainSDK_elevate_your_DX.svg?style=flat-square)](LICENSE)
[![CI Pipeline](https://github.com/Krizh27/XplainSDK_elevate_your_DX/actions/workflows/ci.yml/badge.svg)](https://github.com/Krizh27/XplainSDK_elevate_your_DX/actions)

XplainSDK is a Developer Experience (DX) layer and AI Agent SDK sitting directly on top of official provider SDKs (OpenAI, Anthropic, Gemini, Groq, Mistral). It provides a full-featured agent runtime engine paired with flight recorder observability, prompt analysis, behavior inspection, persistent memory, guardrails, resiliency retries, structured outputs, multi-agent handoffs, typed runtime events, **Explain Mode**, **Session Replay**, **Interactive HTML Reports**, and **Smart Debug Assistant**.

---

## 📚 Table of Contents

- [Mission: Why XplainSDK Exists](#-mission-why-xplainsdk-exists)
- [Comparison with Existing Frameworks](#-comparison-with-existing-frameworks)
- [Core Philosophy & Architecture](#-core-philosophy--architecture)
- [Installation](#-installation)
- [5-Minute Quick Start Tutorial](#-5-minute-quick-start-tutorial)
- [Core Concepts & API Reference](#-core-concepts--api-reference)
  - [1. Agent Runtime & Definition](#1-agent-runtime--definition)
  - [2. Typed Tool System](#2-typed-tool-system)
  - [3. Persistent Memory & Storage Adapters](#3-persistent-memory--storage-adapters)
  - [4. Session Recording ("Flight Recorder")](#4-session-recording-flight-recorder)
  - [5. Guardrails & Human-in-the-Loop Approval](#5-guardrails--human-in-the-loop-approval)
  - [6. Resiliency Engine & Loop Prevention](#6-resiliency-engine--loop-prevention)
  - [7. Structured Output & Schema Repair Engine](#7-structured-output--schema-repair-engine)
  - [8. Multi-Agent Handoffs & Loop Prevention](#8-multi-agent-handoffs--loop-prevention)
  - [9. Runtime Event Emitter & Tracing](#9-runtime-event-emitter--tracing)
  - [10. Explain Mode (Executive Summaries)](#10-explain-mode-executive-summaries)
  - [11. Session Replay (Step-by-Step Reconstruction)](#11-session-replay-step-by-step-reconstruction)
  - [12. Interactive HTML Reports (Standalone report.html)](#12-interactive-html-reports-standalone-reporthtml)
  - [13. Smart Debug Assistant (Troubleshooting Guide)](#13-smart-debug-assistant-troubleshooting-guide)
  - [14. XplainSDK Inspector Framework](#14-xplainsdk-inspector-framework)
  - [15. Actionable Diagnostic Errors](#15-actionable-diagnostic-errors)
- [Runnable Examples Directory](#-runnable-examples-directory)
- [Roadmap & Contributing](#-roadmap--contributing)
- [License](#-license)

---

## 🎯 Mission: Why XplainSDK Exists

Building reliable AI agents is notoriously difficult. Most existing frameworks treat LLM execution loops as black boxes: when an agent hangs, loops infinitely, selects the wrong tool, or fails a schema validation, developers are left digging through fragmented console logs or parsing raw JSON telemetry.

**XplainSDK** was designed from the ground up to **make the invisible visible**. It provides:
1. **Runtime Execution Engine**: Complete lifecycle control for agents, tools, memory storage adapters, guardrails, resiliency retries, structured outputs, and multi-agent delegation chains.
2. **Flight Recorder Observability**: Automatic recording of request timelines, latency distribution, token usage, dollar costs, and behavioral diagnostics.
3. **Developer-First Tools**: Explain Mode summaries, deterministic Session Replay, standalone zero-CDN HTML reports (`report.html`), and an evidence-based Smart Debug Assistant.

---

## 🆚 Comparison with Existing Frameworks

| Feature | XplainSDK | OpenAI SDK | OpenAI Agents SDK | Vercel AI SDK | LangGraph |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Agent Runtime Loop** | ✅ Included | ❌ Raw API | ✅ Basic Loop | ⚡ React UI focus | ⚠️ Graph state machine |
| **Flight Recorder Telemetry** | ✅ Automatic | ❌ None | ❌ None | ❌ None | ❌ Extra setup |
| **Explain Mode** | ✅ Built-in | ❌ None | ❌ None | ❌ None | ❌ None |
| **Session Replay Engine** | ✅ Zero side effects | ❌ None | ❌ None | ❌ None | ❌ None |
| **Standalone HTML Report** | ✅ Zero CDN file | ❌ None | ❌ None | ❌ None | ❌ None |
| **Smart Debug Assistant** | ✅ Evidence-based | ❌ None | ❌ None | ❌ None | ❌ None |
| **3-Part Diagnostic Errors** | ✅ What/Why/Fix | ❌ Generic | ❌ Generic | ❌ Generic | ❌ Stack traces |
| **Dependencies** | Minimal (`zod`, `openai`) | Raw API | Heavy | Vercel ecosystem | Complex graph engine |

---

## 🏛 Core Philosophy & Architecture

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
                                    │ (Tracing, Flight Recording & Diagnostics)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         XPLAINSDK (DX & OBSERVABILITY LAYER)           │
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

1. **Single Responsibility**: `Agent` manages agent identity, system instructions, tool selection loops, memory storage adapters, guardrails, resiliency, and handoffs. `XplainSDK` manages session telemetry, costs, prompt analysis, terminal output, and HTML report rendering.
2. **Single Class Rule**: `Agent` and `XplainSDK` are the **ONLY CLASSES** in the entire codebase. All helper modules are pure, stateless functions.
3. **Evidence-Based Diagnostics**: Smart Debug Assistant and Explain Mode consume recorded facts from `SessionRecord`. They **never** fabricate explanations or invent unevidenced recommendations.

---

## 📦 Installation

```bash
npm install xplain-sdk zod
```

---

## ⚡ 5-Minute Quick Start Tutorial

Create a file named `app.ts`:

```typescript
import { Agent, createAgentTool } from "xplain-sdk";
import { z } from "zod";

// Step 1: Define a typed tool with Zod parameter validation
const discountTool = createAgentTool({
    name: "calculate_discount",
    description: "Calculates the final discounted price for an item",
    schema: z.object({
        price: z.number().describe("Original item price in USD"),
        percent: z.number().describe("Discount percentage (0-100)")
    }),
    execute: async ({ price, percent }) => {
        const discountAmount = price * (percent / 100);
        return { originalPrice: price, discountAmount, finalPrice: price - discountAmount };
    }
});

// Step 2: Instantiate an Agent
const agent = new Agent({
    name: "ShoppingAssistant",
    instructions: "You are a helpful shopping assistant. Use calculate_discount to compute sales prices.",
    model: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY!,
    tools: [discountTool]
});

// Step 3: Execute Agent Run with Smart Debug Assistant enabled
const result = await agent.run({
    input: "Calculate a 20% discount on a $150 item.",
    debug: true
});

// Step 4: Display Output
console.log("\nResponse:", result.output_text);

// Step 5: Generate standalone HTML report file
await result.report({ outputPath: "./my_agent_report.html" });
```

Run the application:
```bash
export OPENAI_API_KEY="your-api-key"
npx tsx app.ts
```

---

## 🔑 Core Concepts & API Reference

### 1. Agent Runtime & Definition

Define agents declaratively with identity, system instructions, tools, persistent memory, and resiliency parameters.

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

Construct type-safe tools using `createAgentTool()` with Zod schemas or raw JSON schemas.

```typescript
import { createAgentTool } from "xplain-sdk";
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

Retain multi-turn conversation context across sessions using `InMemoryStorageAdapter` or `FileStorageAdapter`.

```typescript
import { Agent, FileStorageAdapter } from "xplain-sdk";

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
import { exportSession } from "xplain-sdk";

const result = await agent.run({ input: "Tell me a joke" });

console.log(result.session.id);                     // Unique session ID
console.log(result.session.cost.formattedCost);     // "$0.00003"
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

### 10. Explain Mode (Executive Summaries)

Explain Mode synthesizes an executive summary explaining what happened, why decisions were made, tools executed, handoffs triggered, observations, and recommendations.

```typescript
const result = await agent.run({ input: "What is the weather?", explain: true });

// Option 1: Pretty terminal output
result.explain();

// Option 2: Markdown report
const mdReport = result.explain.markdown();

// Option 3: Structured JSON data payload
const jsonPayload = result.explain.json();
```

---

### 11. Session Replay (Step-by-Step Reconstruction)

Reconstruct an entire agent execution step by step with **zero side effects** and **zero provider re-calls**.

```typescript
const result = await agent.run({ input: "Search KB for password reset" });

// Option 1: Step-by-Step Terminal Playback
result.replay();

// Option 2: Markdown Replay Report
const markdownReplay = result.replay.markdown();

// Option 3: Structured Replay Steps Data
const replayData = result.replay.json();
```

---

### 12. Interactive HTML Reports (Standalone report.html)

Generate a single self-contained, interactive HTML developer dashboard (`report.html`) complete with dark mode, search filter, sticky sidebar navigation, collapsible JSON, and copy buttons—without requiring any external CDNs or backend server!

```typescript
const result = await agent.run({ input: "Calculate discount on item" });

// Option 1: Save standalone HTML report to disk
await result.report({ outputPath: "./agent_report.html" });

// Option 2: Get raw HTML string
const htmlString = result.report.html();
```

---

### 13. Smart Debug Assistant (Troubleshooting Guide)

Smart Debug Assistant analyzes execution facts to guide developers on root causes, recommended next inspectors, educational learning tips, and actionable suggestions.

```typescript
const result = await agent.run({ input: "What is the weather?", debug: true });

// Option 1: Pretty terminal diagnostic box
result.debug();

// Option 2: Markdown diagnostic report
const debugMd = result.debug.markdown();

// Option 3: Structured DebugReport JSON data
const debugReport = result.debug.json();
console.log(debugReport.nextInspections[0].command);

// Option 4: Direct agent debug analysis
const report = agent.debug(result.session);
```

#### Terminal Console Debug Output Example:
```text
────────────────────────────────────────────────────────────
🐞 Smart Debug Assistant Report
────────────────────────────────────────────────────────────

What Happened
Request processed in 580 ms utilizing 214 tokens ($0.00003). No critical anomalies or failures were detected during execution.

Detected Issues
  ✓ No critical execution issues detected.

Recommended Next Inspection
  🔍 [Performance Inspector] Execution completed cleanly. Inspect performance and token metrics.
     Command: const perfData = sdk.inspect.performance(result.session);

Educational Learning Tips
  🎓 Regular inspection of token usage helps optimize API dollar costs.

Diagnostic Confidence: HIGH
────────────────────────────────────────────────────────────
```

---

### 14. XplainSDK Inspector Framework

Inspect any `SessionRecord` using specialized inspector utilities:

```typescript
import { XplainSDK, formatInspection } from "xplain-sdk";

const sdk = new XplainSDK({ apiKey: process.env.OPENAI_API_KEY! });

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

### 15. Actionable Diagnostic Errors

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
| `examples/01_quickstart_agent.ts` | Basic Agent setup, tool execution, and XplainSDK telemetry | `npx tsx examples/01_quickstart_agent.ts` |
| `examples/02_memory_agent.ts` | Persistent multi-turn session memory with `FileStorageAdapter` | `npx tsx examples/02_memory_agent.ts` |
| `examples/03_guardrails_approval_agent.ts` | Input/Output Guardrails & Human-in-the-Loop tool approval | `npx tsx examples/03_guardrails_approval_agent.ts` |
| `examples/04_resiliency_agent.ts` | Transient retries, exponential backoff, timeouts & tool loop detection | `npx tsx examples/04_resiliency_agent.ts` |
| `examples/05_structured_output_agent.ts` | Strongly typed Zod schema extraction & automated repair loop | `npx tsx examples/05_structured_output_agent.ts` |
| `examples/06_multi_agent_handoff_agent.ts` | Multi-agent delegation, context transfer & handoff loop protection | `npx tsx examples/06_multi_agent_handoff_agent.ts` |
| `examples/07_events_tracing_agent.ts` | Typed runtime event emitter, `runId` tracing & inspector inspection | `npx tsx examples/07_events_tracing_agent.ts` |
| `examples/08_explain_mode_agent.ts` | Explain Mode execution summary, `result.explain()`, Markdown & JSON | `npx tsx examples/08_explain_mode_agent.ts` |
| `examples/09_session_replay_agent.ts` | Deterministic Session Replay playback, `result.replay()`, Markdown & JSON | `npx tsx examples/09_session_replay_agent.ts` |
| `examples/10_html_report_agent.ts` | Standalone Interactive HTML Report generation (`report.html`) | `npx tsx examples/10_html_report_agent.ts` |
| `examples/11_debug_assistant_agent.ts` | Smart Debug Assistant diagnostics, `result.debug()`, Markdown & JSON | `npx tsx examples/11_debug_assistant_agent.ts` |

---

## 🗺 Roadmap & Contributing

Please check our [ROADMAP.md](ROADMAP.md) for upcoming features and version plans. We welcome community contributions! Refer to [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and standards.

---

## 📄 License

MIT © [Krizh27](https://github.com/Krizh27) & XplainSDK Contributors
