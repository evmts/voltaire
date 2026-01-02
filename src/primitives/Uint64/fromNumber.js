import { MAX } from "./constants.js";
import {
	Uint64NegativeError,
	Uint64NotIntegerError,
	Uint64OverflowError,
} from "./errors.js";

/**
 * Create Uint64 from number
 * WARNING: Values above Number.MAX_SAFE_INTEGER may lose precision
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {number} value - number value
 * @returns {import('./Uint64Type.js').Uint64Type} Uint64 value
 * @throws {Uint64NotIntegerError} If value is not an integer
 * @throws {Uint64NegativeError} If value is negative
 * @throws {Uint64OverflowError} If value exceeds maximum
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const value = Uint64.fromNumber(42);
 * ```
 */
export function fromNumber(value) {
	if (!Number.isInteger(value)) {
		throw new Uint64NotIntegerError(
			`Uint64 value must be an integer: ${value}`,
			{ value },
		);
	}

	if (value < 0) {
		throw new Uint64NegativeError(
			`Uint64 value cannot be negative: ${value}`,
			{ value },
		);
	}

	const bigintValue = BigInt(Math.floor(value));

	if (bigintValue > MAX) {
		throw new Uint64OverflowError(
			`Uint64 value exceeds maximum: ${bigintValue}`,
			{ value: bigintValue },
		);
	}

	return /** @type {import('./Uint64Type.js').Uint64Type} */ (bigintValue);
}
