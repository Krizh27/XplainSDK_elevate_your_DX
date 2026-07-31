# ExplainSDK - Project Vision & Core Mission

> **Mission**: Help developers understand, debug, and learn how AI applications work by making the invisible visible.

---

## 🧭 1. Why Does ExplainSDK Exist?

Most AI SDKs treat LLMs as black boxes. They send a prompt over HTTP and return a text response, hiding what happens behind the scenes—latency breakdown, token usage, API costs, stream chunk timings, and tool call execution details.

ExplainSDK exists to **illuminate the internals of AI applications**. It acts as an open-source Developer Experience (DX) Layer that sits on top of official provider SDKs, providing complete observability and educational clarity without adding bloat or complex OOP abstractions.

---

## 👤 2. Who Is It For?

1. **Learners & Students**: Developers who want to understand how AI SDKs work internally (providers, streaming, tool calling, token metrics, cost estimation).
2. **AI Application Engineers**: Developers building production AI apps who need high-precision debugging tools, request flight recorders, and performance inspection.
3. **Educators & Presenters**: Mentors, live coders, and teachers who need smooth stream rendering speed controls and visual terminal/dashboard reporting for demonstrations.

---

## 🛠 3. What Problems Does It Solve?

* **Black-Box Invisible Execution**: Replaces mystery with an explicit event timeline logging every millisecond of a request lifecycle.
* **Hidden API Costs**: Automatically calculates exact USD cost for every request based on token pricing tables.
* **Abrupt Streaming Output**: Provides configurable Stream Rendering Speed controls (`"instant"`, `"fast"`, `"normal"`, `"slow"`) so text streams at a natural reading pace.
* **Silent Tool Failures**: Implements a Tool Call Inspector that captures tool function names, arguments, execution durations, errors, and return values.
* **Unreproducible Bugs**: Captures complete, structured Session Flight Recorder JSON records (`SessionRecord`) that can be exported and inspected offline.
* **Monolithic Output Logs**: Implements a modular Inspector Framework (`Data → Formatter → UI`) that separates raw inspection telemetry from terminal or web presentation.

---

## 🛑 4. What Will It Intentionally NOT Do?

ExplainSDK stays focused by enforcing strict boundaries. **It will intentionally NOT:**

1. **Replace Official Provider SDKs**: It will NOT re-implement model endpoints, image generation, audio, embeddings, or reasoning APIs. Official SDKs handle model capabilities.
2. **Teach Over-Engineered OOP**: It will NOT introduce complex class hierarchies, factories, or event emitters. `ExplainSDK` remains the **ONLY CLASS** in the codebase. Everything else is pure functions.
3. **Hide Native Provider Features**: It will NOT wrap every parameter. It allows native `providerOptions` (`temperature`, `top_p`, `max_tokens`, etc.) to pass directly through to official provider SDKs.
4. **Perform Secret Telemetry**: It will NOT send metrics, prompt data, or sessions to external remote servers. All data stays local to the developer's application.

---

*This document serves as our compass. Every new feature must answer: "Does this move us closer to making the invisible visible?"*
