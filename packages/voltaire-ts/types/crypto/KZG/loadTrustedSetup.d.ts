/**
 * Load trusted setup for KZG operations.
 *
 * Call this once during application startup before using any KZG operations.
 * In Node/Bun, loads the standalone `trusted_setup.txt` file lazily on demand
 * without embedding 788 KB into `primitives.wasm`. In browsers, pass the raw
 * `trusted_setup.txt` `Uint8Array` bytes directly.
 *
 * @see https://voltaire.tevm.sh/crypto/kzg
 * @since 0.0.0
 * @param {string | Uint8Array} [filePathOrBytes] - Optional path to `trusted_setup.txt` (Node/Bun) or raw UTF-8 setup bytes (browser/edge)
 * @returns {void}
 * @throws {KzgError} If loading fails
 */
export function loadTrustedSetup(filePathOrBytes?: string | Uint8Array): void;
/**
 * Free trusted setup resources
 *
 * Call when KZG operations are no longer needed.
 *
 * @see https://voltaire.tevm.sh/crypto/kzg
 * @since 0.0.0
 * @returns {void}
 */
export function freeTrustedSetup(): void;
/**
 * Get initialization state (internal)
 * @internal
 */
export function getInitialized(): boolean;
/**
 * Set initialization state (internal)
 * @internal
 * @param {boolean} _value - Ignored (managed by WASM layer)
 */
export function setInitialized(_value: boolean): void;
//# sourceMappingURL=loadTrustedSetup.d.ts.map