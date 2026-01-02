/**
 * Vitest setup file
 * Loads WASM module before running tests
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { vi } from "vitest";
import { loadWasm } from "./src/wasm-loader/loader.js";

// Load WASM module before all tests
const wasmPath = resolve(import.meta.dirname, "wasm/primitives.wasm");
const wasmBuffer = readFileSync(wasmPath);
await loadWasm(wasmBuffer.buffer);

// Mock process.exit to prevent examples from actually exiting test process
vi.spyOn(process, "exit").mockImplementation(
	(_code?: string | number | null | undefined): never => {
		return undefined as never;
	},
);
