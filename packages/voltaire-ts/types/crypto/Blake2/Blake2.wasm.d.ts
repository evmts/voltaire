/**
 * BLAKE2b WASM implementation (Standalone 1.8 kB Micro-WASM)
 *
 * Instantiates the standalone `blake2.wasm` (1.8 kB, zero imports) directly
 * without loading the unified `primitives.wasm` monolith.
 * Auto-initializes synchronously in Node/Bun on first call; in browsers, call
 * `await Blake2Wasm.init()` before hashing.
 */
export type Blake2WasmInput = string | URL | Uint8Array | ArrayBuffer;
/**
 * BLAKE2b operations namespace (standalone 1.8 kB WASM variant)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export declare namespace Blake2Wasm {
    /**
     * Initialize standalone 1.8 kB BLAKE2b micro-WASM asynchronously.
     */
    function init(wasmInput?: Blake2WasmInput): Promise<void>;
    /**
     * Initialize standalone 1.8 kB BLAKE2b micro-WASM synchronously.
     */
    function initSync(wasmInput?: Blake2WasmInput): void;
    /**
     * Check whether the standalone BLAKE2b micro-WASM is loaded.
     */
    function isReady(): boolean;
    /**
     * Unload the standalone BLAKE2b micro-WASM instance (primarily for testing).
     */
    function reset(): void;
    /**
     * Hash data with BLAKE2b using standalone 1.8 kB WASM implementation.
     *
     * @param data - Input data to hash (Uint8Array or string)
     * @param outputLength - Output length in bytes (1-64, default 64)
     * @returns BLAKE2b hash
     * @throws {Blake2InvalidOutputLengthError} If outputLength is invalid
     */
    function hash(data: Uint8Array | string, outputLength?: number): Uint8Array;
    /**
     * Hash string with BLAKE2b using standalone WASM implementation.
     *
     * @param str - Input string to hash
     * @param outputLength - Output length in bytes (1-64, default 64)
     * @returns BLAKE2b hash
     */
    function hashString(str: string, outputLength?: number): Uint8Array;
}
export default Blake2Wasm;
//# sourceMappingURL=Blake2.wasm.d.ts.map