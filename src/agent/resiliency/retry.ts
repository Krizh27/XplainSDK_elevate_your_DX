import { ResiliencyOptions } from "./types.js";

/**
 * @file agent/resiliency/retry.ts
 * @description Provider-independent retry engine with exponential backoff, jitter, timeout wrapper, and transient error detection.
 */

/**
 * Evaluates whether an error represents a transient network/server failure that can be safely retried.
 * 
 * NEVER retries validation failures (Zod errors, Guardrail violations, 401 Unauthorized, 404 Not Found).
 */
export function isTransientError(error: any): boolean {
    if (!error) return false;

    // Do NOT retry Guardrail errors or Schema Validation errors
    const errorMessage = String(error.message || error);
    if (errorMessage.includes("[AgentSDK Guardrail Error]") || errorMessage.includes("ZodError") || errorMessage.includes("validation")) {
        return false;
    }

    // Inspect HTTP status codes
    const status = error.status || error.statusCode || error.response?.status;
    if (status) {
        if (status === 429 || status === 500 || status === 502 || status === 503 || status === 504 || status === 529) {
            return true; // Rate limits and server errors are transient
        }
        if (status === 400 || status === 401 || status === 403 || status === 404) {
            return false; // Auth, permission, and client errors are non-transient
        }
    }

    // Inspect Node.js network error codes
    const code = error.code;
    if (code === "ECONNRESET" || code === "ETIMEDOUT" || code === "ECONNREFUSED" || code === "ENOTFOUND") {
        return true;
    }

    // Check timeout or rate limit error messages
    const lower = errorMessage.toLowerCase();
    if (lower.includes("timeout") || lower.includes("socket hang up") || lower.includes("rate limit") || errorMessage.includes("429") || errorMessage.includes("500") || errorMessage.includes("503")) {
        return true;
    }

    return false;
}

/** Helper function to pause execution for a given delay in milliseconds. */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wraps an asynchronous operation with a timeout limit.
 * 
 * @throws Actionable 3-part diagnostic error if execution exceeds timeoutMs.
 */
export async function withTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    operationName: string = "Operation"
): Promise<T> {
    if (!timeoutMs || timeoutMs <= 0) {
        return await fn();
    }

    let timer: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
            reject(new Error(
                `[AgentSDK Timeout Error] ${operationName} timed out after ${timeoutMs} ms.\n\n` +
                `What Happened: Execution exceeded the configured timeout limit of ${timeoutMs} ms.\n` +
                `Why: The remote LLM provider endpoint or tool execution did not respond within time bounds.\n` +
                `How to Fix: Increase timeoutMs in AgentConfig or optimize request prompt length.`
            ));
        }, timeoutMs);
    });

    try {
        return await Promise.race([fn(), timeoutPromise]);
    } finally {
        clearTimeout(timer!);
    }
}

/**
 * Executes an asynchronous operation with exponential backoff retries for transient errors and timeout enforcement.
 * 
 * @param fn The asynchronous function to execute.
 * @param options Resiliency options containing `retries`, `initialDelayMs`, `timeoutMs`.
 * @param operationName Name of operation for diagnostic error reporting.
 */
export async function withRetryAndTimeout<T>(
    fn: () => Promise<T>,
    options?: ResiliencyOptions,
    operationName: string = "Agent Request"
): Promise<T> {
    const maxRetries = options?.retries !== undefined ? options.retries : 3;
    const initialDelay = options?.initialDelayMs || 200;
    const timeoutMs = options?.timeoutMs || 30000;

    let attempt = 0;

    while (true) {
        try {
            return await withTimeout(fn, timeoutMs, operationName);
        } catch (error: any) {
            attempt++;

            // If non-transient or retries exhausted, throw immediately
            if (!isTransientError(error) || attempt > maxRetries) {
                throw error;
            }

            // Exponential backoff with random jitter: delay = initialDelay * (2 ^ attempt) + jitter
            const exponentialDelay = initialDelay * Math.pow(2, attempt - 1);
            const jitter = Math.random() * 100;
            const totalDelay = Math.round(exponentialDelay + jitter);

            await sleep(totalDelay);
        }
    }
}
