import { MAX } from "./constants.js";
import { Uint64NegativeError, Uint64OverflowError } from "./errors.js";

/**
 * Create Uint64 from bigint
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {bigint} value - bigint value
 * @returns {import('./Uint64Type.js').Uint64Type} Uint64 value
 * @throws {Uint64NegativeError} If value is negative
 * @throws {Uint64OverflowError} If value exceeds maximum
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const value = Uint64.fromBigInt(100n);
 * ```
 */
export function fromBigInt(value) {
	if (value < 0n) {
		throw new Uint64NegativeError(`Uint64 value cannot be negative: ${value}`, {
			value,
		});
	}

	if (value > MAX) {
		throw new Uint64OverflowError(`Uint64 value exceeds maximum: ${value}`, {
			value,
		});
	}

	return /** @type {import('./Uint64Type.js').Uint64Type} */ (value);
}
