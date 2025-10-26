/**
 * WASM implementation of wallet key generation
 * Uses WebAssembly bindings to Zig implementation
 */
/**
 * Generate a cryptographically secure random private key
 * @returns 32-byte private key
 */
export declare function generatePrivateKey(): Uint8Array;
/**
 * Compress uncompressed secp256k1 public key
 * @param uncompressed - 64-byte uncompressed public key (x, y coordinates)
 * @returns 33-byte compressed public key (0x02/0x03 prefix + x coordinate)
 */
export declare function compressPublicKey(uncompressed: Uint8Array): Uint8Array;
declare const _default: {
    generatePrivateKey: typeof generatePrivateKey;
    compressPublicKey: typeof compressPublicKey;
};
export default _default;
//# sourceMappingURL=wallet.wasm.d.ts.map