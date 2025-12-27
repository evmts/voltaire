import { InvalidFormatError } from "../errors/ValidationError.js";

/**
 * Create MaxFeePerGas from bigint, number, or hex string
 *
 * @param {bigint | number | string} value - Max fee in Wei
 * @returns {import("./MaxFeePerGasType.js").MaxFeePerGasType} Branded max fee
 * @throws {InvalidFormatError} If value is negative or invalid format
 *
 * @example
 * ```typescript
 * const maxFee = MaxFeePerGas.from(100000000000n); // 100 Gwei
 * const maxFee2 = MaxFeePerGas.from("0x174876e800");
 * ```
 */
export function from(value) {
	let result;

	if (typeof value === "bigint") {
		result = value;
	} else if (typeof value === "number") {
		if (!Number.isInteger(value)) {
			throw new InvalidFormatError(
				`MaxFeePerGas must be an integer, got ${value}`,
				{
					value,
					expected: "Integer",
					code: "MAX_FEE_INVALID_FORMAT",
					docsPath: "/primitives/max-fee-per-gas/from#error-handling",
				},
			);
		}
		result = BigInt(value);
	} else if (typeof value === "string") {
		if (value.startsWith("0x")) {
			result = BigInt(value);
		} else {
			throw new InvalidFormatError(
				`MaxFeePerGas string must be hex with 0x prefix, got ${value}`,
				{
					value,
					expected: "Hex string with 0x prefix",
					code: "MAX_FEE_INVALID_FORMAT",
					docsPath: "/primitives/max-fee-per-gas/from#error-handling",
				},
			);
		}
	} else {
		throw new InvalidFormatError(
			`MaxFeePerGas must be bigint, number, or hex string, got ${typeof value}`,
			{
				value,
				expected: "bigint | number | string",
				code: "MAX_FEE_INVALID_FORMAT",
				docsPath: "/primitives/max-fee-per-gas/from#error-handling",
			},
		);
	}

	if (result < 0n) {
		throw new InvalidFormatError(
			`MaxFeePerGas cannot be negative, got ${result}`,
			{
				value: result,
				expected: "Non-negative value",
				code: "MAX_FEE_NEGATIVE",
				docsPath: "/primitives/max-fee-per-gas/from#error-handling",
			},
		);
	}

	return /** @type {import("./MaxFeePerGasType.js").MaxFeePerGasType} */ (
		result
	);
}
