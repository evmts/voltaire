/**
 * RIPEMD160 Hash Function (WASM Implementation)
 *
 * WebAssembly-based implementation using Zig ripemd160 module.
 * Provides the same interface as the Noble-based implementation.
 *
 * @example
 * ```typescript
 * import { Ripemd160Wasm } from './ripemd160.wasm.js';
 *
 * // Load WASM first
 * await Ripemd160Wasm.load();
 *
 * // Hash bytes
 * const hash = Ripemd160Wasm.hash(data);
 *
 * // Hash string
 * const hash2 = Ripemd160Wasm.hashString("hello");
 * ```
 */
/**
 * Reset memory allocator (currently unused)
 */
export declare namespace Ripemd160Wasm {
    /**
     * Load WASM module (must be called before using other functions)
     */
    function load(): Promise<void>;
    /**
     * Compute RIPEMD160 hash (20 bytes)
     *
     * @param data - Input data (Uint8Array or string)
     * @returns 20-byte hash
     *
     * @example
     * ```typescript
     * const hash = Ripemd160Wasm.hash(data);
     * // Uint8Array(20)
     * ```
     */
    function hash(data: Uint8Array | string): Uint8Array;
    /**
     * Compute RIPEMD160 hash of UTF-8 string
     *
     * @param str - Input string
     * @returns 20-byte hash
     *
     * @example
     * ```typescript
     * const hash = Ripemd160Wasm.hashString("hello");
     * // Uint8Array(20)
     * ```
     */
    function hashString(str: string): Uint8Array;
}
export default Ripemd160Wasm;
//# sourceMappingURL=ripemd160.wasm.d.ts.map