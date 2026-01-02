import {
	IntegerOverflowError,
	IntegerUnderflowError,
	InvalidFormatError,
} from "../errors/index.js";
import { MAX, MIN } from "./constants.js";

/**
 * Create Int256 from number
 *
 * @see https://voltaire.tevm.sh/primitives/int256 for Int256 documentation
 * @since 0.0.0
 * @param {number} value - Integer number
 * @returns {import('./Int256Type.js').BrandedInt256} Int256 value
 * @throws {InvalidFormatError} If value is not an integer
 * @throws {IntegerOverflowError} If value exceeds maximum
 * @throws {IntegerUnderflowError} If value is below minimum
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.fromNumber(-42);
 * const b = Int256.fromNumber(100);
 * ```
 */
export function fromNumber(value) {
	if (!Number.isInteger(value)) {
		throw new InvalidFormatError(`Int256 value must be an integer: ${value}`, {
			value,
			expected: "integer",
			docsPath: "/primitives/int256#from-number",
		});
	}

	const bigintValue = BigInt(value);

	if (bigintValue > MAX) {
		throw new IntegerOverflowError(`Int256 value exceeds maximum (${MAX}): ${bigintValue}`, {
			value: bigintValue,
			max: MAX,
			type: "int256",
		});
	}

	if (bigintValue < MIN) {
		throw new IntegerUnderflowError(`Int256 value below minimum (${MIN}): ${bigintValue}`, {
			value: bigintValue,
			min: MIN,
			type: "int256",
		});
	}

	return /** @type {import('./Int256Type.js').BrandedInt256} */ (bigintValue);
}
