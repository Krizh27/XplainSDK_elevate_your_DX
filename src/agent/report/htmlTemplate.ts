/**
 * @file agent/report/htmlTemplate.ts
 * @description Embedded CSS styling and client-side JavaScript interactions for standalone HTML reports.
 * 
 * DESIGN PHILOSOPHY:
 * 1. Zero External Dependencies: No CDNs, no remote fonts, no external scripts.
 * 2. Vercel/Linear Dark Theme Aesthetic: Sleek dark theme, clean typography, crisp borders.
 * 3. Fully Interactive: Sticky sidebar, search filtering, section toggles, copy buttons.
 */

export const EMBEDDED_CSS = `
:root {
    --bg-primary: #0a0a0a;
    --bg-secondary: #121212;
    --bg-card: #18181b;
    --bg-card-hover: #27272a;
    --border-color: #27272a;
    --text-primary: #f4f4f5;
    --text-secondary: #a1a1aa;
    --text-muted: #71717a;
    --accent-blue: #3b82f6;
    --accent-green: #22c55e;
    --accent-yellow: #eab308;
    --accent-red: #ef4444;
    --accent-purple: #a855f7;
    --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
}

[data-theme="light"] {
    --bg-primary: #f8fafc;
    --bg-secondary: #ffffff;
    --bg-card: #ffffff;
    --bg-card-hover: #f1f5f9;
    --border-color: #e2e8f0;
    --text-primary: #0f172a;
    --text-secondary: #475569;
    --text-muted: #94a3b8;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
    font-family: var(--font-sans);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.5;
    display: flex;
    min-height: 100vh;
}

/* Sidebar Navigation */
.sidebar {
    width: 260px;
    background-color: var(--bg-secondary);
    border-right: 1px solid var(--border-color);
    padding: 1.5rem 1rem;
    position: sticky;
    top: 0;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}

.brand {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-primary);
}

.brand-icon {
    background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
    color: white;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: grid;
    place-items: center;
    font-weight: bold;
    font-size: 0.875rem;
}

.nav-menu {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.nav-link {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    color: var(--text-secondary);
    text-decoration: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.15s ease;
}

.nav-link:hover, .nav-link.active {
    background-color: var(--bg-card-hover);
    color: var(--text-primary);
}

.controls-area {
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.theme-toggle-btn {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

/* Main Content Layout */
.main-content {
    flex: 1;
    padding: 2rem 3rem;
    max-width: 1200px;
}

/* Search Bar */
.search-container {
    margin-bottom: 2rem;
}

.search-input {
    width: 100%;
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.9375rem;
    outline: none;
}

.search-input:focus {
    border-color: var(--accent-blue);
}

/* Cards & Grid Layout */
.card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 1.5rem;
    margin-bottom: 2rem;
}

.card-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.metric-box {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    padding: 1rem;
    border-radius: 8px;
}

.metric-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
}

.metric-value {
    font-size: 1.5rem;
    font-weight: 700;
    margin-top: 0.25rem;
    color: var(--text-primary);
}

/* Badges */
.badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.badge-blue { background: rgba(59, 130, 246, 0.15); color: var(--accent-blue); }
.badge-green { background: rgba(34, 197, 94, 0.15); color: var(--accent-green); }
.badge-yellow { background: rgba(234, 179, 8, 0.15); color: var(--accent-yellow); }
.badge-red { background: rgba(239, 68, 68, 0.15); color: var(--accent-red); }

/* Code & Pre Blocks */
pre, code {
    font-family: var(--font-mono);
    font-size: 0.875rem;
}

pre {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
    color: var(--text-primary);
}

/* Tables */
.table-container {
    overflow-x: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 0.875rem;
}

th, td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border-color);
}

th {
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
    font-weight: 600;
}

/* Collapsible Section Details */
details {
    margin-top: 0.5rem;
}

summary {
    cursor: pointer;
    color: var(--accent-blue);
    font-weight: 500;
    font-size: 0.875rem;
    user-select: none;
}

/* Copy Button */
.copy-btn {
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.75rem;
}

.copy-btn:hover {
    color: var(--text-primary);
    background-color: var(--bg-card-hover);
}
`;

export const EMBEDDED_JS = `
document.addEventListener("DOMContentLoaded", () => {
    // 1. Theme Toggle
    const themeBtn = document.getElementById("theme-toggle");
    themeBtn?.addEventListener("click", () => {
        const currentTheme = document.body.getAttribute("data-theme");
        const nextTheme = currentTheme === "light" ? "dark" : "light";
        document.body.setAttribute("data-theme", nextTheme);
        themeBtn.innerText = nextTheme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode";
    });

    // 2. Filter Search
    const searchInput = document.getElementById("search-input");
    searchInput?.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        const cards = document.querySelectorAll(".card");
        cards.forEach(card => {
            const text = card.innerText.toLowerCase();
            if (text.includes(query)) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        });
    });

    // 3. Copy JSON Button
    const copyBtn = document.getElementById("copy-json-btn");
    copyBtn?.addEventListener("click", () => {
        const jsonText = document.getElementById("raw-json-block")?.innerText;
        if (jsonText) {
            navigator.clipboard.writeText(jsonText).then(() => {
                copyBtn.innerText = "✓ Copied!";
                setTimeout(() => { copyBtn.innerText = "📋 Copy JSON"; }, 2000);
            });
        }
    });
});
`;
