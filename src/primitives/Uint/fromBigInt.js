import { MAX } from "./constants.js";

/**
 * Create Uint256 from bigint
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {bigint} value - bigint to convert
 * @returns {import('./BrandedUint.js').BrandedUint} Uint256 value
 * @throws {Error} If value out of range
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const value = Uint256.fromBigInt(100n);
 * ```
 */
export function fromBigInt(value) {
	if (value < 0n) {
		throw new Error(`Uint256 value cannot be negative: ${value}`);
	}

	if (value > MAX) {
		throw new Error(`Uint256 value exceeds maximum: ${value}`);
	}

	return value;
}
