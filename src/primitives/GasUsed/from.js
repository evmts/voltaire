import { InvalidFormatError } from "../errors/ValidationError.js";

/**
 * Create GasUsed from number, bigint, or string
 *
 * @param {number | bigint | string} value - Gas used value
 * @returns {import('./GasUsedType.js').GasUsedType} Branded gas used
 * @throws {InvalidFormatError} If value is negative
 *
 * @example
 * ```typescript
 * const gasUsed = GasUsed.from(51234n);
 * const fromReceipt = GasUsed.from(receipt.gasUsed);
 * ```
 */
export function from(value) {
	const bigintValue = typeof value === "bigint" ? value : BigInt(value);

	if (bigintValue < 0n) {
		throw new InvalidFormatError(
			`Gas used must be non-negative, got ${value}`,
			{
				value,
				expected: "Non-negative bigint",
				code: "GAS_USED_INVALID_FORMAT",
				docsPath: "/primitives/gas-used/from#error-handling",
			},
		);
	}

	return bigintValue;
}
