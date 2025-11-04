/**
 * Vitest setup file
 * Loads WASM module before running tests
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadWasm } from "./src/wasm-loader/loader.js";

// Load WASM module before all tests
const wasmPath = resolve(
	import.meta.dirname,
	"src/wasm-loader/primitives.wasm",
);
const wasmBuffer = readFileSync(wasmPath);
await loadWasm(wasmBuffer.buffer);
