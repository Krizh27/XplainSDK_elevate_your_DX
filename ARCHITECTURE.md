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
| **Agent Phase 6** | Multi-Agent Handoffs & Loop Prevention (`createHandoffTool`, `detectHandoffLoop`, `handoffs`) | ✅ Completed |
| **Agent Phase 7** | Runtime Event Emitter & ExplainSDK Observability (`runId`, `agent.on()`, `SessionRecord`) | ✅ Completed |
| **Agent Phase 8** | Production-Quality Documentation, Examples Suite & NPM Package Polish | ✅ Completed |
| **Agent Phase 9** | Explain Mode Orchestration (`result.explain()`, Console, Markdown, JSON renderers) | ✅ Completed |
| **Agent Phase 10**| Session Replay Engine (`result.replay()`, Step-by-Step Reconstruction, Zero Side Effects) | ✅ Completed (Current) |

---

## 🎬 Session Replay Architecture (Agent Phase 10)

```text
                       ExplainSDK Session Record
                                   │
                                   ▼
                    reconstructReplay(session)  [src/agent/replay/replay.ts]
                                   │
                                   ▼
                             ReplayData Payload
                      ┌────────────┴────────────┐
                      ▼                         ▼
            formatReplayConsole()     formatReplayMarkdown()
```

### Key Principles Implemented
1. **Zero Re-Execution Guarantee**: Session Replay operates 100% deterministically on recorded `SessionRecord` telemetry. It **never** invokes network APIs, re-executes providers, or reruns tools.
2. **First-Class Developer API**:
   - `result.replay()` (Pretty step-by-step terminal playback)
   - `result.replay.markdown()` (Formatted markdown report)
   - `result.replay.json()` (Structured `ReplayData` steps array)
   - `agent.replay(session)` or `agent.replay(result)`
3. **Deterministic Step Reconstruction**: Reconstructs complete request lifecycle into chronological steps (User Input $\rightarrow$ Tool Executions $\rightarrow$ Handoffs $\rightarrow$ Final Output).

---

## 📁 Project Structure

```
c:\Users\meena\Downloads\AI_SDK_TEST\
├── package.json          # Package dependencies (openai, tsx, typescript, zod)
├── tsconfig.json          # TypeScript ES Module compiler settings
├── VISION.md             # Core project mission compass & non-goals
├── ARCHITECTURE.md       # (This file) Complete architectural documentation
├── README.md             # Production-grade user documentation & API reference
├── test.ts               # Interactive ExplainSDK test script
├── test_agent.ts         # Agent SDK Phase 1 test script
├── examples/
│   ├── 01_quickstart_agent.ts         # Quickstart example
│   ├── 02_memory_agent.ts         # Multi-turn memory example
│   ├── 03_guardrails_approval_agent.ts # Guardrails & Approval example
│   ├── 04_resiliency_agent.ts     # Resiliency & Loop Detection example
│   ├── 05_structured_output_agent.ts   # Structured Output example
│   ├── 06_multi_agent_handoff_agent.ts # Multi-Agent Handoff example
│   ├── 07_events_tracing_agent.ts # Events & Tracing example
│   ├── 08_explain_mode_agent.ts   # Explain Mode example
│   └── 09_session_replay_agent.ts # [NEW IN AGENT PHASE 10] Session Replay example
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
        ├── handoff/      # Multi-Agent Handoffs & Loop Prevention
        ├── events/       # Runtime Events & Tracing
        ├── explain/      # Explain Mode Orchestrator
        └── replay/       # [NEW IN AGENT PHASE 10]
            ├── types.ts       # ReplayStep, ReplayData, ReplayFunction
            ├── replay.ts      # reconstructReplay() deterministic engine
            ├── formatter.ts   # formatReplayConsole(), formatReplayMarkdown()
            └── index.ts       # Replay exports
```
