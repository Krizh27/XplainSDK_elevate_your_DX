import { SessionRecord } from "../../types.js";
import { ReportOptions } from "./types.js";
import { EMBEDDED_CSS, EMBEDDED_JS } from "./htmlTemplate.js";
import {
    renderHeaderSection,
    renderSummarySection,
    renderTimelineSection,
    renderToolsSection,
    renderAdvisorsSection,
    renderRawJSONSection
} from "./renderer.js";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * @file agent/report/report.ts
 * @description Pure orchestrator compiling SessionRecord telemetry into a single standalone HTML report document.
 */

/**
 * Compiles a standalone HTML report document string from a recorded SessionRecord object.
 * 
 * @param session SessionRecord flight recorder object.
 * @param options Report configuration options.
 * @returns Complete, self-contained HTML document string.
 */
export function generateHTMLReport(
    session: SessionRecord,
    options?: ReportOptions & { handoffChain?: string[]; runId?: string }
): string {
    const title = options?.title || `Agent Run Report - ${session.id}`;

    const headerHTML = renderHeaderSection(session, options?.runId);
    const summaryHTML = renderSummarySection(session, options?.handoffChain);
    const timelineHTML = renderTimelineSection(session);
    const toolsHTML = renderToolsSection(session);
    const advisorsHTML = renderAdvisorsSection(session);
    const jsonHTML = renderRawJSONSection(session);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>${EMBEDDED_CSS}</style>
</head>
<body data-theme="dark">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
        <div class="brand">
            <div class="brand-icon">X</div>
            <span>XplainSDK</span>
        </div>
        <ul class="nav-menu">
            <li><a href="#header-section" class="nav-link active">🚀 Overview</a></li>
            <li><a href="#summary-section" class="nav-link">🧠 Executive Summary</a></li>
            <li><a href="#timeline-section" class="nav-link">⏱ Timeline</a></li>
            <li><a href="#tools-section" class="nav-link">🛠 Tools Executed</a></li>
            <li><a href="#advisors-section" class="nav-link">💡 Advisors</a></li>
            <li><a href="#json-section" class="nav-link">📄 Raw Telemetry JSON</a></li>
        </ul>
        <div class="controls-area">
            <button class="theme-toggle-btn" id="theme-toggle">🌙 Dark Mode</button>
        </div>
    </aside>

    <!-- Main Dashboard Content -->
    <main class="main-content">
        <div class="search-container">
            <input type="text" id="search-input" class="search-input" placeholder="🔍 Search telemetry, tools, advisors, timeline..." />
        </div>

        ${headerHTML}
        ${summaryHTML}
        ${timelineHTML}
        ${toolsHTML}
        ${advisorsHTML}
        ${jsonHTML}
    </main>

    <script>${EMBEDDED_JS}</script>
</body>
</html>`;
}

/**
 * Generates an HTML report document string and writes it to disk at `options.outputPath`.
 * 
 * @param session SessionRecord flight recorder object.
 * @param options Report options containing `outputPath`.
 * @returns Promise resolving to the generated HTML string.
 */
export async function saveHTMLReport(
    session: SessionRecord,
    options?: ReportOptions & { handoffChain?: string[]; runId?: string }
): Promise<string> {
    const htmlContent = generateHTMLReport(session, options);
    const targetFilePath = options?.outputPath || "./report.html";

    const resolvedPath = path.resolve(targetFilePath);
    const dir = path.dirname(resolvedPath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(resolvedPath, htmlContent, "utf-8");

    return htmlContent;
}
