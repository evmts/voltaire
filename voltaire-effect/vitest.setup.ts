/**
 * Vitest setup file for voltaire-effect
 * Loads WASM module before running tests (optional - skips if not found)
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const wasmPath = resolve(import.meta.dirname, "../wasm/primitives.wasm");

if (existsSync(wasmPath)) {
	const { loadWasm } = await import("../src/wasm-loader/loader.js");
	const wasmBuffer = readFileSync(wasmPath);
	await loadWasm(wasmBuffer.buffer);
}
