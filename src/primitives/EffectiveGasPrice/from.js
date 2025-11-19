import { InvalidFormatError } from "../errors/ValidationError.js";

/**
 * Create EffectiveGasPrice from bigint, number, or hex string
 *
 * @param {bigint | number | string} value - Effective price in Wei
 * @returns {import("./EffectiveGasPriceType.js").EffectiveGasPriceType} Branded effective gas price
 * @throws {InvalidFormatError} If value is negative or invalid format
 *
 * @example
 * ```typescript
 * const effectivePrice = EffectiveGasPrice.from(27000000000n); // 27 Gwei
 * const effectivePrice2 = EffectiveGasPrice.from("0x64da46800");
 * ```
 */
export function from(value) {
	let result;

	if (typeof value === "bigint") {
		result = value;
	} else if (typeof value === "number") {
		if (!Number.isInteger(value)) {
			throw new InvalidFormatError(
				`EffectiveGasPrice must be an integer, got ${value}`,
				{
					value,
					expected: "Integer",
					code: "EFFECTIVE_GAS_PRICE_INVALID_FORMAT",
					docsPath: "/primitives/effective-gas-price/from#error-handling",
				},
			);
		}
		result = BigInt(value);
	} else if (typeof value === "string") {
		if (value.startsWith("0x")) {
			result = BigInt(value);
		} else {
			throw new InvalidFormatError(
				`EffectiveGasPrice string must be hex with 0x prefix, got ${value}`,
				{
					value,
					expected: "Hex string with 0x prefix",
					code: "EFFECTIVE_GAS_PRICE_INVALID_FORMAT",
					docsPath: "/primitives/effective-gas-price/from#error-handling",
				},
			);
		}
	} else {
		throw new InvalidFormatError(
			`EffectiveGasPrice must be bigint, number, or hex string, got ${typeof value}`,
			{
				value,
				expected: "bigint | number | string",
				code: "EFFECTIVE_GAS_PRICE_INVALID_FORMAT",
				docsPath: "/primitives/effective-gas-price/from#error-handling",
			},
		);
	}

	if (result < 0n) {
		throw new InvalidFormatError(
			`EffectiveGasPrice cannot be negative, got ${result}`,
			{
				value: result,
				expected: "Non-negative value",
				code: "EFFECTIVE_GAS_PRICE_NEGATIVE",
				docsPath: "/primitives/effective-gas-price/from#error-handling",
			},
		);
	}

	return result;
}
