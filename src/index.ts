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

// EVM execution (frame, host, instruction handlers)
export * as evm from "./evm/index.js";

// Precompiles (0x01-0x0a + BLS)
export * as precompiles from "./evm/precompiles/precompiles.js";
