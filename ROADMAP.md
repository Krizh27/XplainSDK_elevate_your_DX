# XplainSDK Product Roadmap

This document outlines the strategic product roadmap for **XplainSDK & AI Agent SDK**.

---

## 🎯 Current Status: v1.0.0 (Feature Complete)

- ✅ **Core Agent Runtime & Execution Loop** (`Agent`, `createAgentTool`, `runAgentLoop`)
- ✅ **Persistent Memory & Storage Adapters** (`InMemoryStorageAdapter`, `FileStorageAdapter`)
- ✅ **Guardrails Pipeline & Human-in-the-Loop Approval** (`inputGuardrails`, `outputGuardrails`, `onApprovalRequired`)
- ✅ **Resiliency Engine** (Exponential backoff retries, timeouts, `detectToolLoop`)
- ✅ **Structured Output & Automated Schema Repair** (`runStructured`, Zod validation repair loop)
- ✅ **Multi-Agent Handoffs & Delegation Loop Resolver** (`createHandoffTool`, `detectHandoffLoop`)
- ✅ **Runtime Events & Tracing** (`runId`, `AgentEventEmitter`, 7 lifecycle hooks)
- ✅ **Explain Mode Telemetry** (`result.explain()`, Console, Markdown, JSON)
- ✅ **Session Replay Engine** (`result.replay()`, Step-by-Step deterministic playback)
- ✅ **Interactive Standalone HTML Reports** (`result.report()`, `report.html`, embedded CSS/JS)
- ✅ **Smart Debug Assistant** (`result.debug()`, next inspector recommendations, learning tips)

---

## 🚀 Near-Term Roadmap (v1.1 - v1.3)

### 1. Multi-Provider Expansion
- Native Anthropic Claude, Google Gemini, and Groq SDK translation adapters.
- Universal provider options pass-through normalization.

### 2. Advanced Storage Adapters
- Official `@xplain-sdk/storage-redis` package for distributed session state caching.
- Official `@xplain-sdk/storage-postgres` package for persistent relational message archiving.

### 3. OpenTelemetry (OTel) Integration
- Export `SessionRecord` flight records as standard OpenTelemetry trace spans.
- Native integration with Datadog, Honeycomb, and New Relic.

---

## 🔮 Long-Term Vision (v2.0+)

### 1. Real-Time Telemetry Dashboard UI
- Optional local web server (`npx xplain-ui`) rendering real-time streaming timelines.

### 2. Multi-Modal Vision & Audio Flight Recording
- Capture image input payloads and speech-to-text token metrics directly within `SessionRecord`.
