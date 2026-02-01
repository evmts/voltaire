/**
 * WASM implementation of hash algorithms
 * Uses WebAssembly bindings to Zig implementation
 */
import * as loader from "../../wasm-loader/loader.js";
/**
 * Compute SHA-256 hash
 * @param data - Input data (string or Uint8Array)
 * @returns 32-byte SHA-256 hash
 */
export function sha256(data) {
    const input = typeof data === "string"
        ? new TextEncoder().encode(data)
        : new Uint8Array(data);
    return loader.sha256(input);
}
/**
 * Compute RIPEMD-160 hash
 * @param data - Input data (string or Uint8Array)
 * @returns 20-byte RIPEMD-160 hash
 */
export function ripemd160(data) {
    const input = typeof data === "string"
        ? new TextEncoder().encode(data)
        : new Uint8Array(data);
    return loader.ripemd160(input);
}
/**
 * Compute BLAKE2b hash
 * @param data - Input data (string or Uint8Array)
 * @returns 64-byte BLAKE2b hash
 */
export function blake2b(data) {
    const input = typeof data === "string"
        ? new TextEncoder().encode(data)
        : new Uint8Array(data);
    return loader.blake2b(input);
}
/**
 * Compute Solidity-style Keccak-256 hash of tightly packed data
 * @param packedData - Pre-packed data bytes
 * @returns 32-byte Keccak-256 hash
 */
export function solidityKeccak256(packedData) {
    const input = new Uint8Array(packedData);
    return loader.solidityKeccak256(input);
}
/**
 * Compute Solidity-style SHA-256 hash of tightly packed data
 * @param packedData - Pre-packed data bytes
 * @returns 32-byte SHA-256 hash
 */
export function soliditySha256(packedData) {
    const input = new Uint8Array(packedData);
    return loader.soliditySha256(input);
}
// Re-export for convenience
export default {
    sha256,
    ripemd160,
    blake2b,
    solidityKeccak256,
    soliditySha256,
};
