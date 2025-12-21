import * as Address from "../Address/internal-index.js";

/**
 * Create Bundler from address input
 *
 * @param {number | bigint | string | Uint8Array | import('../Address/AddressType.js').AddressType} value - Address value
 * @returns {import('./BundlerType.js').BundlerType} Bundler address
 * @throws {Error} If address format is invalid
 *
 * @example
 * ```typescript
 * const bundler = Bundler.from("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
 * ```
 */
export function from(value) {
	const addr = Address.from(value);
	return /** @type {import('./BundlerType.js').BundlerType} */ (/** @type {unknown} */ (addr));
}
