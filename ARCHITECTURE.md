# ExplainSDK - Internal Architecture & Design Documentation

> 🧭 **Project Compass**: Refer to [VISION.md](file:///c:/Users/meena/Downloads/AI_SDK_TEST/VISION.md) for the core project mission, target audience, problem scope, and non-goals.

---

## 🎯 Core Project Philosophy: The Developer Experience (DX) Layer

**ExplainSDK is NOT trying to replace provider SDKs** (such as the official OpenAI SDK, Anthropic SDK, Gemini SDK, or Groq SDK).

Instead, **ExplainSDK is a Developer Experience (DX) Layer** that sits directly on top of official provider SDKs.

```text
Application Code
       │
       ▼
  ExplainSDK  ─────────► [DX Tooling: Timeline, Cost, Behavior Advisor, Prompt Advisor, Flight Recorder]
       │
       ▼
Official Provider SDK ──► [Model Capabilities: Completions, Tools, Pass-Through Options]
       │
       ▼
 Provider API HTTP
```

---

## 📍 Project Phases & Current Status

| Phase | Description | Status |
| :--- | :--- | :--- |
| **Vision** | Core Mission & Project Boundaries ([VISION.md](file:///c:/Users/meena/Downloads/AI_SDK_TEST/VISION.md)) | ✅ Established |
| **Phase 1** | Initial Wrapper + In-Memory Event & Latency Timeline Logging | ✅ Completed |
| **Phase 1.5** | Refactoring to Pure Functions (Single-Class Architecture) | ✅ Completed |
| **Phase 2** | Provider Adapter Architecture (Decoupling OpenAI into `src/providers/`) | ✅ Completed |
| **Phase 3** | Token Usage, Cost Estimation & Enhanced Performance Metrics | ✅ Completed |
| **Phase 4** | Real-Time Streaming Support & Chunk Memory Retention | ✅ Completed |
| **Phase 5** | Tool Call Inspector & Multi-Turn Tool Execution Loop | ✅ Completed |
| **Phase 6** | Developer Experience (DX) Refinement & Diagnostic Errors | ✅ Completed |
| **Phase 7** | Session Recording & Flight Recorder Foundation | ✅ Completed |
| **Phase 8** | Inspector Framework & Data ──► Formatter ──► UI Architecture | ✅ Completed |
| **Phase 9** | Prompt Advisor & Educational Prompt Engineering | ✅ Completed |
| **Phase 9.5** | Behavior Advisor & Runtime Post-Execution Analysis | ✅ Completed (Current) |

---

## 🤖 Behavior Advisor vs. Prompt Advisor

| Feature | Prompt Advisor (`sdk.inspect.prompt`) | Behavior Advisor (`sdk.inspect.behavior`) |
| :--- | :--- | :--- |
| **Core Question** | *"Could this prompt be improved?"* | *"What actually happened during request execution and why?"* |
| **Timing** | Static Pre-Execution Analysis | Post-Execution Runtime Analysis |
| **Source of Truth** | Prompt Text Input String | `SessionRecord` Flight Recorder |
| **Primary Goal** | Teach prompt structure & best practices | Debug unexpected tool choices, ignored constraints & latency |

---

## 📑 Phase 9.5 Final Design Review

```text
               Session Recording (Flight Recorder)
                                │
                                ▼
                  sdk.inspect.behavior(session)
                                │
                                ▼
       BehaviorAnalysisData (Facts, Possible Causes, Confidence, Suggestions)
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
    Terminal Box UI       Web Dashboard         VS Code Extension
(formatInspection)        (React Component)        (Extension Tooltip)
```

### 1. Why Behavior Advisor Belongs in a DX Layer
Prompt analysis alone cannot predict how an LLM will react to complex tool schemas, ambiguous keywords, or formatting instructions during execution. Behavior Advisor inspects **what actually happened at runtime**, giving developers complete visibility into model decisions and unexpected execution anomalies.

### 2. Why Runtime Analysis Is More Useful Than Static Analysis Alone
Static prompt analysis evaluates wording in isolation, but runtime execution reveals real-world model choices (e.g. model calling `weather()` when given a prompt containing "Pinocchio" or returning plain text when JSON was requested). Combining static prompt analysis with runtime behavior analysis provides a complete end-to-end debugging workflow.

### 3. How This Feature Helps Beginners Learn Debugging
Beginners often assume LLM output bugs are random flaws. Behavior Advisor breaks down execution into:
* **Observed Facts** (e.g. *"Model called weather() with args { city: 'Pinocchio' }"*)
* **Confidence Levels** (`High`, `Medium`, `Low`)
* **Possible Causes & Explanations**
* **Concrete Suggestions & Reasons**
This teaches developers how to debug LLM applications systematically.

### 4. Architectural Trade-offs & Zero Extra Network Calls
Behavior Advisor consumes existing `SessionRecord` data only. It performs **ZERO additional API requests** to provider LLM endpoints and **ZERO console logging inside the inspector**, maintaining maximum performance and zero cost overhead.

### 5. Future Compatibility
The pure functional architecture (`Session Record` ──► `inspectBehavior` ──► `BehaviorAnalysisData` ──► `Formatter`) prepares ExplainSDK for analyzing:
* Multi-turn conversational loops
* RAG retrieval & context injection behavior
* Agent reasoning traces & multi-tool chain execution

---

## 📁 Project Structure

```
c:\Users\meena\Downloads\AI_SDK_TEST\
├── package.json          # Package dependencies (openai, tsx, typescript)
├── tsconfig.json          # TypeScript ES Module compiler settings
├── VISION.md             # Core project mission compass & non-goals
├── ARCHITECTURE.md       # (This file) Complete architectural documentation
├── test.ts               # Interactive developer test script
└── src/
    ├── index.ts          # Public barrel export
    ├── client.ts         # ExplainSDK CLASS (Exposes sdk.inspect gateway)
    ├── chat.ts           # Orchestrator functions (handleChat and handleStream)
    ├── session.ts        # Session recording, flight recorder, & exportSession helper
    ├── timeline.ts       # Pure timeline logging & tool inspection recording functions
    ├── logger.ts         # Centralized console logging helper
    ├── cost.ts           # Isolated pricing table & cost calculation module
    ├── tools.ts          # Functional tool registry & OpenAI schema formatter
    ├── toolInspector.ts  # High-precision tool execution timing & report formatting
    ├── types.ts          # Global interfaces & Inspector Framework data schemas
    ├── inspectors/       # Inspector Framework directory
    │   ├── behavior.ts   # [NEW IN PHASE 9.5] inspectBehavior(session) pure analyzer function
    │   ├── prompt.ts     # inspectPrompt(session)
    │   ├── timeline.ts   # inspectTimeline(session)
    │   ├── performance.ts# inspectPerformance(session)
    │   ├── tokens.ts     # inspectTokens(session)
    │   ├── cost.ts       # inspectCost(session)
    │   ├── tools.ts      # inspectTools(session)
    │   ├── formatter.ts  # formatInspection(type, data) terminal box renderer
    │   └── index.ts      # Inspectors barrel export
    └── providers/
        ├── provider.ts   # Provider contract interface & getProviderAdapter
        └── openai.ts     # OpenAI translation adapter
```
