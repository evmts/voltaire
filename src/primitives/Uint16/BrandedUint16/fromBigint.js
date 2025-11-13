import { MAX } from "./constants.js";

/**
 * Create Uint16 from bigint
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {bigint} value - bigint value
 * @returns {import('./BrandedUint16.js').BrandedUint16} Uint16 value
 * @throws {Error} If value is out of range
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const value = Uint16.fromBigint(65535n);
 * ```
 */
export function fromBigint(value) {
	if (value < 0n) {
		throw new Error(`Uint16 value cannot be negative: ${value}`);
	}

	if (value > BigInt(MAX)) {
		throw new Error(`Uint16 value exceeds maximum (65535): ${value}`);
	}

	return /** @type {import('./BrandedUint16.js').BrandedUint16} */ (
		Number(value)
	);
}
