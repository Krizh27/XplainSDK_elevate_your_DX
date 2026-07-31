# XplainSDK & Agent SDK - Internal Architecture & Design Documentation

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
│                         XPLAINSDK (EXISTING DX LAYER)                  │
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
| **XplainSDK** | DX Layer, Flight Recorder, Inspectors, Prompt/Behavior Advisors | ✅ Completed |
| **Agent Phase 1** | Core Agent Runtime, Tool System & Execution Loop (`Agent`, `createAgentTool`, `runAgentLoop`) | ✅ Completed |
| **Agent Phase 2** | Persistent Memory & Storage Adapters (`StorageAdapter`, `InMemoryStorageAdapter`, `FileStorageAdapter`) | ✅ Completed |
| **Agent Phase 3** | Guardrails & Human-in-the-Loop Approval (`inputGuardrails`, `outputGuardrails`, `onApprovalRequired`) | ✅ Completed |
| **Agent Phase 4** | Resiliency Engine (`withRetryAndTimeout`, `detectToolLoop`, `isTransientError`) | ✅ Completed |
| **Agent Phase 5** | Structured Output & Schema Repair Engine (`agent.runStructured`, Zod validation, repair loop) | ✅ Completed |
| **Agent Phase 6** | Multi-Agent Handoffs & Loop Prevention (`createHandoffTool`, `detectHandoffLoop`, `handoffs`) | ✅ Completed |
| **Agent Phase 7** | Runtime Event Emitter & XplainSDK Observability (`runId`, `agent.on()`, `SessionRecord`) | ✅ Completed |
| **Agent Phase 8** | Production-Quality Documentation, Examples Suite & NPM Package Polish | ✅ Completed |
| **Agent Phase 9** | Explain Mode Orchestration (`result.explain()`, Console, Markdown, JSON renderers) | ✅ Completed |
| **Agent Phase 10**| Session Replay Engine (`result.replay()`, Step-by-Step Reconstruction, Zero Side Effects) | ✅ Completed |
| **Agent Phase 12**| Interactive Standalone HTML Report Generator (`result.report()`, `report.html`, Zero CDNs) | ✅ Completed (Current) |

---

## 📄 Interactive HTML Report Architecture (Agent Phase 12)

```text
                       XplainSDK Session Record
                                   │
                                   ▼
                    generateHTMLReport(session)  [src/agent/report/report.ts]
                                   │
            ┌──────────────────────┼──────────────────────┐
            ▼                      ▼                      ▼
     renderHeader()        renderSummary()        renderTimeline()
     renderTools()         renderAdvisors()       renderMetrics()
     renderGuardrails()    renderHandoffs()       renderRawJSON()
                                   │
                                   ▼
                  compileHTMLDocument(components)  [src/agent/report/htmlTemplate.ts]
                                   │
                                   ▼
                        Standalone report.html File
```

### Key Principles Implemented
1. **Zero External Dependencies**: Embedded CSS styles and client-side JavaScript interactions (dark mode toggle, search bar, copy buttons, sticky navigation) into a single self-contained `.html` document string.
2. **First-Class Developer API**:
   - `await result.report({ outputPath: "./report.html" })`
   - `const html = result.report.html()`
   - `await agent.generateReport(session, { outputPath: "./report.html" })`
3. **Zero Re-Execution**: Operates 100% deterministically on recorded `SessionRecord` telemetry.

---

## 📁 Project Structure

```
c:\Users\meena\Downloads\AI_SDK_TEST\
├── package.json          # Package dependencies (openai, tsx, typescript, zod)
├── tsconfig.json          # TypeScript ES Module compiler settings
├── VISION.md             # Core project mission compass & non-goals
├── ARCHITECTURE.md       # (This file) Complete architectural documentation
├── README.md             # Production-grade user documentation & API reference
├── test.ts               # Interactive XplainSDK test script
├── test_agent.ts         # Agent SDK Phase 1 test script
├── test_all_features.ts  # 36-Test Comprehensive Feature Suite
├── examples/
│   ├── 01_quickstart_agent.ts         # Quickstart example
│   ├── 02_memory_agent.ts         # Multi-turn memory example
│   ├── 03_guardrails_approval_agent.ts # Guardrails & Approval example
│   ├── 04_resiliency_agent.ts     # Resiliency & Loop Detection example
│   ├── 05_structured_output_agent.ts   # Structured Output example
│   ├── 06_multi_agent_handoff_agent.ts # Multi-Agent Handoff example
│   ├── 07_events_tracing_agent.ts # Events & Tracing example
│   ├── 08_explain_mode_agent.ts   # Explain Mode example
│   ├── 09_session_replay_agent.ts # Session Replay example
│   └── 10_html_report_agent.ts   # [NEW IN AGENT PHASE 12] HTML Report example
└── src/
    ├── index.ts          # Public barrel export
    ├── client.ts         # XplainSDK CLASS
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
        ├── replay/       # Session Replay Engine
        └── report/       # [NEW IN AGENT PHASE 12]
            ├── types.ts       # ReportOptions, ReportFunction
            ├── htmlTemplate.ts# EMBEDDED_CSS & EMBEDDED_JS
            ├── renderer.ts    # Section component renderers
            ├── report.ts      # generateHTMLReport() & saveHTMLReport()
            └── index.ts       # Report exports
```
