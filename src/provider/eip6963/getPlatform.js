/**
 * Platform detection for EIP-6963
 *
 * Detects the current runtime environment.
 *
 * @module provider/eip6963/getPlatform
 */

import { UnsupportedEnvironmentError } from "./errors.js";

/**
 * Detect the current platform
 *
 * @returns {'browser' | 'node' | 'bun' | 'worker' | 'unknown'} The detected platform
 *
 * @example
 * ```typescript
 * import * as EIP6963 from '@voltaire/provider/eip6963';
 *
 * const platform = EIP6963.getPlatform();
 * if (platform === 'browser') {
 *   // Safe to use EIP-6963
 * }
 * ```
 */
export function getPlatform() {
	// Check for browser first (most common case)
	if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
		return "browser";
	}

	// Check for Bun before Node since Bun also has process
	if (typeof globalThis.Bun !== "undefined") {
		return "bun";
	}

	// Check for Node.js
	if (
		typeof process !== "undefined" &&
		process.versions &&
		process.versions.node
	) {
		return "node";
	}

	// Check for Web Worker
	if (typeof WorkerGlobalScope !== "undefined") {
		return "worker";
	}

	return "unknown";
}

/**
 * Assert that we're in a browser environment
 *
 * @throws {UnsupportedEnvironmentError} If not in browser
 *
 * @example
 * ```typescript
 * import { assertBrowser } from '@voltaire/provider/eip6963';
 *
 * assertBrowser(); // Throws if not in browser
 * ```
 */
export function assertBrowser() {
	const platform = getPlatform();
	if (platform !== "browser") {
		throw new UnsupportedEnvironmentError(platform);
	}
}
