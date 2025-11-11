import * as ckzg from "c-kzg";
import { KzgError } from "./errors.js";

// Track initialization state
let initialized = false;

/**
 * Load trusted setup from embedded data or file
 *
 * Uses embedded trusted setup from c-kzg by default.
 * Call this once during application startup.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} [filePath] - Optional path to trusted setup file
 * @returns {void}
 * @throws {KzgError} If loading fails
 * @example
 * ```javascript
 * import { loadTrustedSetup } from './crypto/KZG/index.js';
 * // Use embedded setup (recommended)
 * loadTrustedSetup();
 *
 * // Or load from file
 * loadTrustedSetup('./trusted_setup.txt');
 * ```
 */
export function loadTrustedSetup(filePath) {
	try {
		// c-kzg doesn't allow reloading, skip if already initialized
		if (initialized) {
			return;
		}
		if (filePath) {
			// Load from file if path provided
			// c-kzg expects loadTrustedSetup(precompute: number, filePath: string)
			ckzg.loadTrustedSetup(0, filePath);
		} else {
			// Use embedded trusted setup
			// Just pass precompute=0 to use default embedded setup
			ckzg.loadTrustedSetup(0);
		}
		initialized = true;
	} catch (error) {
		// If already loaded by c-kzg, just mark as initialized
		if (error instanceof Error && error.message.includes("already loaded")) {
			initialized = true;
			return;
		}
		throw new KzgError(
			`Failed to load trusted setup: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * Get initialization state (internal)
 * @internal
 */
export function getInitialized() {
	return initialized;
}

/**
 * Set initialization state (internal)
 * @internal
 * @param {boolean} value
 */
export function setInitialized(value) {
	initialized = value;
}
