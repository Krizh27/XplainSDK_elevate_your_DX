# Contributing to XplainSDK & AI Agent SDK

Thank you for your interest in contributing to **XplainSDK**! We welcome bug fixes, documentation improvements, unit tests, and feature enhancements.

---

## 📜 Code of Conduct

All contributors are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat all community members with respect, empathy, and professional integrity.

---

## 🛠 Local Development Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Repository Setup
```bash
# Clone repository
git clone https://github.com/Krizh27/XplainSDK_elevate_your_DX.git
cd XplainSDK_elevate_your_DX

# Install dependencies
npm install
```

---

## 🧪 Testing & Verification

Before submitting a Pull Request, ensure that all TypeScript types compile cleanly and all 41 feature suite tests pass:

```bash
# Run TypeScript typecheck (0 errors expected)
npm run typecheck

# Build distribution bundle
npm run build

# Run comprehensive feature test suite (41/41 tests expected)
npm test
```

---

## 📐 Architecture & Coding Standards

1. **Single Class Rule**: `Agent` and `XplainSDK` are the **ONLY CLASSES** in the codebase. All internal helpers (memory, guardrails, resiliency, structured output, handoffs, events, explain, replay, report, debug) are pure, stateless functions.
2. **Actionable 3-Part Diagnostic Errors**: Every thrown error must strictly follow:
   - **What Happened**: Clear failure explanation.
   - **Why**: Underlying root cause.
   - **How to Fix**: Exact corrective steps for the developer.
3. **Zero Logic Duplication**: Explain Mode, Session Replay, HTML Reports, and Smart Debug Assistant consume telemetry produced by ExplainSDK inspectors. They do not re-implement timeline tracking or performance calculations.
4. **Beginner-Friendly APIs**: Keep public method signatures short, memorable, and self-explanatory.

---

## 🚀 Submitting a Pull Request

1. **Fork** the repository and create a feature branch (`git checkout -b feature/my-enhancement`).
2. **Commit** your changes with clear, descriptive commit messages (`feat: ...`, `fix: ...`, `docs: ...`).
3. **Verify** that `npm run typecheck` and `npm test` pass.
4. **Push** to your fork and submit a Pull Request targeting `main`.

Thank you for helping make AI application internals visible for developers worldwide! 🚀
