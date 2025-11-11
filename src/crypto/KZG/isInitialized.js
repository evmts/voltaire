import { getInitialized } from "./loadTrustedSetup.js";

/**
 * Check if KZG is initialized
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @returns {boolean} true if trusted setup is loaded
 * @throws {never}
 * @example
 * ```javascript
 * import { isInitialized, loadTrustedSetup } from './crypto/KZG/index.js';
 * if (!isInitialized()) {
 *   loadTrustedSetup();
 * }
 * ```
 */
export function isInitialized() {
	return getInitialized();
}
