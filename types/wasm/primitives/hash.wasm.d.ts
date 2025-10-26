/**
 * WASM implementation of hash algorithms
 * Uses WebAssembly bindings to Zig implementation
 */
/**
 * Compute SHA-256 hash
 * @param data - Input data (string, Uint8Array, or Buffer)
 * @returns 32-byte SHA-256 hash
 */
export declare function sha256(data: string | Uint8Array): Uint8Array;
/**
 * Compute RIPEMD-160 hash
 * @param data - Input data (string, Uint8Array, or Buffer)
 * @returns 20-byte RIPEMD-160 hash
 */
export declare function ripemd160(data: string | Uint8Array): Uint8Array;
/**
 * Compute BLAKE2b hash
 * @param data - Input data (string, Uint8Array, or Buffer)
 * @returns 64-byte BLAKE2b hash
 */
export declare function blake2b(data: string | Uint8Array): Uint8Array;
/**
 * Compute Solidity-style Keccak-256 hash of tightly packed data
 * @param packedData - Pre-packed data bytes
 * @returns 32-byte Keccak-256 hash
 */
export declare function solidityKeccak256(packedData: Uint8Array): Uint8Array;
/**
 * Compute Solidity-style SHA-256 hash of tightly packed data
 * @param packedData - Pre-packed data bytes
 * @returns 32-byte SHA-256 hash
 */
export declare function soliditySha256(packedData: Uint8Array): Uint8Array;
declare const _default: {
    sha256: typeof sha256;
    ripemd160: typeof ripemd160;
    blake2b: typeof blake2b;
    solidityKeccak256: typeof solidityKeccak256;
    soliditySha256: typeof soliditySha256;
};
export default _default;
//# sourceMappingURL=hash.wasm.d.ts.map