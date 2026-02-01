import { KNOWN_CHAINS } from "./constants.js";

/**
 * Get the name of a known chain by ID
 *
 * @param {import('./ChainIdType.js').ChainIdType} chainId - Chain ID to look up
 * @returns {string | undefined} Chain name if known, undefined otherwise
 *
 * @example
 * ```typescript
 * import * as ChainId from '@voltaire/primitives/ChainId';
 *
 * ChainId.getChainName(ChainId.from(1)); // "Mainnet"
 * ChainId.getChainName(ChainId.from(10)); // "Optimism"
 * ChainId.getChainName(ChainId.from(999999)); // undefined
 * ```
 */
export function getChainName(chainId) {
	return KNOWN_CHAINS.get(chainId);
}
