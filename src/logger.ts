/**
 * logger.ts
 * 
 * WHY THIS FILE EXISTS:
 * Provides clean, centralized logging helper functions for ExplainSDK output.
 * 
 * Using a simple function instead of a `Logger` class avoids unneeded OOP overhead
 * while keeping console logging consistent across the library.
 */

/**
 * Standard console logging helper function for SDK messages.
 * 
 * @param message String message to print to stdout.
 */
export function log(message: string): void {
    console.log(message);
}
