import { MAX } from "./constants.js";

/**
 * Create Uint32 from bigint
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {bigint} value - bigint value
 * @returns {import('./BrandedUint32.js').BrandedUint32} Uint32 value
 * @throws {Error} If value is out of range
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const value = Uint32.fromBigInt(100n);
 * ```
 */
export function fromBigInt(value) {
	if (value < 0n) {
		throw new Error(`Uint32 value cannot be negative: ${value}`);
	}

	if (value > BigInt(MAX)) {
		throw new Error(`Uint32 value exceeds maximum: ${value}`);
	}

	return Number(value);
}
