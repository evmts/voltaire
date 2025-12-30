import { KzgError } from "./errors.js";

// Track initialization state
let initialized = false;

/**
 * Load trusted setup from embedded data or file
 *
 * **IMPORTANT: Requires native FFI bindings.**
 * KZG is not available in WASM or pure JavaScript environments.
 *
 * Uses embedded trusted setup by default when native bindings are available.
 * Call this once during application startup.
 *
 * @see https://voltaire.tevm.sh/crypto/kzg
 * @since 0.0.0
 * @param {string} [_filePath] - Optional path to trusted setup file (native only)
 * @returns {void}
 * @throws {KzgError} Always throws - native bindings required
 * @example
 * ```javascript
 * import { loadTrustedSetup } from './crypto/KZG/index.js';
 *
 * // Note: Requires native bindings
 * loadTrustedSetup();
 * ```
 */
export function loadTrustedSetup(_filePath) {
	throw new KzgError(
		"loadTrustedSetup() requires native FFI bindings. " +
			"KZG is not available in WASM or pure JavaScript environments. " +
			"Use native FFI or perform KZG operations server-side.",
		{
			code: "KZG_NATIVE_REQUIRED",
			context: { environment: "javascript" },
			docsPath: "/crypto/kzg#native-only",
		},
	);
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
