import { MAX } from "./constants.js";
import {
	Uint8NegativeError,
	Uint8NotIntegerError,
	Uint8OverflowError,
} from "./errors.js";

/**
 * Create Uint8 from number
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {number} value - number value
 * @returns {import('./Uint8Type.js').Uint8Type} Uint8 value
 * @throws {Uint8NotIntegerError} If value is not an integer
 * @throws {Uint8NegativeError} If value is negative
 * @throws {Uint8OverflowError} If value exceeds maximum (255)
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const value = Uint8.fromNumber(255);
 * ```
 */
export function fromNumber(value) {
	if (!Number.isInteger(value)) {
		throw new Uint8NotIntegerError(`Uint8 value must be an integer: ${value}`, {
			value,
		});
	}

	if (value < 0) {
		throw new Uint8NegativeError(`Uint8 value cannot be negative: ${value}`, {
			value,
		});
	}

	if (value > MAX) {
		throw new Uint8OverflowError(
			`Uint8 value exceeds maximum (255): ${value}`,
			{ value },
		);
	}

	return /** @type {import('./Uint8Type.js').Uint8Type} */ (value);
}
