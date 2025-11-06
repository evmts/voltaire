import type { BrandedChainId } from "./BrandedChainId.js";
import { MAINNET } from "./constants.js";

/**
 * Check if chain ID is Ethereum mainnet
 *
 * @param this - Chain ID
 * @returns True if mainnet
 *
 * @example
 * ```typescript
 * const isMain = ChainId._isMainnet.call(chainId);
 * ```
 */
export function isMainnet(this: BrandedChainId): boolean {
	return this === MAINNET;
}
