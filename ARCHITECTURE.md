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
| **Agent Phase 5** | Structured Output & Schema Repair Engine (`agent.runStructured`, Zod validation, repair loop) | ✅ Completed |
| **Agent Phase 6** | Multi-Agent Handoffs & Loop Prevention (`createHandoffTool`, `detectHandoffLoop`, `handoffs`) | ✅ Completed (Current) |

---

## 🤝 Multi-Agent Handoff Architecture (Agent Phase 6)

```text
User Input ──► TriageAgent.run({ input, sessionId })
                     │
                     ▼
          TriageAgent LLM loop
                     │
                     ▼ Model calls transfer_to_BillingAgent({ reason })
          resolveHandoff(currentAgent, targetAgent, context, chain)
                     │
                     ├── 1. Check detectHandoffLoop(chain, targetAgent)
                     │        └── Loop or depth > maxHandoffDepth? ──► Throw [AgentSDK Handoff Loop Error]
                     │
                     ├── 2. Log timeline event in ExplainSDK ("agent_handoff", { from, to, reason })
                     │
                     └── 3. Transfer history & execute BillingAgent.run({ input, sessionId, history })
                              │
                              ▼
                     Return AgentRunResult { activeAgentName: "BillingAgent", output_text, session }
```

### Key Principles Implemented
1. **Multi-Agent Handoff Tool Generation**: Declaring `handoffs: [BillingAgent]` on `TriageAgent` automatically generates transfer tool `transfer_to_BillingAgent`.
2. **Context History Transfer**: When control transfers from Agent A to Agent B, full conversation history, session ID, and memory are preserved intact.
3. **ExplainSDK Telemetry**: Every handoff event is logged directly into ExplainSDK request timelines (`agent_handoff` timeline events).
4. **Handoff Loop Prevention & Depth Bounds**: Tracks active agent delegation chain (`handoffChain`). If circular delegation (A $\rightarrow$ B $\rightarrow$ A) or maximum depth (`maxHandoffDepth`, default 5) is exceeded, halts delegation with an actionable 3-part diagnostic `[AgentSDK Handoff Loop Error]`.

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
│   ├── 05_structured_output_agent.ts   # Structured Output example
│   └── 06_multi_agent_handoff_agent.ts # [NEW IN AGENT PHASE 6] Multi-Agent Handoff example
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
        ├── structured/   # Structured Outputs & Schema Repair
        └── handoff/      # [NEW IN AGENT PHASE 6]
            ├── types.ts       # HandoffPayload, HandoffResult
            ├── tool.ts        # createHandoffTool()
            ├── resolver.ts    # detectHandoffLoop()
            └── index.ts       # Handoff exports
```
