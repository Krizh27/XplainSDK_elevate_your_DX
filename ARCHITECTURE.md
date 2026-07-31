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
| **Agent Phase 4** | Resiliency Engine (`withRetryAndTimeout`, `detectToolLoop`, `isTransientError`) | ✅ Completed |
| **Agent Phase 5** | Structured Output & Schema Repair Engine (`agent.runStructured`, Zod validation, repair loop) | ✅ Completed (Current) |

---

## 📐 Structured Output & Schema Repair Architecture (Agent Phase 5)

```text
agent.runStructured({ input, schema: UserProfileSchema })
                       │
                       ▼
 1. Execute LLM completion with JSON response formatting
                       │
                       ▼
 2. Clean text & parse with schema.safeParse(json)
                       │
                       ├── Success? ──► Return { data: z.infer<TSchema>, session, repairAttempts: 0 }
                       │
                       └── Failure? (Validation Error)
                             │
                             ▼
 3. Generate Schema Repair Prompt with Zod error details
                             │
                             ▼
 4. Repair Retry Loop (Attempt 1..maxRepairAttempts)
                             │
                             ├── Fixed? ──► Return { data, repairAttempts }
                             └── Exhausted? ──► Throw [AgentSDK Schema Validation Error]
```

### Key Principles Implemented
1. **Strong TypeScript Inference (`z.infer<TSchema>`)**: Developer supplies Zod schema `schema: TSchema`, and SDK guarantees strongly-typed `result.data`.
2. **Automated Schema Repair Loop**: Validates completions with `schema.safeParse(json)`. If validation fails, Agent SDK automatically constructs a diagnostic repair prompt detailing exact Zod validation error paths and retries completion up to `maxRepairAttempts` (default 3).
3. **Provider JSON Mode Integration**: Automatically enables native JSON mode via `providerOptions: { response_format: { type: "json_object" } }`.

---

## 📁 Project Structure

```
c:\Users\meena\Downloads\AI_SDK_TEST\
├── package.json          # Package dependencies (openai, tsx, typescript, zod)
├── tsconfig.json          # TypeScript ES Module compiler settings
├── VISION.md             # Core project mission compass & non-goals
├── ARCHITECTURE.md       # (This file) Complete architectural documentation
├── test.ts               # Interactive ExplainSDK test script
├── test_agent.ts         # Agent SDK Phase 1 test script
├── examples/
│   ├── 02_memory_agent.ts         # Multi-turn memory example
│   ├── 03_guardrails_approval_agent.ts # Guardrails & Approval example
│   ├── 04_resiliency_agent.ts     # Resiliency & Loop Detection example
│   └── 05_structured_output_agent.ts   # [NEW IN AGENT PHASE 5] Structured Output example
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
        ├── resiliency/   # Resiliency Engine & Loop Prevention
        └── structured/   # [NEW IN AGENT PHASE 5]
            ├── types.ts       # StructuredRunOptions, StructuredRunResult
            ├── repair.ts      # executeStructuredOutput(), generateRepairPrompt()
            └── index.ts       # Structured exports
```
