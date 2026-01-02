import { MAX } from "./constants.js";
import { Uint16NegativeError, Uint16OverflowError } from "./errors.js";

/**
 * Create Uint16 from bigint
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {bigint} value - bigint value
 * @returns {import('./Uint16Type.js').Uint16Type} Uint16 value
 * @throws {Uint16NegativeError} If value is negative
 * @throws {Uint16OverflowError} If value exceeds maximum (65535)
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const value = Uint16.fromBigint(65535n);
 * ```
 */
export function fromBigint(value) {
	if (value < 0n) {
		throw new Uint16NegativeError(`Uint16 value cannot be negative: ${value}`, {
			value,
		});
	}

	if (value > BigInt(MAX)) {
		throw new Uint16OverflowError(
			`Uint16 value exceeds maximum (65535): ${value}`,
			{ value },
		);
	}

	return /** @type {import('./Uint16Type.js').Uint16Type} */ (Number(value));
}
