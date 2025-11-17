import { getChainById } from "@tevm/chains";

/**
 * Get a chain by its chain ID
 *
 * @see https://voltaire.tevm.sh/primitives/chain for Chain documentation
 * @since 0.0.0
 * @param {number} id - Chain ID
 * @returns {import('../ChainType.js').Chain | undefined} Chain object or undefined if not found
 * @throws {never}
 * @example
 * ```javascript
 * import * as Chain from './primitives/Chain/index.js';
 * const mainnet = Chain.fromId(1);
 * const optimism = Chain.fromId(10);
 * ```
 */
export function fromId(id) {
	return getChainById(id);
}
