/**
 * Vitest setup file for voltaire-effect
 * Loads WASM module before running tests
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadWasm } from "@tevm/voltaire/wasm";

const wasmPath = resolve(import.meta.dirname, "../wasm/primitives.wasm");
const wasmBuffer = readFileSync(wasmPath);
await loadWasm(wasmBuffer.buffer);
