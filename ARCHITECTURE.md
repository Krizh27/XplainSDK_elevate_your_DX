# ExplainSDK & Agent SDK - Internal Architecture & Design Documentation

> 🧭 **Project Compass**: Refer to [VISION.md](file:///c:/Users/meena/Downloads/AI_SDK_TEST/VISION.md) for the core project mission, target audience, problem scope, and non-goals.

---

## 🎯 Core Project Philosophy: DX Layer + Agent Core

```text
┌────────────────────────────────────────────────────────────────────────┐
│                         AI AGENT SDK (NEW CORE)                        │
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
│                        EXPLAINSDK (EXISTING DX LAYER)                  │
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

---

## 📍 Project Phases & Current Status

| Phase | Description | Status |
| :--- | :--- | :--- |
| **Vision** | Core Mission & Project Boundaries ([VISION.md](file:///c:/Users/meena/Downloads/AI_SDK_TEST/VISION.md)) | ✅ Established |
| **ExplainSDK** | DX Layer, Flight Recorder, Inspectors, Prompt/Behavior Advisors | ✅ Completed |
| **Agent Phase 1** | Core Agent Runtime, Tool System & Execution Loop (`Agent`, `createAgentTool`, `runAgentLoop`) | ✅ Completed |
| **Agent Phase 2** | Persistent Memory & Storage Adapters (`StorageAdapter`, `InMemoryStorageAdapter`, `FileStorageAdapter`) | ✅ Completed |
| **Agent Phase 3** | Guardrails & Human-in-the-Loop Approval (`inputGuardrails`, `outputGuardrails`, `onApprovalRequired`) | ✅ Completed |
| **Agent Phase 4** | Resiliency Engine (`withRetryAndTimeout`, `detectToolLoop`, `isTransientError`) | ✅ Completed (Current) |

---

## ⚡ Resiliency Architecture (Agent Phase 4)

```text
agent.run({ input })
       │
       ▼
 1. runInputGuardrails()  [Fails fast, zero retries]
       │
       ▼
 2. withRetryAndTimeout(fn, { retries: 3, timeoutMs: 30000 })
       │
       ├── Timeout exceeded? ──► Throw [AgentSDK Timeout Error]
       │
       ├── Transient 429/503 Error? ──► Exponential Backoff (200ms -> 400ms -> 800ms) ──► Retry
       │
       └── Validation / Auth Error? ──► Throw immediately (No retry)
             │
             ▼
 3. detectToolLoop(toolHistory, nextToolCall, threshold)
       │
       ├── Same tool & args >= 3 times consecutively?
       │     └── Throw [AgentSDK Tool Loop Error] (Halts runaway loops)
       │
       └── Normal call ──► Execute Tool
```

### Key Principles Implemented
1. **Transient Error Retries Only**: Retries rate limits (429), server errors (500/502/503/504), and connection timeouts using exponential backoff with random jitter (`delay = initialDelay * 2^attempt + jitter`).
2. **Never Retry Validation Failures**: Failures like Guardrail errors, Zod schema validation errors, 401 invalid API keys, and 404 bad models fail fast immediately.
3. **Tool Loop Detection**: Prevents infinite runaway billing loops by tracking state signatures (`toolName:JSON.stringify(args)`). Halts execution if identical tools/args are invoked consecutively $\ge 3$ times.
4. **Timeout Wrapper**: Enforces per-turn `timeoutMs` bounds, throwing an actionable diagnostic error if exceeded.

---

## 📁 Project Structure

```
c:\Users\meena\Downloads\AI_SDK_TEST\
├── package.json          # Package dependencies (openai, tsx, typescript)
├── tsconfig.json          # TypeScript ES Module compiler settings
├── VISION.md             # Core project mission compass & non-goals
├── ARCHITECTURE.md       # (This file) Complete architectural documentation
├── test.ts               # Interactive ExplainSDK test script
├── test_agent.ts         # Agent SDK Phase 1 test script
├── examples/
│   ├── 02_memory_agent.ts         # Multi-turn memory example
│   ├── 03_guardrails_approval_agent.ts # Guardrails & Approval example
│   └── 04_resiliency_agent.ts     # [NEW IN AGENT PHASE 4] Resiliency & Loop Detection example
└── src/
    ├── index.ts          # Public barrel export
    ├── client.ts         # ExplainSDK CLASS
    ├── session.ts        # Session flight recorder & exportSession helper
    ├── inspectors/       # Inspector Framework directory
    ├── providers/        # Provider translation adapters
    └── agent/            # [AGENT SDK CORE]
        ├── agent.ts      # Agent class definition
        ├── tool.ts       # createAgentTool() typed definition helper
        ├── runner.ts     # runAgentLoop() pure orchestrator function
        ├── types.ts      # AgentConfig, RunContext, AgentRunResult
        ├── memory/       # Persistent Memory & Storage Adapters
        ├── guardrails/   # Guardrails & Human-in-the-Loop Approval
        └── resiliency/   # [NEW IN AGENT PHASE 4]
            ├── types.ts       # ResiliencyOptions, ToolCallSignature
            ├── retry.ts       # withRetryAndTimeout(), isTransientError()
            ├── loopDetector.ts# detectToolLoop()
            └── index.ts       # Resiliency barrel export
```
