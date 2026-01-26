/**
 * Vitest setup file
 * Loads WASM module before running tests (optional - skips if not found)
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { vi } from "vitest";

// Load WASM module before all tests (skip if not built)
const wasmPath = resolve(import.meta.dirname, "wasm/primitives.wasm");
if (existsSync(wasmPath)) {
	const { loadWasm } = await import("./src/wasm-loader/loader.js");
	const wasmBuffer = readFileSync(wasmPath);
	await loadWasm(wasmBuffer.buffer);
}

// Mock process.exit to prevent examples from actually exiting test process
vi.spyOn(process, "exit").mockImplementation(
	(_code?: string | number | null | undefined): never => {
		return undefined as never;
	},
);
