import { MAX } from "./constants.js";

/**
 * Create Uint8 from bigint
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {bigint} value - bigint value
 * @returns {import('./BrandedUint8.js').BrandedUint8} Uint8 value
 * @throws {Error} If value is out of range
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const value = Uint8.fromBigint(255n);
 * ```
 */
export function fromBigint(value) {
	if (value < 0n) {
		throw new Error(`Uint8 value cannot be negative: ${value}`);
	}

	if (value > BigInt(MAX)) {
		throw new Error(`Uint8 value exceeds maximum (255): ${value}`);
	}

	return /** @type {import('./BrandedUint8.js').BrandedUint8} */ (
		Number(value)
	);
}
