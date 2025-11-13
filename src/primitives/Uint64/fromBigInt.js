import { MAX } from "./constants.js";

/**
 * Create Uint64 from bigint
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {bigint} value - bigint value
 * @returns {import('./BrandedUint64.js').BrandedUint64} Uint64 value
 * @throws {Error} If value is out of range
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const value = Uint64.fromBigInt(100n);
 * ```
 */
export function fromBigInt(value) {
	if (value < 0n) {
		throw new Error(`Uint64 value cannot be negative: ${value}`);
	}

	if (value > MAX) {
		throw new Error(`Uint64 value exceeds maximum: ${value}`);
	}

	return value;
}
