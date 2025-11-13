import { MAX } from "./constants.js";

/**
 * Create Uint64 from number
 * WARNING: Values above Number.MAX_SAFE_INTEGER may lose precision
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {number} value - number value
 * @returns {import('./BrandedUint64.js').BrandedUint64} Uint64 value
 * @throws {Error} If value is out of range or invalid
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const value = Uint64.fromNumber(42);
 * ```
 */
export function fromNumber(value) {
	if (!Number.isInteger(value)) {
		throw new Error(`Uint64 value must be an integer: ${value}`);
	}

	if (value < 0) {
		throw new Error(`Uint64 value cannot be negative: ${value}`);
	}

	const bigintValue = BigInt(Math.floor(value));

	if (bigintValue > MAX) {
		throw new Error(`Uint64 value exceeds maximum: ${bigintValue}`);
	}

	return bigintValue;
}
