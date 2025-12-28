import {
	IntegerOverflowError,
	IntegerUnderflowError,
	InvalidFormatError,
} from "../errors/index.js";
import { MAX } from "./constants.js";

/**
 * Create Uint256 from bigint, number, or string (standard form)
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {bigint | number | string} value - bigint, number, or decimal/hex string
 * @returns {import('./BrandedUint.js').BrandedUint} Uint256 value
 * @throws {InvalidFormatError} If value is not a valid integer
 * @throws {IntegerUnderflowError} If value is negative
 * @throws {IntegerOverflowError} If value exceeds 2^256-1
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const a = Uint256.from(100n);
 * const b = Uint256.from("255");
 * const c = Uint256.from("0xff");
 * const d = Uint256.from(42);
 * ```
 */
export function from(value) {
	let bigintValue;

	if (typeof value === "string") {
		try {
			bigintValue = BigInt(value);
		} catch {
			throw new InvalidFormatError(`Invalid Uint256 string: ${value}`, {
				code: "UINT256_INVALID_STRING",
				value,
				expected: "decimal or 0x-prefixed hex string",
				docsPath: "/primitives/uint#error-handling",
			});
		}
	} else if (typeof value === "number") {
		if (!Number.isInteger(value)) {
			throw new InvalidFormatError(
				`Uint256 value must be an integer: ${value}`,
				{
					code: "UINT256_NOT_INTEGER",
					value,
					expected: "integer value",
					docsPath: "/primitives/uint#error-handling",
				},
			);
		}
		bigintValue = BigInt(value);
	} else {
		bigintValue = value;
	}

	if (bigintValue < 0n) {
		throw new IntegerUnderflowError(
			`Uint256 cannot be negative: ${bigintValue}`,
			{
				value: bigintValue,
				min: 0n,
				type: "uint256",
				docsPath: "/primitives/uint#error-handling",
			},
		);
	}

	if (bigintValue > MAX) {
		throw new IntegerOverflowError(
			`Uint256 exceeds maximum (2^256-1): ${bigintValue}`,
			{
				value: bigintValue,
				max: MAX,
				type: "uint256",
				docsPath: "/primitives/uint#error-handling",
			},
		);
	}

	return bigintValue;
}
