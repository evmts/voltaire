/**
 * @tevm/primitives - Ethereum primitives and cryptography
 * TypeScript implementations with native Zig bindings via Bun FFI and WASM
 */

// Streaming primitives - BlockStream, EventStream, TransactionStream
export * as block from "./block/index.js";
export * as contract from "./contract/index.js";
// Cryptography - Data-first crypto operations
export * from "./crypto/index.js";
// EVM execution (frame, host, instruction handlers)
export * as evm from "./evm/index.js";
// Precompiles (0x01-0x0a + BLS)
export * as precompiles from "./evm/precompiles/precompiles.js";
// Core primitives - Data-first, tree-shakeable API
export * from "./primitives/index.js";
// Standards - Ethereum token standards (ERC-20, ERC-721, ERC-1155, ERC-165)
export * from "./standards/index.js";
export * as stream from "./stream/index.js";
export * as transaction from "./transaction/index.js";
// Wallet utilities
// WASM primitives (high-performance WebAssembly bindings)
export * as wasm from "./wasm/index.js";
