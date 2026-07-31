# Frequently Asked Questions (FAQ)

---

## ❓ General Questions

### 1. Why another Agent SDK?
Most existing agent SDKs focus exclusively on executing agent loops while treating model internal decisions as black boxes. When an agent fails, developers are forced to manually inspect console logs or search raw JSON payloads. 

**XplainSDK** was built to bridge this gap by pairing a production-grade Agent Runtime with a flight-recorder DX layer. It makes invisible model decisions, latency bottlenecks, token costs, prompt weaknesses, and behavioral anomalies instantly visible.

---

### 2. What is the difference between XplainSDK and AgentSDK?
- **XplainSDK**: The Developer Experience (DX) Observability Layer. It provides flight recording (`SessionRecord`), inspectors (Performance, Tools, Cost, Prompt, Behavior), terminal formatting, Explain Mode, Session Replay, HTML Reports, and Smart Debug Assistant.
- **AgentSDK**: The Runtime Core built on top of XplainSDK. It manages identity, system instructions, tool selection loops, persistent memory adapters, guardrails, resiliency retries, structured output repair loops, and multi-agent handoffs.

---

## 🆚 Comparisons with Existing Frameworks

### 1. How does XplainSDK compare to OpenAI SDK?
The official OpenAI SDK is a low-level client for communicating with OpenAI APIs. It does not provide tool execution loops, persistent session memory storage adapters, guardrails, multi-agent delegation handoffs, or observability tools. XplainSDK sits directly on top of OpenAI SDK to provide these high-level capabilities.

---

### 2. How does XplainSDK compare to LangGraph / LangChain?
LangGraph is a graph-based state machine framework. While powerful for complex stateful workflows, it introduces significant setup overhead, heavy abstractions, and a steep learning curve. XplainSDK emphasizes **simplicity, zero-dependency HTML reporting, single-class architecture, and instant diagnostic visibility**.

---

### 3. How does XplainSDK compare to OpenAI Agents SDK / Swarm / Mastra / Vercel AI SDK?
| Feature | XplainSDK | OpenAI Agents SDK | Vercel AI SDK | Mastra |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Focus** | Observability & Runtime | Basic Multi-Agent Loop | UI Streaming & Hooks | Fullstack Framework |
| **Explain Mode** | ✅ Built-in | ❌ None | ❌ None | ❌ None |
| **Session Replay** | ✅ Deterministic | ❌ None | ❌ None | ❌ None |
| **Standalone HTML Report** | ✅ Zero-CDN single file | ❌ None | ❌ None | ❌ None |
| **Smart Debug Assistant** | ✅ Evidence-based | ❌ None | ❌ None | ❌ None |
| **Dependencies** | Minimal | Heavy | Vercel Ecosystem | Full Node/Next.js |

---

## 🔍 Technical & Observability Questions

### 1. How does Tracing & Session Recording work?
Every call to `agent.run()` automatically instantiates an internal `SessionRecord` flight recorder. As the agent loop progresses (user input $\rightarrow$ LLM turn $\rightarrow$ tool execution $\rightarrow$ guardrail evaluation $\rightarrow$ completion), timestamps, token usages, USD costs, and duration measurements are appended chronologically.

---

### 2. How does Explain Mode work?
`result.explain()` analyzes the completed `SessionRecord` to synthesize a concise, human-readable executive summary paragraph explaining what happened, why decisions were made, tools executed, and whether any runtime anomalies occurred.

---

### 3. How does Prompt Advisor work?
`sdk.inspect.prompt(session)` performs static structural analysis on the prompt input and system instructions. It evaluates prompt brevity, ambiguity, parameter clarity, and role instructions, returning strengths and actionable suggestions without making additional model calls.
