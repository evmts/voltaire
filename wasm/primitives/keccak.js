/**
 * WASM Keccak-256 wrapper powered by loader.js
 * Auto-loads the local primitives.wasm at import time.
 */
import { loadWasm, keccak256 as _keccak256, eip191HashMessage as _eip191HashMessage } from "../loader.js";

// Ensure the WASM module is loaded when this module is imported
await loadWasm(new URL("../primitives.wasm", import.meta.url));

export function keccak256(data) {
  return _keccak256(data);
}

export function eip191HashMessage(message) {
  return _eip191HashMessage(message);
}

export default { keccak256, eip191HashMessage };
