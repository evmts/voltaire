import { setInitialized } from "./loadTrustedSetup.js";

/**
 * Free trusted setup resources
 *
 * Note: c-kzg v4+ does not provide a freeTrustedSetup function.
 * The trusted setup persists for the lifetime of the process.
 * This function is provided for API compatibility and only resets
 * the initialized flag.
 *
 * @example
 * ```typescript
 * // Reset initialization state
 * freeTrustedSetup();
 * ```
 */
export function freeTrustedSetup() {
	// c-kzg v4+ doesn't have freeTrustedSetup function
	// Just reset tracking flag for testing purposes
	setInitialized(false);
}
