/**
 * WASM Test Setup
 * Loads the WASM module before running tests
 */

import { loadWasm } from "../wasm-loader/loader.js";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

// Load WASM module before running any tests
const wasmPath = resolve(import.meta.dir, "../../wasm-loader/primitives.wasm");
const wasmBuffer = await readFile(wasmPath);
await loadWasm(wasmBuffer.buffer as ArrayBuffer);

console.log("✅ WASM module loaded successfully");
