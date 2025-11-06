/**
 * Create Chain from a chain object (identity function)
 *
 * @param {import('../ChainType.js').Chain} chain - Chain object
 * @returns {import('../ChainType.js').Chain} Chain object
 *
 * @example
 * ```typescript
 * import { mainnet } from '@tevm/chains';
 * const chain = Chain.from(mainnet);
 * ```
 */
export function from(chain) {
	return chain;
}
