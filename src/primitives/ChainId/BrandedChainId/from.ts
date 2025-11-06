import type { BrandedChainId } from "./BrandedChainId.js";

/**
 * Create ChainId from number
 *
 * @param value - Chain ID number
 * @returns Branded chain ID
 *
 * @example
 * ```typescript
 * const mainnet = ChainId.from(1);
 * const sepolia = ChainId.from(11155111);
 * ```
 */
export function from(value: number): BrandedChainId {
	if (!Number.isInteger(value) || value < 0) {
		throw new Error(`Chain ID must be non-negative integer, got ${value}`);
	}
	return value as BrandedChainId;
}
