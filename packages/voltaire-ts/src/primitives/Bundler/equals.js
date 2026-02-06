import * as Address from "../Address/internal-index.js";

/**
 * Check if two Bundler addresses are equal
 *
 * @param {import('./BundlerType.js').BundlerType} a - First Bundler
 * @param {import('./BundlerType.js').BundlerType} b - Second Bundler
 * @returns {boolean} True if addresses are equal
 *
 * @example
 * ```typescript
 * const isEqual = Bundler.equals(bundler1, bundler2);
 * ```
 */
export function equals(a, b) {
	const addrA = /** @type {import('../Address/AddressType.js').AddressType} */ (
		/** @type {unknown} */ (a)
	);
	const addrB = /** @type {import('../Address/AddressType.js').AddressType} */ (
		/** @type {unknown} */ (b)
	);
	return Address.equals(addrA, addrB);
}
