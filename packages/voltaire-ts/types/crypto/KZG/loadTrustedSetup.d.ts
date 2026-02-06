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
export function loadTrustedSetup(_filePath?: string): void;
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