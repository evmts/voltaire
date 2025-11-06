import type { BrandedChainId } from "./BrandedChainId.js";

/**
 * Check if two chain IDs are equal
 *
 * @param this - Chain ID
 * @param other - Other chain ID
 * @returns True if equal
 *
 * @example
 * ```typescript
 * const same = ChainId._equals.call(chainId1, chainId2);
 * ```
 */
export function equals(
	this: BrandedChainId,
	other: BrandedChainId,
): boolean {
	return this === other;
}
