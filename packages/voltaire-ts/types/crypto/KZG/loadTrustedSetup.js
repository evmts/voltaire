import { kzgFreeTrustedSetup as wasmFreeTrustedSetup, kzgIsInitialized as wasmIsInitialized, kzgLoadTrustedSetup as wasmLoadTrustedSetup, } from "../../wasm-loader/loader.js";
import { KzgError } from "./errors.js";
/**
 * Load trusted setup from embedded data
 *
 * Uses the embedded trusted setup from c-kzg-4844.
 * Call this once during application startup before using any KZG operations.
 *
 * Available in both native FFI and WASM environments.
 *
 * @see https://voltaire.tevm.sh/crypto/kzg
 * @since 0.0.0
 * @param {string} [_filePath] - Optional path (ignored, uses embedded setup)
 * @returns {void}
 * @throws {KzgError} If loading fails
 * @example
 * ```javascript
 * import { loadTrustedSetup } from './crypto/KZG/index.js';
 *
 * loadTrustedSetup();
 * ```
 */
export function loadTrustedSetup(_filePath) {
    try {
        wasmLoadTrustedSetup();
    }
    catch (error) {
        throw new KzgError(`Failed to load KZG trusted setup: ${error instanceof Error ? error.message : String(error)}`, {
            code: -32000,
            context: { environment: "wasm" },
            docsPath: "/crypto/kzg#error-handling",
            cause: error instanceof Error ? error : undefined,
        });
    }
}
/**
 * Free trusted setup resources
 *
 * Call when KZG operations are no longer needed.
 *
 * @see https://voltaire.tevm.sh/crypto/kzg
 * @since 0.0.0
 * @returns {void}
 */
export function freeTrustedSetup() {
    wasmFreeTrustedSetup();
}
/**
 * Get initialization state (internal)
 * @internal
 */
export function getInitialized() {
    return wasmIsInitialized();
}
/**
 * Set initialization state (internal)
 * @internal
 * @param {boolean} _value - Ignored (managed by WASM layer)
 */
export function setInitialized(_value) {
    // No-op: initialization state is managed by WASM layer
}
