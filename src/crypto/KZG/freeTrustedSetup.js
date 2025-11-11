import { setInitialized } from "./loadTrustedSetup.js";

/**
 * Free trusted setup resources
 *
 * Note: c-kzg v4+ does not provide a freeTrustedSetup function.
 * The trusted setup persists for the lifetime of the process.
 * This function is provided for API compatibility and only resets
 * the initialized flag.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @returns {void}
 * @throws {never}
 * @example
 * ```javascript
 * import { freeTrustedSetup } from './crypto/KZG/index.js';
 * // Reset initialization state
 * freeTrustedSetup();
 * ```
 */
export function freeTrustedSetup() {
	// c-kzg v4+ doesn't have freeTrustedSetup function
	// Just reset tracking flag for testing purposes
	setInitialized(false);
}
