/**
 * BLAKE2b WASM implementation
 * Uses WebAssembly bindings to Zig implementation
 */
/**
 * BLAKE2b operations namespace (WASM variant)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export declare namespace Blake2Wasm {
    /**
     * Hash data with BLAKE2b using WASM implementation
     *
     * @see https://voltaire.tevm.sh/crypto for crypto documentation
     * @since 0.0.0
     * @param data - Input data to hash (Uint8Array or string)
     * @param outputLength - Output length in bytes (1-64, default 64)
     * @returns BLAKE2b hash
     * @throws {Blake2InvalidOutputLengthError} If outputLength is invalid
     * @example
     * ```typescript
     * import { Blake2Wasm } from './crypto/Blake2/Blake2.wasm.js';
     * const hash = Blake2Wasm.hash(new Uint8Array([1, 2, 3]));
     * const hash32 = Blake2Wasm.hash("hello", 32);
     * ```
     */
    function hash(data: Uint8Array | string, outputLength?: number): Uint8Array;
    /**
     * Hash string with BLAKE2b using WASM implementation (convenience function)
     *
     * @see https://voltaire.tevm.sh/crypto for crypto documentation
     * @since 0.0.0
     * @param str - Input string to hash
     * @param outputLength - Output length in bytes (1-64, default 64)
     * @returns BLAKE2b hash
     * @throws {Blake2InvalidOutputLengthError} If outputLength is invalid
     * @example
     * ```typescript
     * import { Blake2Wasm } from './crypto/Blake2/Blake2.wasm.js';
     * const hash = Blake2Wasm.hashString("hello world");
     * const hash48 = Blake2Wasm.hashString("hello world", 48);
     * ```
     */
    function hashString(str: string, outputLength?: number): Uint8Array;
}
export default Blake2Wasm;
//# sourceMappingURL=Blake2.wasm.d.ts.map