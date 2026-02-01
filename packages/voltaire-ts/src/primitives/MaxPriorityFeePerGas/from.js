import { InvalidFormatError } from "../errors/ValidationError.js";

/**
 * Create MaxPriorityFeePerGas from bigint, number, or hex string
 *
 * @param {bigint | number | string} value - Priority fee in Wei
 * @returns {import("./MaxPriorityFeePerGasType.js").MaxPriorityFeePerGasType} Branded priority fee
 * @throws {InvalidFormatError} If value is negative or invalid format
 *
 * @example
 * ```typescript
 * const priorityFee = MaxPriorityFeePerGas.from(2000000000n); // 2 Gwei
 * const priorityFee2 = MaxPriorityFeePerGas.from("0x77359400");
 * ```
 */
export function from(value) {
	let result;

	if (typeof value === "bigint") {
		result = value;
	} else if (typeof value === "number") {
		if (!Number.isInteger(value)) {
			throw new InvalidFormatError(
				`MaxPriorityFeePerGas must be an integer, got ${value}`,
				{
					value,
					expected: "Integer",
					code: -32602,
					docsPath: "/primitives/max-priority-fee-per-gas/from#error-handling",
				},
			);
		}
		result = BigInt(value);
	} else if (typeof value === "string") {
		if (value.startsWith("0x")) {
			result = BigInt(value);
		} else {
			throw new InvalidFormatError(
				`MaxPriorityFeePerGas string must be hex with 0x prefix, got ${value}`,
				{
					value,
					expected: "Hex string with 0x prefix",
					code: -32602,
					docsPath: "/primitives/max-priority-fee-per-gas/from#error-handling",
				},
			);
		}
	} else {
		throw new InvalidFormatError(
			`MaxPriorityFeePerGas must be bigint, number, or hex string, got ${typeof value}`,
			{
				value,
				expected: "bigint | number | string",
				code: -32602,
				docsPath: "/primitives/max-priority-fee-per-gas/from#error-handling",
			},
		);
	}

	if (result < 0n) {
		throw new InvalidFormatError(
			`MaxPriorityFeePerGas cannot be negative, got ${result}`,
			{
				value: result,
				expected: "Non-negative value",
				code: -32602,
				docsPath: "/primitives/max-priority-fee-per-gas/from#error-handling",
			},
		);
	}

	return /** @type {import("./MaxPriorityFeePerGasType.js").MaxPriorityFeePerGasType} */ (
		result
	);
}
