import { AgentMessage, StorageAdapter } from "./types.js";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

export interface FileStorageOptions {
    /** Target directory for session JSON files. @default "./storage" */
    storageDir?: string;
}

/**
 * @class FileStorageAdapter
 * @description Persistent disk file storage adapter saving session history to JSON files.
 * 
 * @example
 * ```typescript
 * const fileMemory = new FileStorageAdapter({ storageDir: "./my_sessions" });
 * const agent = new Agent({ name: "SupportAgent", apiKey: "...", memory: fileMemory });
 * ```
 */
export class FileStorageAdapter implements StorageAdapter {
    private storageDir: string;

    constructor(options?: FileStorageOptions) {
        this.storageDir = path.resolve(options?.storageDir || "./storage");
    }

    private getFilePath(sessionId: string): string {
        const sanitizedId = sessionId.replace(/[^a-zA-Z0-9_-]/g, "_");
        return path.join(this.storageDir, `${sanitizedId}.json`);
    }

    public async get(sessionId: string): Promise<AgentMessage[] | undefined> {
        if (!sessionId) return undefined;
        const filePath = this.getFilePath(sessionId);

        try {
            const content = await readFile(filePath, "utf-8");
            return JSON.parse(content) as AgentMessage[];
        } catch (err: any) {
            if (err.code === "ENOENT") {
                return undefined;
            }
            throw new Error(
                `[AgentSDK Error] Failed to read session memory file "${filePath}".\n\n` +
                `What Happened: An error occurred while reading persistent memory from disk.\n` +
                `Why: ${err.message}\n` +
                `How to Fix: Ensure the application has read permissions for the target directory.`
            );
        }
    }

    public async set(sessionId: string, messages: AgentMessage[]): Promise<void> {
        if (!sessionId) return;
        const filePath = this.getFilePath(sessionId);

        try {
            await mkdir(this.storageDir, { recursive: true });
            const content = JSON.stringify(messages, null, 2);
            await writeFile(filePath, content, "utf-8");
        } catch (err: any) {
            throw new Error(
                `[AgentSDK Error] Failed to write session memory file "${filePath}".\n\n` +
                `What Happened: An error occurred while writing persistent memory to disk.\n` +
                `Why: ${err.message}\n` +
                `How to Fix: Ensure the application has file write permissions for "${this.storageDir}".`
            );
        }
    }

    public async clear(sessionId: string): Promise<void> {
        if (!sessionId) return;
        const filePath = this.getFilePath(sessionId);

        try {
            await unlink(filePath);
        } catch (err: any) {
            if (err.code !== "ENOENT") {
                throw err;
            }
        }
    }
}
