import { getChainById } from "@tevm/chains";

/**
 * Get a chain by its chain ID
 *
 * @param {number} id - Chain ID
 * @returns {import('../ChainType.js').Chain | undefined} Chain object or undefined if not found
 *
 * @example
 * ```typescript
 * const mainnet = Chain.fromId(1);
 * const optimism = Chain.fromId(10);
 * ```
 */
export function fromId(id) {
	return getChainById(id);
}
