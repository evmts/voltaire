import type { BrandedChainId } from "./BrandedChainId.js";

/**
 * Convert ChainId to number
 *
 * @param this - Chain ID
 * @returns Number
 *
 * @example
 * ```typescript
 * const n = ChainId._toNumber.call(chainId);
 * ```
 */
export function toNumber(this: BrandedChainId): number {
	return this as number;
}
