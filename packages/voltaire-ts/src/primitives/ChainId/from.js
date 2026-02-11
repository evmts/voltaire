import { InvalidFormatError } from "../errors/ValidationError.js";

/**
 * Create ChainId from number or bigint
 *
 * @param {number | bigint} value - Chain ID number or bigint
 * @returns {import('./ChainIdType.js').ChainIdType} Branded chain ID
 * @throws {InvalidFormatError} If value is not a non-negative integer
 *
 * @example
 * ```typescript
 * const mainnet = ChainId.from(1);
 * const fromBigint = ChainId.from(1n);
 * const sepolia = ChainId.from(11155111);
 * ```
 */
export function from(value) {
	const num = typeof value === "bigint" ? Number(value) : value;
	if (!Number.isInteger(num) || num < 0) {
		throw new InvalidFormatError(
			`Chain ID must be non-negative integer, got ${value}`,
			{
				value,
				expected: "Non-negative integer",
				code: -32602,
				docsPath: "/primitives/chain-id/from#error-handling",
			},
		);
	}
	return /** @type {import('./ChainIdType.js').ChainIdType} */ (num);
}
