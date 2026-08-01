# Changelog

All notable changes to **XplainSDK** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] - 2026-08-01

### 🛠️ Fixes & Improvements
- **TypeScript Declarations**: Enabled `declaration` and `declarationMap` settings in compiler configuration so `.d.ts` definitions are automatically emitted on build.
- **Build Pipeline**: Created dedicated `tsconfig.build.json` targeting strictly library sources (`src/`), simplifying output structure to `dist/index.js` and `dist/index.d.ts`.
- **Package Integrity**: Added `.npmignore` file and `"clean"` script to prevent extraneous tests, examples, and source files from appearing in published npm tarballs.

## [1.0.0] - 2026-07-31

### 🎉 Initial Release & Feature Complete

#### Core Agent Runtime & Execution Loop
- **Declarative Agent Definition**: `new Agent({ name, instructions, model, apiKey, tools })`.
- **Typed Tool System**: `createAgentTool()` supporting Zod schema validation and raw JSON schemas.
- **Provider Abstraction**: First-class support for OpenAI API with pass-through `providerOptions`.

#### Memory & Storage Adapters
- **Persistent Session Memory**: Multi-turn conversation retention via `InMemoryStorageAdapter` and `FileStorageAdapter`.
- **Memory Helpers**: `loadSessionHistory()` and `saveSessionHistory()`.

#### Guardrails & Human-in-the-Loop Approval
- **Pre & Post Execution Guardrails**: Modular `inputGuardrails` and `outputGuardrails` pipelines.
- **Human Approval Callback**: `onApprovalRequired` callback for sensitive tools marked `requiresApproval: true`.

#### Resiliency Engine & Loop Prevention
- **Transient Error Retries**: Retries HTTP 429 rate limits and 500/503 server errors with exponential backoff and jitter.
- **Request Timeout Wrapper**: Per-turn timeout enforcement (`timeoutMs`).
- **Tool Loop Detector**: Halts runaway infinite tool invocation cycles (`detectToolLoop`).

#### Structured Output & Schema Repair Engine
- **Zod Schema Enforcement**: `agent.runStructured({ input, schema })` with strongly-typed `z.infer<TSchema>` output.
- **Automated Repair Retry Loop**: Sends Zod validation error diagnostics back to model for automated output repair.

#### Multi-Agent Handoffs & Loop Prevention
- **Seamless Agent Transfer**: Auto-generates `transfer_to_<agent>` tools for active delegation.
- **Delegation History & Handoff Loop Protection**: Preserves message history and halts circular delegation stacks (`detectHandoffLoop`).

#### Runtime Event Emitter & Observability
- **Run ID Tracing**: Unique `runId` generated per execution.
- **Typed Lifecycle Events**: `onRunStart`, `onToolStart`, `onToolComplete`, `onHandoff`, `onGuardrail`, `onRunComplete`, `onRunFailed`.

#### Explain Mode & Executive Summaries
- **Executive Summaries**: `result.explain()`, `result.explain.markdown()`, `result.explain.json()`, and `agent.explain(session)`.

#### Session Replay Engine
- **Zero Side-Effect Playback**: `result.replay()`, `result.replay.markdown()`, `result.replay.json()`, and `agent.replay(session)`.

#### Interactive Standalone HTML Reports
- **Single File report.html**: Embedded Vercel/Linear dark theme, sticky sidebar navigation, search filter, copy buttons, and collapsible JSON view.

#### Smart Debug Assistant
- **Evidence-Based Diagnostics**: `result.debug()`, `result.debug.markdown()`, `result.debug.json()`, and `agent.debug(session)` providing specific next inspector commands and educational learning tips.
