/**
 * RIPEMD160 Hash Function (Standalone 1.5 kB Micro-WASM Implementation)
 *
 * Instantiates the standalone `ripemd160.wasm` (1.5 kB, zero imports) directly
 * without loading the unified `primitives.wasm` monolith.
 * Auto-initializes synchronously in Node/Bun on first call; in browsers, call
 * `await Ripemd160Wasm.load()` (or `await Ripemd160Wasm.init()`) before hashing.
 *
 * @example
 * ```typescript
 * import { Ripemd160Wasm } from './ripemd160.wasm.js';
 *
 * // Node/Bun: auto-loads 1.5 kB micro-WASM synchronously on first call
 * // Browser: await Ripemd160Wasm.load();
 * const hash = Ripemd160Wasm.hash(data);
 * const hash2 = Ripemd160Wasm.hashString("hello");
 * ```
 */
export type Ripemd160WasmInput = string | URL | Uint8Array | ArrayBuffer;
export declare namespace Ripemd160Wasm {
    /**
     * Load standalone 1.5 kB RIPEMD160 micro-WASM asynchronously.
     */
    function load(wasmInput?: Ripemd160WasmInput): Promise<void>;
    /**
     * Alias for `load()` to match `Keccak256Wasm.init()` / `Blake2Wasm.init()`.
     */
    function init(wasmInput?: Ripemd160WasmInput): Promise<void>;
    /**
     * Load standalone 1.5 kB RIPEMD160 micro-WASM synchronously.
     */
    function loadSync(wasmInput?: Ripemd160WasmInput): void;
    /**
     * Alias for `loadSync()`.
     */
    function initSync(wasmInput?: Ripemd160WasmInput): void;
    /**
     * Check whether the standalone RIPEMD160 micro-WASM is loaded.
     */
    function isReady(): boolean;
    /**
     * Unload the standalone RIPEMD160 micro-WASM instance (primarily for testing).
     */
    function reset(): void;
    /**
     * Compute RIPEMD160 hash (20 bytes) using standalone 1.5 kB micro-WASM.
     *
     * @param data - Input data (Uint8Array or string)
     * @returns 20-byte hash
     */
    function hash(data: Uint8Array | string): Uint8Array;
    /**
     * Compute RIPEMD160 hash of UTF-8 string.
     *
     * @param str - Input string
     * @returns 20-byte hash
     */
    function hashString(str: string): Uint8Array;
    /**
     * Compute RIPEMD160 hash of hex string (with or without 0x prefix).
     *
     * @param hex - Hex string
     * @returns 20-byte hash
     */
    function hashHex(hex: string): Uint8Array;
}
export default Ripemd160Wasm;
//# sourceMappingURL=ripemd160.wasm.d.ts.map