import { afterEach, beforeEach } from "vitest";

// Store original console methods
const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
};

// Store console output for potential restoration on failure
const suppressedOutputMap = new Map<string, Array<{ method: string; args: any[] }>>();

// Suppress console methods during tests
beforeEach((ctx) => {
    const testId = ctx.task?.id || "unknown";
    suppressedOutputMap.set(testId, []);

    console.log = (...args: any[]) => {
        const output = suppressedOutputMap.get(testId);
        if (output) {
            output.push({ method: "log", args });
        }
    };

    console.error = (...args: any[]) => {
        const output = suppressedOutputMap.get(testId);
        if (output) {
            output.push({ method: "error", args });
        }
    };

    console.warn = (...args: any[]) => {
        const output = suppressedOutputMap.get(testId);
        if (output) {
            output.push({ method: "warn", args });
        }
    };

    console.info = (...args: any[]) => {
        const output = suppressedOutputMap.get(testId);
        if (output) {
            output.push({ method: "info", args });
        }
    };

    console.debug = (...args: any[]) => {
        const output = suppressedOutputMap.get(testId);
        if (output) {
            output.push({ method: "debug", args });
        }
    };
});

// Restore console methods after each test
afterEach((ctx) => {
    const testId = ctx.task?.id || "unknown";
    const suppressedOutput = suppressedOutputMap.get(testId);

    // Restore original console methods
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;

    // Check if test failed and output suppressed messages
    const testState = ctx.task?.result?.state;
    if (testState === "fail" && suppressedOutput && suppressedOutput.length > 0) {
        console.log("\n=== Suppressed console output during failed test ===\n");
        for (const entry of suppressedOutput) {
            originalConsole[entry.method as keyof typeof originalConsole](...entry.args);
        }
        console.log("\n===================================================\n");
    }

    // Clean up stored output
    suppressedOutputMap.delete(testId);
});

