/**
 * @tevm/primitives - Ethereum primitives and cryptography
 * TypeScript implementations with native Zig bindings via Bun FFI and WASM
 */

// Core primitives - Data-first, tree-shakeable API
export * from "./primitives/index.js";

// Cryptography - Data-first crypto operations
export * from "./crypto/index.js";

// Core type definitions are exported directly from primitives (no separate types namespace)

// WASM primitives (high-performance WebAssembly bindings)
export * as wasm from "./wasm/index.js";

// EVM precompiles and opcodes
export * as evm from "./precompiles/precompiles.js";

// Legacy: precompiles alias (deprecated, use evm instead)
export * as precompiles from "./precompiles/precompiles.js";
