import { SIZE } from "./constants.js";

/**
 * Create zero address (standard form)
 *
 * @returns {import('./BrandedAddress.js').BrandedAddress} Zero address (0x0000...0000)
 *
 * @example
 * ```typescript
 * const zero = Address.zero();
 * ```
 */
export function zero() {
	return /** @type {import('./BrandedAddress.js').BrandedAddress} */ (
		new Uint8Array(SIZE)
	);
}
