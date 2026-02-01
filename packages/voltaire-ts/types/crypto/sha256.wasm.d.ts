/**
 * WASM implementation of SHA256 hash function
 * Uses WebAssembly bindings to Zig implementation
 */
/**
 * SHA256 hash function implemented using WASM Zig code
 */
export declare namespace Sha256Wasm {
    /**
     * SHA256 output size in bytes (256 bits / 8)
     */
    const OUTPUT_SIZE = 32;
    /**
     * SHA256 block size in bytes
     */
    const BLOCK_SIZE = 64;
    /**
     * Compute SHA256 hash of input data
     *
     * @param data - Input data as Uint8Array
     * @returns 32-byte hash
     *
     * @example
     * ```typescript
     * const hash = Sha256Wasm.hash(new Uint8Array([1, 2, 3]));
     * // Uint8Array(32) [...]
     * ```
     */
    function hash(data: Uint8Array): Uint8Array;
    /**
     * Compute SHA256 hash of UTF-8 string
     *
     * @param str - Input string
     * @returns 32-byte hash
     *
     * @example
     * ```typescript
     * const hash = Sha256Wasm.hashString("hello world");
     * // Uint8Array(32) [0xb9, 0x4d, 0x27, ...]
     * ```
     */
    function hashString(str: string): Uint8Array;
    /**
     * Compute SHA256 hash of hex string (without 0x prefix)
     *
     * @param hex - Hex string (with or without 0x prefix)
     * @returns 32-byte hash
     *
     * @example
     * ```typescript
     * const hash = Sha256Wasm.hashHex("0xdeadbeef");
     * // Uint8Array(32) [...]
     * ```
     */
    function hashHex(hex: string): Uint8Array;
    /**
     * Convert hash output to hex string
     *
     * @param hash - Hash bytes
     * @returns Hex string with 0x prefix
     *
     * @example
     * ```typescript
     * const hash = Sha256Wasm.hash(data);
     * const hexStr = Sha256Wasm.toHex(hash);
     * // "0x..."
     * ```
     */
    function toHex(hash: Uint8Array): string;
    /**
     * Incremental hasher for streaming data
     *
     * Note: This implementation uses a simple buffer accumulator.
     * For truly large streaming data, consider using the Noble.js implementation.
     *
     * @example
     * ```typescript
     * const hasher = Sha256Wasm.create();
     * hasher.update(chunk1);
     * hasher.update(chunk2);
     * const hash = hasher.digest();
     * ```
     */
    function create(): {
        /**
         * Update hasher with new data
         */
        update(data: Uint8Array): void;
        /**
         * Finalize and get hash
         */
        digest(): Uint8Array;
    };
}
export default Sha256Wasm;
//# sourceMappingURL=sha256.wasm.d.ts.map