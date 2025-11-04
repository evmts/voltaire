import { getInitialized } from "./loadTrustedSetup.js";

/**
 * Check if KZG is initialized
 *
 * @returns {boolean} true if trusted setup is loaded
 *
 * @example
 * ```typescript
 * if (!isInitialized()) {
 *   loadTrustedSetup();
 * }
 * ```
 */
export function isInitialized() {
	return getInitialized();
}
