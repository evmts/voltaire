import type { BrandedChainId } from "./BrandedChainId.js";
import { InvalidFormatError } from "../../errors/ValidationError.js";

/**
 * Create ChainId from number
 *
 * @param value - Chain ID number
 * @returns Branded chain ID
 * @throws {InvalidFormatError} If value is not a non-negative integer
 *
 * @example
 * ```typescript
 * const mainnet = ChainId.from(1);
 * const sepolia = ChainId.from(11155111);
 * ```
 */
export function from(value: number): BrandedChainId {
	if (!Number.isInteger(value) || value < 0) {
		throw new InvalidFormatError(
			`Chain ID must be non-negative integer, got ${value}`,
			{
				value,
				expected: "Non-negative integer",
				code: "CHAIN_ID_INVALID_FORMAT",
				docsPath: "/primitives/chain-id/from#error-handling",
			},
		);
	}
	return value as BrandedChainId;
}
