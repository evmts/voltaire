import { SIZE } from "./constants.js";

/**
 * Create zero address (standard form)
 *
 * @returns {import('./AddressType.js').AddressType} Zero address (0x0000...0000)
 *
 * @example
 * ```ts
 * const zero = Address.zero();
 * ```
 */
export function zero() {
	return /** @type {import('./AddressType.js').AddressType} */ (
		new Uint8Array(SIZE)
	);
}
