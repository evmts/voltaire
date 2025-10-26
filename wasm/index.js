// Unified WASM entrypoint
// - Provides a simple way to load the WASM binary
// - Re-exports loader helpers and primitive-specific wrappers

import { loadWasm as _loadWasm } from "./loader.js";

// Convenience: load the local wasm/primitives.wasm by default
export async function loadWasm(wasmPath = new URL("./primitives.wasm", import.meta.url)) {
  return _loadWasm(wasmPath);
}

// Re-export loader helpers for advanced use
export * from "./loader.js";

// Re-export primitive wrappers (these auto-load the WASM on import)
export * from "./primitives/keccak.js";
export * from "./primitives/address.js";
export * from "./primitives/rlp.js";
export * from "./primitives/transaction.js";

