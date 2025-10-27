/**
 * @tevm/primitives - Ethereum primitives and cryptography
 * TypeScript implementations with native Zig bindings via Bun FFI and WASM
 */

// Core type definitions (exported as namespace to avoid conflicts with ethereum-types)
export * as types from "./types/index.js";

// Ethereum type interfaces (JSON-RPC types)
export * from "./ethereum-types/index.js";

// Cryptography (native FFI and pure TypeScript)
export * from "./crypto/index.js";

// WASM primitives (high-performance WebAssembly bindings) - exported as namespace to avoid conflicts
export * as wasm from "./wasm/index.js";

// EVM precompiles (namespace export to avoid conflicts with crypto module)
export * as precompiles from "./precompiles/precompiles.js";
