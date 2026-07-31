import { SessionRecord } from "../../types.js";
import { generateExplanation } from "../explain/explain.js";
import { inspectPrompt } from "../../inspectors/prompt.js";
import { inspectBehavior } from "../../inspectors/behavior.js";
import { inspectPerformance } from "../../inspectors/performance.js";
import { analyzeDebug } from "../debug/debug.js";

/**
 * @file agent/report/renderer.ts
 * @description Pure modular component renderers producing clean HTML sections from SessionRecord telemetry.
 */

/** Escapes special HTML characters to prevent XSS. */
function escapeHTML(str: string): string {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function renderHeaderSection(session: SessionRecord, runId?: string): string {
    return `
    <div class="card" id="header-section">
        <div class="card-title">
            <span>🚀 ${escapeHTML(session.request.model || session.model)} Execution</span>
            <span class="badge badge-blue">${escapeHTML(session.provider.toUpperCase())}</span>
        </div>
        <div class="metrics-grid">
            <div class="metric-box">
                <div class="metric-label">Run ID</div>
                <div class="metric-value" style="font-size:1.1rem;">${escapeHTML(runId || session.id)}</div>
            </div>
            <div class="metric-box">
                <div class="metric-label">Session ID</div>
                <div class="metric-value" style="font-size:1.1rem;">${escapeHTML(session.id)}</div>
            </div>
            <div class="metric-box">
                <div class="metric-label">Timestamp</div>
                <div class="metric-value" style="font-size:1.1rem;">${escapeHTML(new Date(session.timestamp).toLocaleTimeString())}</div>
            </div>
        </div>
        <div><strong>User Prompt Input:</strong> "${escapeHTML(session.request.input)}"</div>
    </div>`;
}

export function renderSummarySection(session: SessionRecord, handoffChain?: string[]): string {
    const exp = generateExplanation(session, { handoffChain });
    const perf = inspectPerformance(session);

    return `
    <div class="card" id="summary-section">
        <div class="card-title">
            <span>🧠 Executive Summary</span>
            <span class="badge badge-green">CONFIDENCE: ${exp.confidence.toUpperCase()}</span>
        </div>
        <p style="margin-bottom: 1.5rem; font-size: 1rem; color: var(--text-primary);">${escapeHTML(exp.summary)}</p>
        <div class="metrics-grid">
            <div class="metric-box">
                <div class="metric-label">Total Duration</div>
                <div class="metric-value">${perf.latencyMs} <span style="font-size:0.875rem;">ms</span></div>
            </div>
            <div class="metric-box">
                <div class="metric-label">Total Tokens</div>
                <div class="metric-value">${session.tokenUsage.total_tokens}</div>
            </div>
            <div class="metric-box">
                <div class="metric-label">Estimated Cost</div>
                <div class="metric-value">${escapeHTML(session.cost.formattedCost)}</div>
            </div>
            <div class="metric-box">
                <div class="metric-label">Tools Executed</div>
                <div class="metric-value">${session.toolCalls ? session.toolCalls.length : 0}</div>
            </div>
        </div>
    </div>`;
}

export function renderTimelineSection(session: SessionRecord): string {
    const toolCalls = session.toolCalls || [];
    let itemsHTML = "";

    itemsHTML += `
    <div style="margin-bottom:0.75rem;">
        <span class="badge badge-blue">USER INPUT</span> "${escapeHTML(session.request.input)}"
    </div>`;

    if (toolCalls.length > 0) {
        for (const tc of toolCalls) {
            const badgeClass = tc.success ? "badge-green" : "badge-red";
            itemsHTML += `
            <div style="margin-bottom:0.75rem;">
                <span class="badge ${badgeClass}">TOOL EXECUTED</span> <strong>${escapeHTML(tc.toolName)}()</strong> (${tc.durationMs} ms)<br>
                <div style="font-size:0.8125rem; color:var(--text-secondary); margin-top:0.25rem;">
                    Args: <code>${escapeHTML(JSON.stringify(tc.args))}</code>
                </div>
            </div>`;
        }
    } else {
        itemsHTML += `
        <div style="margin-bottom:0.75rem;">
            <span class="badge badge-yellow">DIRECT MODEL RESPONSE</span> Generated completion text directly.
        </div>`;
    }

    itemsHTML += `
    <div>
        <span class="badge badge-green">FINAL RESPONSE</span> "${escapeHTML(session.response.output_text)}"
    </div>`;

    return `
    <div class="card" id="timeline-section">
        <div class="card-title">⏱ Execution Timeline</div>
        <div style="border-left: 2px solid var(--border-color); padding-left: 1rem;">
            ${itemsHTML}
        </div>
    </div>`;
}

export function renderToolsSection(session: SessionRecord): string {
    const toolCalls = session.toolCalls || [];
    if (toolCalls.length === 0) {
        return `
        <div class="card" id="tools-section">
            <div class="card-title">🛠 Tool Executions</div>
            <p style="color: var(--text-muted);">No external tool functions were executed during this request.</p>
        </div>`;
    }

    let rows = "";
    for (const tc of toolCalls) {
        const badge = tc.success ? '<span class="badge badge-green">Success</span>' : '<span class="badge badge-red">Failed</span>';
        rows += `
        <tr>
            <td><strong>${escapeHTML(tc.toolName)}</strong></td>
            <td><code>${escapeHTML(JSON.stringify(tc.args))}</code></td>
            <td>${tc.durationMs} ms</td>
            <td>${badge}</td>
            <td><code>${escapeHTML(typeof tc.result === "object" ? JSON.stringify(tc.result) : String(tc.result || tc.error || ""))}</code></td>
        </tr>`;
    }

    return `
    <div class="card" id="tools-section">
        <div class="card-title">🛠 Tool Executions (${toolCalls.length})</div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Tool Name</th>
                        <th>Arguments</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>Output Result</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    </div>`;
}

export function renderAdvisorsSection(session: SessionRecord): string {
    const promptData = inspectPrompt(session);
    const behaviorData = inspectBehavior(session);

    let strengthsHTML = (promptData.strengths || []).map(s => `<li>✓ ${escapeHTML(s)}</li>`).join("");
    let suggestionsHTML = (promptData.suggestions || []).map(s => `<li>💡 ${escapeHTML(s)}</li>`).join("");
    let observationsHTML = (behaviorData.observations || []).map(o => `<li>[${o.confidence}] <strong>${escapeHTML(o.fact)}</strong>: ${escapeHTML(o.possibleCause)}</li>`).join("");

    return `
    <div class="card" id="advisors-section">
        <div class="card-title">💡 Prompt & Behavior Advisors</div>
        
        <h4 style="margin-bottom:0.5rem; color:var(--accent-blue);">Prompt Advisor Analysis</h4>
        <ul style="list-style:none; margin-bottom:1rem; display:flex; flex-direction:column; gap:0.25rem;">
            ${strengthsHTML || "<li>Prompt structure is concise.</li>"}
            ${suggestionsHTML}
        </ul>

        <h4 style="margin-bottom:0.5rem; color:var(--accent-purple);">Behavior Advisor Observations</h4>
        <ul style="list-style:none; display:flex; flex-direction:column; gap:0.25rem;">
            ${observationsHTML || "<li>No unexpected runtime behavioral anomalies detected.</li>"}
        </ul>
    </div>`;
}

export function renderDebugSection(session: SessionRecord): string {
    const debug = analyzeDebug(session);

    let issuesHTML = (debug.detectedIssues || []).map(i => `<li>⚠️ ${escapeHTML(i)}</li>`).join("");
    let recsHTML = (debug.nextInspections || []).map(r => `<li>🔍 <strong>[${escapeHTML(r.target)}]</strong> ${escapeHTML(r.reason)}<br><code>${escapeHTML(r.command)}</code></li>`).join("");
    let tipsHTML = (debug.learningTips || []).map(t => `<li>🎓 ${escapeHTML(t)}</li>`).join("");

    return `
    <div class="card" id="debug-section">
        <div class="card-title">
            <span>🐞 Smart Debug Assistant</span>
            <span class="badge badge-purple">DIAGNOSTIC MODE</span>
        </div>
        <p style="margin-bottom:1rem; color:var(--text-primary);">${escapeHTML(debug.summary)}</p>

        ${issuesHTML ? `<h4 style="margin-bottom:0.5rem; color:var(--accent-red);">Detected Issues</h4><ul style="list-style:none; margin-bottom:1rem; display:flex; flex-direction:column; gap:0.25rem;">${issuesHTML}</ul>` : ''}

        <h4 style="margin-bottom:0.5rem; color:var(--accent-blue);">Recommended Next Inspection</h4>
        <ul style="list-style:none; margin-bottom:1rem; display:flex; flex-direction:column; gap:0.5rem;">
            ${recsHTML}
        </ul>

        ${tipsHTML ? `<h4 style="margin-bottom:0.5rem; color:var(--accent-yellow);">Educational Learning Tips</h4><ul style="list-style:none; display:flex; flex-direction:column; gap:0.25rem;">${tipsHTML}</ul>` : ''}
    </div>`;
}

export function renderRawJSONSection(session: SessionRecord): string {
    const rawJsonStr = JSON.stringify(session, null, 2);
    return `
    <div class="card" id="json-section">
        <div class="card-title">
            <span>📄 Raw SessionRecord Telemetry JSON</span>
            <button class="copy-btn" id="copy-json-btn">📋 Copy JSON</button>
        </div>
        <details open>
            <summary>Toggle Full JSON Inspector</summary>
            <pre id="raw-json-block" style="margin-top:0.75rem;">${escapeHTML(rawJsonStr)}</pre>
        </details>
    </div>`;
}
