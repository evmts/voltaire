/**
 * Vitest setup file
 * Loads WASM module before running tests
 */

import { loadWasm } from "./src/wasm-loader/loader.js";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";

// Load WASM module before all tests
const wasmPath = resolve(import.meta.dirname, "src/wasm-loader/primitives.wasm");
const wasmBuffer = readFileSync(wasmPath);
await loadWasm(wasmBuffer.buffer);
