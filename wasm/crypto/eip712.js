/**
 * EIP-712 wrapper - re-exports from src/crypto/eip712.ts
 * Note: EIP-712 is not yet available via WASM FFI, so this uses the pure TypeScript implementation
 */

export { hashDomain, hashTypedData } from "../../src/crypto/eip712.js";
