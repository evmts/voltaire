import {
	IntegerOverflowError,
	IntegerUnderflowError,
	InvalidFormatError,
} from "../errors/index.js";
import { MAX, MIN } from "./constants.js";

/**
 * Create Int256 from bigint
 *
 * @see https://voltaire.tevm.sh/primitives/int256 for Int256 documentation
 * @since 0.0.0
 * @param {bigint} value - BigInt value
 * @returns {import('./Int256Type.js').BrandedInt256} Int256 value
 * @throws {InvalidFormatError} If value is not a bigint
 * @throws {IntegerOverflowError} If value exceeds maximum
 * @throws {IntegerUnderflowError} If value is below minimum
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.fromBigInt(-42n);
 * const b = Int256.fromBigInt(100n);
 * ```
 */
export function fromBigInt(value) {
	if (typeof value !== "bigint") {
		throw new InvalidFormatError(
			`Int256.fromBigInt requires bigint, got ${typeof value}`,
			{ value, expected: "bigint", docsPath: "/primitives/int256#from-bigint" },
		);
	}
	if (value > MAX) {
		throw new IntegerOverflowError(
			`Int256 value exceeds maximum (${MAX}): ${value}`,
			{
				value,
				max: MAX,
				type: "int256",
			},
		);
	}

	if (value < MIN) {
		throw new IntegerUnderflowError(
			`Int256 value below minimum (${MIN}): ${value}`,
			{
				value,
				min: MIN,
				type: "int256",
			},
		);
	}

	return /** @type {import('./Int256Type.js').BrandedInt256} */ (value);
}
