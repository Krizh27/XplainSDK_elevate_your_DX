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
| **Agent Phase 3** | Guardrails & Human-in-the-Loop Approval (`inputGuardrails`, `outputGuardrails`, `onApprovalRequired`) | ✅ Completed (Current) |

---

## 🛡 Guardrail & Approval Architecture (Agent Phase 3)

```text
agent.run({ input })
       │
       ▼
 1. runInputGuardrails(input, agent.inputGuardrails)
       │
       ├── Fails? ──► Throw [AgentSDK Guardrail Error]
       └── Passed? ──► Continue to Runtime Loop
             │
             ▼
 2. LLM completion selects tool execution?
       │
       ├── Tool requiresApproval === true?
       │     │
       │     ▼
       │   onApprovalRequired({ toolName, args })
       │     ├── Approved (true)  ──► Execute Tool ──► Followup completion
       │     └── Denied (false)   ──► Return "Tool execution denied" ──► Continue conversation safely
       │
       └── Normal tool ──► Execute Tool normally
             │
             ▼
 3. LLM produces output text
       │
       ▼
 4. runOutputGuardrails(output, agent.outputGuardrails)
       │
       └── Return AgentRunResult { output_text, session, history }
```

### Key Principles Implemented
1. **Input Guardrails Run FIRST**: Input guardrails execute before the LLM runtime loop starts. If an input policy fails, execution halts immediately with an actionable diagnostic error.
2. **Human Approval Callbacks for Tools**:
   - Tools can specify `requiresApproval: true`.
   - Before executing a sensitive tool, Agent SDK pauses and calls `onApprovalRequired({ toolName, args, agentName })`.
   - If approved (`true`), execution proceeds.
   - If rejected (`false`), **execution does not crash**! It feeds a safe cancellation tool message (`Tool execution denied by operator`) back to the model so the conversation continues safely.
3. **Output Guardrails Run LAST**: Output guardrails validate generated LLM responses before returning results to the caller.

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
│   └── 03_guardrails_approval_agent.ts # [NEW IN AGENT PHASE 3] Guardrails & Approval example
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
        └── guardrails/   # [NEW IN AGENT PHASE 3]
            ├── types.ts     # InputGuardrail, OutputGuardrail, ApprovalCallback
            ├── pipeline.ts  # runInputGuardrails(), runOutputGuardrails()
            └── index.ts     # Guardrails barrel export
```
